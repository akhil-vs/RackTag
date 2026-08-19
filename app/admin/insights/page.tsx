import { getSessionFromCookies } from "@/lib/auth";
import { getOrganizationById, getUsageInsights, listPilotLeads, isDatabaseConfigured } from "@/lib/db";

export default async function InsightsPage() {
  const session = await getSessionFromCookies();
  const org = session ? await getOrganizationById(session.orgId) : null;
  const dbReady = isDatabaseConfigured();
  const insights = dbReady ? await getUsageInsights(30) : null;
  const leads = dbReady ? await listPilotLeads() : [];

  const summary = insights?.summary as Record<string, string> | undefined;
  const willingCount = Number(insights?.pilotReady?.willing ?? 0);
  const interviewed = leads.filter((l) => l.status === "interviewed" || l.status === "pilot").length;

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h1>Demand validation</h1>
        <p className="admin-muted">
          Phase 1 exit criteria: at least 1 pilot customer willing to pay $500+/month or $5k+ annual.
        </p>
        {!dbReady ? (
          <p className="admin-error">Postgres is not configured. Connect Vercel Postgres to query usage_events.</p>
        ) : (
          <>
            <div className="admin-metrics">
              <Metric label="Labels (30d)" value={summary?.labels_generated ?? "0"} />
              <Metric label="Unique sessions" value={summary?.unique_sessions ?? "0"} />
              <Metric label="Print sheets" value={summary?.print_sheets ?? "0"} />
              <Metric label="Barcode scans" value={summary?.barcode_scans ?? "0"} />
              <Metric label="Text scans" value={summary?.text_scans ?? "0"} />
              <Metric label="Pilot-ready leads" value={String(willingCount)} />
              <Metric label="Interviews logged" value={String(interviewed)} />
            </div>
            <h2>Daily labels</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Labels</th>
                  <th>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {(insights?.daily ?? []).map((row) => (
                  <tr key={String(row.day)}>
                    <td>{String(row.day)}</td>
                    <td>{String(row.labels)}</td>
                    <td>{String(row.sessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="admin-card">
        <h2>Your organization</h2>
        {org ? (
          <ul className="admin-list">
            <li>Plan: {org.plan}</li>
            <li>Status: {org.subscriptionStatus}</li>
            <li>Monthly label limit: {org.monthlyLabelLimit ?? "Unlimited"}</li>
          </ul>
        ) : (
          <p className="admin-muted">No organization loaded.</p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-metric">
      <div className="admin-metric-value">{value}</div>
      <div className="admin-metric-label">{label}</div>
    </div>
  );
}
