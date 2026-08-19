import { BILLABLE_EVENTS, getPlan } from "./plans";
import {
  getMonthlyLabelCount,
  getOrganizationById,
  isDatabaseConfigured,
} from "./db";
import type { SessionPayload } from "./auth";

export async function getUsageStatus(session: SessionPayload | null) {
  if (!isDatabaseConfigured()) {
    return { allowed: true, used: 0, limit: null as number | null, plan: "free" };
  }
  if (!session) {
    return { allowed: true, used: 0, limit: 500, plan: "free", anonymous: true };
  }
  const org = await getOrganizationById(session.orgId);
  if (!org) {
    return { allowed: false, used: 0, limit: 0, plan: "free", message: "Organization not found." };
  }
  const plan = getPlan(org.plan);
  const used = await getMonthlyLabelCount(org.id);
  const limit = org.monthlyLabelLimit ?? plan.monthlyLabelLimit;
  const allowed = limit == null || used < limit;
  return {
    allowed,
    used,
    limit,
    plan: org.plan,
    orgName: org.name,
    message: allowed
      ? undefined
      : `Monthly label limit reached (${used}/${limit}). Upgrade your plan in Admin → Billing.`,
  };
}

export async function assertBillableAction(
  session: SessionPayload | null,
  eventType: string,
) {
  if (!BILLABLE_EVENTS.has(eventType)) return { ok: true as const };
  const status = await getUsageStatus(session);
  if (status.allowed) return { ok: true as const };
  return { ok: false as const, status };
}
