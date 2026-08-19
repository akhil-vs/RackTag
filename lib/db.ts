import { sql } from "@vercel/postgres";
import { DEFAULT_TEMPLATES, parseOrgTemplates, type LabelTemplateConfig } from "./templates";
import { getPlan, type PlanId } from "./plans";

export { sql };

let schemaReady: Promise<void> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.POSTGRES_URL);
}

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: PlanId;
  monthlyLabelLimit: number | null;
  customTemplates: LabelTemplateConfig | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string;
  webhookUrl: string | null;
  ssoProvider: string | null;
  ssoDomain: string | null;
  createdAt: string;
};

export type User = {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: "operator" | "supervisor" | "admin";
  createdAt: string;
};

export type PilotLead = {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  interviewDate: string | null;
  notes: string | null;
  willingnessToPay: string | null;
  estimatedBudget: string | null;
  status: string;
  createdAt: string;
};

function rowToOrg(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    plan: String(row.plan) as PlanId,
    monthlyLabelLimit:
      row.monthly_label_limit == null ? null : Number(row.monthly_label_limit),
    customTemplates: row.custom_templates
      ? parseOrgTemplates(
          typeof row.custom_templates === "string"
            ? JSON.parse(row.custom_templates)
            : row.custom_templates,
        )
      : null,
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id
      ? String(row.stripe_subscription_id)
      : null,
    subscriptionStatus: String(row.subscription_status ?? "inactive"),
    webhookUrl: row.webhook_url ? String(row.webhook_url) : null,
    ssoProvider: row.sso_provider ? String(row.sso_provider) : null,
    ssoDomain: row.sso_domain ? String(row.sso_domain) : null,
    createdAt: String(row.created_at),
  };
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role) as User["role"],
    createdAt: String(row.created_at),
  };
}

