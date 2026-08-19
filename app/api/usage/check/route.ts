import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { assertBillableAction } from "@/lib/usage";

export async function POST(request: NextRequest) {
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const action = body.action?.trim() ?? "";
  if (!action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }

  try {
    const session = await getSessionFromCookies();
    const result = await assertBillableAction(session, action);
    if (!result.ok) {
      return NextResponse.json(result.status, { status: 402 });
    }
    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error("Usage check failed", error);
    return NextResponse.json({ allowed: true });
  }
}
