import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getUsageStatus } from "@/lib/usage";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    const status = await getUsageStatus(session);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Usage status failed", error);
    return NextResponse.json({ allowed: true, used: 0, limit: 500, plan: "free" });
  }
}
