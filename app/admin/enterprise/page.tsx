"use client";

import { FormEvent, useEffect, useState } from "react";

type SettingsData = {
  org: {
    webhookUrl: string | null;
    customTemplates: unknown;
  } | null;
  keys: Array<{ id: string; name: string; lastUsedAt: string | null; createdAt: string }>;
  deliveries: Array<{ id: string; eventType: string; status: string; createdAt: string }>;
};

export default function EnterprisePage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKeyName, setApiKeyName] = useState("WMS integration");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [templatesJson, setTemplatesJson] = useState("");
  const [message, setMessage] = useState("");

  async function loadSettings() {
    const response = await fetch("/api/admin/settings");
    if (!response.ok) return;
    const json = await response.json();
    setData(json);
    setWebhookUrl(json.org?.webhookUrl ?? "");
    setTemplatesJson(JSON.stringify(json.org?.customTemplates ?? {}, null, 2));
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function postAction(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "Request failed.");
      return null;
    }
    return json;
  }

  async function onSaveWebhook(event: FormEvent) {
    event.preventDefault();
    await postAction({ action: "update_webhook", webhookUrl: webhookUrl || null });
    setMessage("Webhook URL saved.");
    loadSettings();
  }

  async function onCreateApiKey(event: FormEvent) {
    event.preventDefault();
    const json = await postAction({ action: "create_api_key", apiKeyName });
    if (json?.apiKey?.raw) {
      setNewApiKey(json.apiKey.raw);
      setMessage("Copy this API key now. It will not be shown again.");
      loadSettings();
    }
  }

  async function onSaveTemplates(event: FormEvent) {
    event.preventDefault();
    try {
      const templates = JSON.parse(templatesJson);
      await postAction({ action: "update_templates", templates });
      setMessage("Custom label templates saved.");
    } catch {
      setMessage("Invalid JSON for templates.");
    }
  }

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h1>Enterprise integrations</h1>
        <p className="admin-muted">
          SSO (OIDC), REST API, and WMS webhooks — enable after your first paying enterprise customer requests them.
        </p>
        <ul className="admin-list">
          <li>
            SSO: set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, then use{" "}
            <a href="/api/auth/sso">/api/auth/sso</a>
          </li>
          <li>REST API: POST `/api/v1/labels` with `Authorization: Bearer rtk_…`</li>
          <li>Webhooks: POST JSON payloads to your WMS endpoint on label events</li>
        </ul>
      </section>

      <section className="admin-card">
        <h2>Custom label templates</h2>
        <form className="admin-form" onSubmit={onSaveTemplates}>
          <textarea value={templatesJson} onChange={(e) => setTemplatesJson(e.target.value)} rows={12} />
          <button type="submit">Save templates</button>
        </form>
      </section>

      <section className="admin-card">
        <h2>Webhook URL</h2>
        <form className="admin-form" onSubmit={onSaveWebhook}>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://wms.example.com/racktag/webhook"
          />
          <button type="submit">Save webhook</button>
          <button
            type="button"
            onClick={() => postAction({ action: "test_webhook" }).then(() => setMessage("Test webhook sent."))}
          >
            Send test webhook
          </button>
        </form>
        <table className="admin-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {(data?.deliveries ?? []).map((d) => (
              <tr key={d.id}>
                <td>{d.eventType}</td>
                <td>{d.status}</td>
                <td>{d.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2>API keys</h2>
        <form className="admin-form" onSubmit={onCreateApiKey}>
          <input value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} />
          <button type="submit">Create API key</button>
        </form>
        {newApiKey ? (
          <p>
            <code>{newApiKey}</code>
          </p>
        ) : null}
        <table className="admin-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Last used</th>
            </tr>
          </thead>
          <tbody>
            {(data?.keys ?? []).map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>{key.lastUsedAt ?? "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {message ? <p>{message}</p> : null}
    </div>
  );
}
