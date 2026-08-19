import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getOrganizationById } from "@/lib/db";
import { getUsageStatus } from "@/lib/usage";
import { DEFAULT_TEMPLATES } from "@/lib/templates";
import { getPlan } from "@/lib/plans";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }
    const org = await getOrganizationById(session.orgId);
    const usage = await getUsageStatus(session);
    const plan = getPlan(org?.plan);
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
      org: org
        ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            features: plan.features,
          }
        : null,
      usage,
    });
  } catch (error) {
    console.error("Session lookup failed", error);
    return NextResponse.json({ authenticated: false }, { status: 503 });
  }
}
