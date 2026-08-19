import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrganizationPlan } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { PlanId } from "@/lib/plans";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const orgId = checkout.metadata?.orgId;
      const plan = (checkout.metadata?.plan ?? "pro") as PlanId;
      if (orgId) {
        await updateOrganizationPlan(
          orgId,
          plan,
          "active",
          typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id ?? null,
          typeof checkout.subscription === "string"
            ? checkout.subscription
            : checkout.subscription?.id ?? null,
        );
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.orgId;
      const plan = (subscription.metadata?.plan ?? "pro") as PlanId;
      if (orgId) {
        const active = subscription.status === "active" || subscription.status === "trialing";
        await updateOrganizationPlan(
          orgId,
          active ? plan : "free",
          subscription.status,
          typeof subscription.customer === "string" ? subscription.customer : null,
          subscription.id,
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
