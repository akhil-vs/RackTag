import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    const token = await createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const response = NextResponse.json({
      ok: true,
      user: { email: user.email, name: user.name, role: user.role, orgId: user.orgId },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Login unavailable." }, { status: 503 });
  }
}
