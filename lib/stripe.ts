import Stripe from "stripe";
import { getPlan, type PlanId } from "./plans";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export async function createCheckoutSession(input: {
  orgId: string;
  orgName: string;
  customerEmail: string;
  plan: Extract<PlanId, "pro">;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const plan = getPlan(input.plan);
  if (!plan.stripePriceId) {
    throw new Error("STRIPE_PRO_PRICE_ID is not configured.");
  }
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.customerEmail,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { orgId: input.orgId, orgName: input.orgName, plan: input.plan },
    subscription_data: {
      metadata: { orgId: input.orgId, plan: input.plan },
    },
  });
}
