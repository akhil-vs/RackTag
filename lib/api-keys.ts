import crypto from "crypto";
import { sql, ensureSchema, getOrganizationById } from "./db";

export function hashApiKey(rawKey: string) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey() {
  const raw = `rtk_${crypto.randomBytes(24).toString("hex")}`;
  return { raw, hash: hashApiKey(raw) };
}

export async function createApiKey(orgId: string, name: string) {
  await ensureSchema();
  const { raw, hash } = generateApiKey();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO api_keys (id, org_id, key_hash, name)
    VALUES (${id}, ${orgId}, ${hash}, ${name})
  `;
  return { id, raw, name };
}

export async function authenticateApiKey(rawKey: string) {
  await ensureSchema();
  const hash = hashApiKey(rawKey);
  const { rows } = await sql`
    SELECT ak.*, o.plan, o.subscription_status
    FROM api_keys ak
    JOIN organizations o ON o.id = ak.org_id
    WHERE ak.key_hash = ${hash}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  await sql`UPDATE api_keys SET last_used_at = NOW() WHERE id = ${rows[0].id}`;
  return {
    orgId: String(rows[0].org_id),
    keyId: String(rows[0].id),
    plan: String(rows[0].plan),
    subscriptionStatus: String(rows[0].subscription_status),
  };
}

export async function listApiKeys(orgId: string) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, name, last_used_at, created_at
    FROM api_keys
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
    createdAt: String(row.created_at),
  }));
}

export async function deleteApiKey(orgId: string, keyId: string) {
  await ensureSchema();
  await sql`DELETE FROM api_keys WHERE id = ${keyId} AND org_id = ${orgId}`;
}
