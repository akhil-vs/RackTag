export type PlanId = "free" | "pilot" | "pro" | "enterprise";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  monthlyLabelLimit: number | null;
  stripePriceId?: string;
  features: string[];
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free / Evaluation",
    monthlyLabelLimit: 500,
    features: ["basic_labels"],
  },
  pilot: {
    id: "pilot",
    name: "Paid Pilot",
    monthlyLabelLimit: 10_000,
    features: ["basic_labels", "custom_templates", "audit_export"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyLabelLimit: null,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ["basic_labels", "custom_templates", "audit_export", "email_support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyLabelLimit: null,
    features: [
      "basic_labels",
      "custom_templates",
      "audit_export",
      "sso",
      "api",
      "webhooks",
      "sla",
    ],
  },
};

export const BILLABLE_EVENTS = new Set([
  "download_png",
  "add_to_sheet",
  "print_sheet",
]);

export function getPlan(planId: string | null | undefined): PlanDefinition {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.free;
}
