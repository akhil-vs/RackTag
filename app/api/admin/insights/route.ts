import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionFromRequest, requireAdminRole } from "@/lib/session";
import { getUsageInsights, listPilotLeads, upsertPilotLead } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!requireAdminRole(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  try {
    const insights = await getUsageInsights(Number.isFinite(days) ? days : 30);
    const leads = await listPilotLeads();
    return NextResponse.json({ insights, leads });
  } catch (error) {
    console.error("Insights failed", error);
    return NextResponse.json({ error: "Failed to load insights." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: Record<string, string | null | undefined>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const companyName = body.companyName?.trim();
  if (!companyName) {
    return NextResponse.json({ error: "companyName is required." }, { status: 400 });
  }

  try {
    const id = typeof body.id === "string" && body.id ? body.id : crypto.randomUUID();
    await upsertPilotLead({
      id,
      companyName,
      contactName: body.contactName ?? null,
      contactEmail: body.contactEmail ?? null,
      interviewDate: body.interviewDate ?? null,
      notes: body.notes ?? null,
      willingnessToPay: body.willingnessToPay ?? null,
      estimatedBudget: body.estimatedBudget ?? null,
      status: body.status ?? "prospect",
    });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("Pilot lead save failed", error);
    return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
  }
}
