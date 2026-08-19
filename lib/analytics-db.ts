import { sql } from "@vercel/postgres";
import { ensureSchema, isDatabaseConfigured } from "./db";

export { isDatabaseConfigured };

export type UsageEventInput = {
  sessionId: string;
  event: string;
  tab?: string | null;
  scanMode?: string | null;
  labelCode?: string | null;
  sheetCount?: number | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  orgId?: string | null;
  userId?: string | null;
};

export async function insertUsageEvent(input: UsageEventInput) {
  if (!isDatabaseConfigured()) return;
  await ensureSchema();
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null;
  await sql`
    INSERT INTO usage_events (
      session_id,
      event_type,
      tab,
      scan_mode,
      label_code,
      sheet_count,
      user_agent,
      metadata,
      org_id,
      user_id
    ) VALUES (
      ${input.sessionId},
      ${input.event},
      ${input.tab ?? null},
      ${input.scanMode ?? null},
      ${input.labelCode ?? null},
      ${input.sheetCount ?? null},
      ${input.userAgent ?? null},
      ${metadata},
      ${input.orgId ?? null},
      ${input.userId ?? null}
    )
  `;
}
