import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getOrgTemplates } from "@/lib/db";
import { DEFAULT_TEMPLATES } from "@/lib/templates";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ templates: DEFAULT_TEMPLATES, authenticated: false });
    }
    const templates = await getOrgTemplates(session.orgId);
    return NextResponse.json({ templates, authenticated: true, orgId: session.orgId });
  } catch (error) {
    console.error("Org config failed", error);
    return NextResponse.json({ templates: DEFAULT_TEMPLATES, authenticated: false });
  }
}
