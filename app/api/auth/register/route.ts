import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createOrganization, createUser, isDatabaseConfigured } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken) {
    return NextResponse.json({ error: "Setup is disabled." }, { status: 403 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${setupToken}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    orgName?: string;
    orgSlug?: string;
    adminEmail?: string;
    adminName?: string;
    adminPassword?: string;
    plan?: "free" | "pilot" | "pro" | "enterprise";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const orgName = body.orgName?.trim();
  const orgSlug = body.orgSlug?.trim().toLowerCase();
  const adminEmail = body.adminEmail?.trim().toLowerCase();
  const adminName = body.adminName?.trim();
  const adminPassword = body.adminPassword ?? "";

  if (!orgName || !orgSlug || !adminEmail || !adminName || adminPassword.length < 8) {
    return NextResponse.json(
      { error: "orgName, orgSlug, adminEmail, adminName, and adminPassword (8+) are required." },
      { status: 400 },
    );
  }

  try {
    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    await createOrganization({
      id: orgId,
      name: orgName,
      slug: orgSlug,
      plan: body.plan ?? "free",
    });
    await createUser({
      id: userId,
      orgId,
      email: adminEmail,
      name: adminName,
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
    });
    return NextResponse.json({ ok: true, orgId, userId, slug: orgSlug });
  } catch (error) {
    console.error("Setup failed", error);
    return NextResponse.json({ error: "Setup failed. Slug or email may already exist." }, { status: 409 });
  }
}
