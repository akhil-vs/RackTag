import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import {
  createOrganization,
  createUser,
  findOrganizationBySsoDomain,
  getOrganizationById,
  getUserByEmail,
  markOrganizationEnterpriseSso,
} from "@/lib/db";

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

  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const savedState = request.cookies.get("racktag_sso_state")?.value;
  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=sso_state", request.url));
  }

  try {
    const tokenRes = await fetch(`${config.issuer}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) throw new Error("Missing access token");

    const profileRes = await fetch(`${config.issuer}/oauth2/v2.0/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) throw new Error("Profile fetch failed");
    const profile = (await profileRes.json()) as {
      email?: string;
      name?: string;
      preferred_username?: string;
    };
    const email = (profile.email ?? profile.preferred_username)?.toLowerCase();
    const name = profile.name ?? email;
    if (!email || !name) throw new Error("Missing profile email");

    let user = await getUserByEmail(email);
    if (!user) {
      const domain = email.split("@")[1] ?? "unknown";
      const existingOrg = await findOrganizationBySsoDomain(domain);
      let orgId: string;
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        orgId = crypto.randomUUID();
        await createOrganization({
          id: orgId,
          name: domain,
          slug: domain.replace(/\./g, "-"),
          plan: "enterprise",
        });
        await markOrganizationEnterpriseSso(orgId, domain);
      }
      const userId = crypto.randomUUID();
      await createUser({
        id: userId,
        orgId,
        email,
        name,
        passwordHash: null,
        role: "operator",
      });
      user = await getUserByEmail(email);
    }

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=sso_failed", request.url));
    }

    const org = await getOrganizationById(user.orgId);
    if (org?.plan !== "enterprise" && org?.plan !== "pro" && org?.plan !== "pilot") {
      return NextResponse.redirect(new URL("/login?error=sso_plan", request.url));
    }

    const token = await createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(sessionCookieOptions(token));
    response.cookies.set("racktag_sso_state", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("SSO callback failed", error);
    return NextResponse.redirect(new URL("/login?error=sso_failed", request.url));
  }
}