export async function ensureSchema() {
  if (!isDatabaseConfigured()) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
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
        )
      `;
      await sql`
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
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          password_hash TEXT,
          role TEXT NOT NULL DEFAULT 'operator',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS sites (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
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
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS api_keys (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          key_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          last_used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS webhook_deliveries (
          id TEXT PRIMARY KEY,
          org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          payload JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          response_status INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON usage_events (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS usage_events_event_type_idx ON usage_events (event_type)`;
      await sql`CREATE INDEX IF NOT EXISTS usage_events_org_id_idx ON usage_events (org_id)`;
      await sql`CREATE INDEX IF NOT EXISTS users_org_id_idx ON users (org_id)`;
      await sql`ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS org_id TEXT`;
      await sql`ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS user_id TEXT`;
    })();
  }
  await schemaReady;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM organizations WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToOrg(rows[0]) : null;
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM organizations WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? rowToOrg(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string | null }) | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
  if (!rows[0]) return null;
  const user = rowToUser(rows[0]);
  return { ...user, passwordHash: rows[0].password_hash ? String(rows[0].password_hash) : null };
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function createOrganization(input: {
  id: string;
  name: string;
  slug: string;
  plan?: PlanId;
  customTemplates?: LabelTemplateConfig;
}): Promise<Organization> {
  await ensureSchema();
  const plan = getPlan(input.plan ?? "free");
  await sql`
    INSERT INTO organizations (id, name, slug, plan, monthly_label_limit, custom_templates)
    VALUES (
      ${input.id},
      ${input.name},
      ${input.slug},
      ${plan.id},
      ${plan.monthlyLabelLimit},
      ${input.customTemplates ? JSON.stringify(input.customTemplates) : null}
    )
  `;
  const org = await getOrganizationById(input.id);
  if (!org) throw new Error("Failed to create organization");
  return org;
}

export async function createUser(input: {
  id: string;
  orgId: string;
  email: string;
  name: string;
  passwordHash: string | null;
  role?: User["role"];
}): Promise<User> {
  await ensureSchema();
  await sql`
    INSERT INTO users (id, org_id, email, name, password_hash, role)
    VALUES (
      ${input.id},
      ${input.orgId},
      ${input.email.toLowerCase()},
      ${input.name},
      ${input.passwordHash},
      ${input.role ?? "admin"}
    )
  `;
  const user = await getUserById(input.id);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function updateOrganizationPlan(
  orgId: string,
  plan: PlanId,
  subscriptionStatus = "active",
  stripeCustomerId?: string | null,
  stripeSubscriptionId?: string | null,
) {
  await ensureSchema();
  const planDef = getPlan(plan);
  await sql`
    UPDATE organizations
    SET
      plan = ${planDef.id},
      monthly_label_limit = ${planDef.monthlyLabelLimit},
      subscription_status = ${subscriptionStatus},
      stripe_customer_id = COALESCE(${stripeCustomerId ?? null}, stripe_customer_id),
      stripe_subscription_id = COALESCE(${stripeSubscriptionId ?? null}, stripe_subscription_id)
    WHERE id = ${orgId}
  `;
}

export async function getOrgTemplates(orgId: string): Promise<LabelTemplateConfig> {
  const org = await getOrganizationById(orgId);
  if (!org?.customTemplates) return DEFAULT_TEMPLATES;
  return org.customTemplates;
}

export async function listOrganizations(): Promise<Organization[]> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM organizations ORDER BY created_at DESC`;
  return rows.map(rowToOrg);
}

export async function listPilotLeads(): Promise<PilotLead[]> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM pilot_leads ORDER BY created_at DESC`;
  return rows.map((row) => ({
    id: String(row.id),
    companyName: String(row.company_name),
    contactName: row.contact_name ? String(row.contact_name) : null,
    contactEmail: row.contact_email ? String(row.contact_email) : null,
    interviewDate: row.interview_date ? String(row.interview_date) : null,
    notes: row.notes ? String(row.notes) : null,
    willingnessToPay: row.willingness_to_pay ? String(row.willingness_to_pay) : null,
    estimatedBudget: row.estimated_budget ? String(row.estimated_budget) : null,
    status: String(row.status),
    createdAt: String(row.created_at),
  }));
}

export async function upsertPilotLead(input: {
  id: string;
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  interviewDate?: string | null;
  notes?: string | null;
  willingnessToPay?: string | null;
  estimatedBudget?: string | null;
  status?: string;
}) {
  await ensureSchema();
  await sql`
    INSERT INTO pilot_leads (
      id, company_name, contact_name, contact_email, interview_date,
      notes, willingness_to_pay, estimated_budget, status
    ) VALUES (
      ${input.id},
      ${input.companyName},
      ${input.contactName ?? null},
      ${input.contactEmail ?? null},
      ${input.interviewDate ?? null},
      ${input.notes ?? null},
      ${input.willingnessToPay ?? null},
      ${input.estimatedBudget ?? null},
      ${input.status ?? "prospect"}
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      contact_name = EXCLUDED.contact_name,
      contact_email = EXCLUDED.contact_email,
      interview_date = EXCLUDED.interview_date,
      notes = EXCLUDED.notes,
      willingness_to_pay = EXCLUDED.willingness_to_pay,
      estimated_budget = EXCLUDED.estimated_budget,
      status = EXCLUDED.status
  `;
}

export async function getUsageInsights(days = 30) {
  await ensureSchema();
  const { rows: summary } = await sql`
    SELECT
      COUNT(*) FILTER (WHERE event_type IN ('download_png', 'add_to_sheet', 'print_sheet')) AS labels_generated,
      COUNT(DISTINCT session_id) AS unique_sessions,
      COUNT(*) FILTER (WHERE event_type = 'scan_barcode') AS barcode_scans,
      COUNT(*) FILTER (WHERE event_type = 'scan_text') AS text_scans,
      COUNT(*) FILTER (WHERE event_type = 'print_sheet') AS print_sheets,
      COUNT(*) FILTER (WHERE event_type = 'app_open') AS app_opens
    FROM usage_events
    WHERE created_at >= NOW() - (${days}::text || ' days')::interval
  `;
  const { rows: daily } = await sql`
    SELECT
      DATE(created_at) AS day,
      COUNT(*) FILTER (WHERE event_type IN ('download_png', 'add_to_sheet', 'print_sheet')) AS labels,
      COUNT(DISTINCT session_id) AS sessions
    FROM usage_events
    WHERE created_at >= NOW() - (${days}::text || ' days')::interval
    GROUP BY DATE(created_at)
    ORDER BY day DESC
  `;
  const { rows: byTab } = await sql`
    SELECT tab, COUNT(*) AS count
    FROM usage_events
    WHERE created_at >= NOW() - (${days}::text || ' days')::interval
      AND tab IS NOT NULL
    GROUP BY tab
    ORDER BY count DESC
  `;
  const { rows: scanRatio } = await sql`
    SELECT
      COUNT(*) FILTER (WHERE event_type IN ('scan_barcode', 'scan_text')) AS scans,
      COUNT(*) FILTER (WHERE event_type = 'tab_change' AND tab = 'scan') AS scan_tab_visits
    FROM usage_events
    WHERE created_at >= NOW() - (${days}::text || ' days')::interval
  `;
  const { rows: pilotReady } = await sql`
    SELECT COUNT(*) AS willing
    FROM pilot_leads
    WHERE willingness_to_pay IN ('yes', 'maybe') AND status IN ('interviewed', 'pilot')
  `;
  return { summary: summary[0], daily, byTab, scanRatio: scanRatio[0], pilotReady: pilotReady[0] };
}

export async function getMonthlyLabelCount(orgId: string | null): Promise<number> {
  await ensureSchema();
  if (!orgId) return 0;
  const { rows } = await sql`
    SELECT COUNT(*) AS count
    FROM usage_events
    WHERE org_id = ${orgId}
      AND event_type IN ('download_png', 'add_to_sheet', 'print_sheet')
      AND created_at >= DATE_TRUNC('month', NOW())
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function updateOrganizationTemplates(orgId: string, templates: LabelTemplateConfig) {
  await ensureSchema();
  await sql`
    UPDATE organizations
    SET custom_templates = ${JSON.stringify(parseOrgTemplates(templates))}::jsonb
    WHERE id = ${orgId}
  `;
}

export async function updateOrganizationSso(
  orgId: string,
  ssoProvider: string | null,
  ssoDomain: string | null,
) {
  await ensureSchema();
  await sql`
    UPDATE organizations
    SET sso_provider = ${ssoProvider}, sso_domain = ${ssoDomain}
    WHERE id = ${orgId}
  `;
}

export async function activatePilotPlan(orgId: string) {
  await ensureSchema();
  await sql`
    UPDATE organizations
    SET plan = 'pilot', monthly_label_limit = 10000, subscription_status = 'active'
    WHERE id = ${orgId}
  `;
}

export async function findOrganizationBySsoDomain(domain: string) {
  await ensureSchema();
  const slug = domain.replace(/\./g, "-");
  const { rows } = await sql`
    SELECT * FROM organizations
    WHERE sso_domain = ${domain} OR slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ? rowToOrg(rows[0]) : null;
}

export async function markOrganizationEnterpriseSso(orgId: string, domain: string) {
  await ensureSchema();
  await sql`
    UPDATE organizations
    SET sso_provider = 'oidc', sso_domain = ${domain}, subscription_status = 'active', plan = 'enterprise'
    WHERE id = ${orgId}
  `;
}

export async function getAuditEvents(orgId: string, limit = 5000) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT
      ue.created_at,
      ue.event_type,
      ue.tab,
      ue.label_code,
      ue.sheet_count,
      u.email AS user_email,
      u.name AS user_name
    FROM usage_events ue
    LEFT JOIN users u ON u.id = ue.user_id
    WHERE ue.org_id = ${orgId}
    ORDER BY ue.created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}
