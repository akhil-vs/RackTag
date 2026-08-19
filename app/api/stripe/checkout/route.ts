import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  try {
    const checkout = await createCheckoutSession({
      orgId: session.orgId,
      orgName: session.name,
      customerEmail: session.email,
      plan: "pro",
      successUrl: `${origin}/admin/billing?success=1`,
      cancelUrl: `${origin}/admin/billing?canceled=1`,
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Checkout failed", error);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
