"use client";

import { FormEvent, useEffect, useState } from "react";

type Lead = {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  interviewDate: string | null;
  willingnessToPay: string | null;
  estimatedBudget: string | null;
  status: string;
  notes: string | null;
};

const emptyLead = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  interviewDate: "",
  willingnessToPay: "maybe",
  estimatedBudget: "",
  status: "prospect",
  notes: "",
};

export default function PilotPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState(emptyLead);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadLeads() {
    const response = await fetch("/api/admin/insights");
    if (!response.ok) return;
    const data = await response.json();
    setLeads(data.leads ?? []);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function saveLead(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!response.ok) {
      setMessage("Failed to save lead.");
      return;
    }
    setForm(emptyLead);
    setMessage("Lead saved.");
    loadLeads();
  }

  async function activatePilot() {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate_pilot" }),
    });
    setMessage(response.ok ? "Pilot plan activated for your organization." : "Failed to activate pilot plan.");
  }

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h1>Paid pilot tracker</h1>
        <p className="admin-muted">
          Log enterprise interviews and track willingness to pay before major engineering investment.
        </p>
        <form className="admin-form" onSubmit={saveLead}>
          <label>
            Company
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
          </label>
          <label>
            Contact name
            <input
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </label>
          <label>
            Contact email
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </label>
          <label>
            Interview date
            <input
              type="date"
              value={form.interviewDate}
              onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
            />
          </label>
          <label>
            Willingness to pay
            <select
              value={form.willingnessToPay}
              onChange={(e) => setForm({ ...form, willingnessToPay: e.target.value })}
            >
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Estimated budget
            <input
              value={form.estimatedBudget}
              onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
              placeholder="$500/mo or $5k annual"
            />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="prospect">Prospect</option>
              <option value="interviewed">Interviewed</option>
              <option value="pilot">Pilot</option>
              <option value="customer">Customer</option>
              <option value="lost">Lost</option>
            </select>
          </label>
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
            />
          </label>
          <button type="submit" disabled={loading}>
            Save lead
          </button>
        </form>
        {message ? <p>{message}</p> : null}
      </section>

      <section className="admin-card">
        <h2>Manual pilot activation</h2>
        <p className="admin-muted">
          Enable pilot tier (custom templates + audit export + 10k labels/month) before Stripe checkout.
        </p>
        <button type="button" onClick={activatePilot}>
          Activate pilot plan
        </button>
      </section>

      <section className="admin-card">
        <h2>Pipeline</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Status</th>
              <th>WTP</th>
              <th>Budget</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.companyName}</td>
                <td>{lead.status}</td>
                <td>{lead.willingnessToPay ?? "—"}</td>
                <td>{lead.estimatedBudget ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
