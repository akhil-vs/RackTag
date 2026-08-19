import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function getOidcConfig(origin: string) {
  const issuer = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;
  if (!issuer || !clientId || !clientSecret) return null;
  return {
    issuer: issuer.replace(/\/$/, ""),
    clientId,
    clientSecret,
    redirectUri: process.env.OIDC_REDIRECT_URI ?? `${origin}/api/auth/sso/callback`,
  };
}

export async function GET(request: NextRequest) {
  const config = getOidcConfig(request.nextUrl.origin);
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=sso_not_configured", request.url));
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: config.redirectUri,
    state,
  });

  const response = NextResponse.redirect(`${config.issuer}/oauth2/v2.0/authorize?${params}`);
  response.cookies.set("racktag_sso_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
