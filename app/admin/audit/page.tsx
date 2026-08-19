export default function AuditPage() {
  return (
    <section className="admin-card">
      <h1>Audit export</h1>
      <p className="admin-muted">
        Download immutable usage events for your organization: user, timestamp, label code, and action.
      </p>
      <a className="admin-button" href="/api/admin/audit/export">
        Download CSV audit log
      </a>
      <p className="admin-muted" style={{ marginTop: 16 }}>
        Included on Pilot, Pro, and Enterprise plans. Events are recorded when signed-in users print, download, or add labels.
      </p>
    </section>
  );
}
