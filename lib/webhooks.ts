import crypto from "crypto";
import { ensureSchema, getOrganizationById, sql } from "./db";

export async function dispatchWebhook(orgId: string, eventType: string, payload: Record<string, unknown>) {
  await ensureSchema();
  const org = await getOrganizationById(orgId);
  if (!org?.webhookUrl) return null;

  const id = crypto.randomUUID();
  const body = JSON.stringify({
    id,
    type: eventType,
    created_at: new Date().toISOString(),
    data: payload,
  });

  let responseStatus: number | null = null;
  let status = "failed";
  try {
    const response = await fetch(org.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RackTag-Webhooks/1.0",
        "X-RackTag-Event": eventType,
      },
      body,
    });
    responseStatus = response.status;
    status = response.ok ? "delivered" : "failed";
  } catch {
    status = "failed";
  }

  await sql`
    INSERT INTO webhook_deliveries (id, org_id, event_type, payload, status, response_status)
    VALUES (${id}, ${orgId}, ${eventType}, ${body}::jsonb, ${status}, ${responseStatus})
  `;
  return { id, status, responseStatus };
}

export async function updateWebhookUrl(orgId: string, webhookUrl: string | null) {
  await ensureSchema();
  await sql`UPDATE organizations SET webhook_url = ${webhookUrl} WHERE id = ${orgId}`;
}

export async function listWebhookDeliveries(orgId: string, limit = 50) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, event_type, status, response_status, created_at
    FROM webhook_deliveries
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({
    id: String(row.id),
    eventType: String(row.event_type),
    status: String(row.status),
    responseStatus: row.response_status == null ? null : Number(row.response_status),
    createdAt: String(row.created_at),
  }));
}
