import { sql } from "@vercel/postgres";

let tableReady: Promise<void> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.POSTGRES_URL);
}

export async function ensureAnalyticsTable() {
  if (!isDatabaseConfigured()) return;
  if (!tableReady) {
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS usage_events (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        tab TEXT,
        scan_mode TEXT,
        label_code TEXT,
        sheet_count INTEGER,
        user_agent TEXT,
        metadata JSONB
      )
    `.then(() => undefined);
  }
  await tableReady;
}

export type UsageEventInput = {
  sessionId: string;
  event: string;
  tab?: string | null;
  scanMode?: string | null;
  labelCode?: string | null;
  sheetCount?: number | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function insertUsageEvent(input: UsageEventInput) {
  await ensureAnalyticsTable();
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
      metadata
    ) VALUES (
      ${input.sessionId},
      ${input.event},
      ${input.tab ?? null},
      ${input.scanMode ?? null},
      ${input.labelCode ?? null},
      ${input.sheetCount ?? null},
      ${input.userAgent ?? null},
      ${metadata}
    )
  `;
}
