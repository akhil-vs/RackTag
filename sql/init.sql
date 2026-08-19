-- RackTag enterprise schema (run in Vercel Postgres Query tab)

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
  metadata JSONB,
  org_id TEXT,
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  monthly_label_limit INTEGER,
  custom_templates JSONB,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  webhook_url TEXT,
  sso_provider TEXT,
  sso_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pilot_leads (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  interview_date DATE,
  notes TEXT,
  willingness_to_pay TEXT,
  estimated_budget TEXT,
  status TEXT NOT NULL DEFAULT 'prospect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS usage_events_event_type_idx ON usage_events (event_type);
CREATE INDEX IF NOT EXISTS usage_events_org_id_idx ON usage_events (org_id);
CREATE INDEX IF NOT EXISTS users_org_id_idx ON users (org_id);
