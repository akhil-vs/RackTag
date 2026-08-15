-- Run once in the Vercel Postgres query tab (Storage → your database → Query)
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
);

CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS usage_events_event_type_idx ON usage_events (event_type);
CREATE INDEX IF NOT EXISTS usage_events_session_id_idx ON usage_events (session_id);
