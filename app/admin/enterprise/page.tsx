"use client";

import { FormEvent, useEffect, useState } from "react";
import { DEFAULT_TEMPLATES, parseOrgTemplates, type LabelTemplateConfig } from "@/lib/templates";

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
  const [templates, setTemplates] = useState(fieldsFrom(DEFAULT_TEMPLATES));
  const [message, setMessage] = useState("");

  async function loadSettings() {
    const response = await fetch("/api/admin/settings");
    if (!response.ok) return;
    const json = await response.json();
    setData(json);
    setWebhookUrl(json.org?.webhookUrl ?? "");
    setTemplates(fieldsFrom(parseOrgTemplates(json.org?.customTemplates)));
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

  function setTemplate<K extends keyof TemplateFields>(key: K, value: string) {
    setTemplates((current) => ({ ...current, [key]: value }));
  }

  async function onSaveTemplates(event: FormEvent) {
    event.preventDefault();
    const saved = await postAction({ action: "update_templates", templates: configFrom(templates) });
    if (saved) setMessage("Site templates saved. New labels use this pattern.");
  }

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h1>Integrations</h1>
        <p className="admin-muted">
          Site label patterns, API keys, and a webhook for your warehouse system. Single sign-on is available on the Enterprise plan.
        </p>
        <ul className="admin-list">
          <li>
            Single sign-on: <a href="/api/auth/sso">Sign in with SSO</a>
          </li>
          <li>API: create a key below, then send label requests with that key.</li>
          <li>Webhook: RackTag posts label events to the address you save.</li>
        </ul>
      </section>

      <section className="admin-card">
        <h2>Site templates</h2>
        <p className="admin-muted">
          These patterns are what the label app builds. Use {"{aisle}"}, {"{level}"}, and {"{bin}"} for bin labels, {"{cart}"} for carts, and {"{level}"} plus {"{slot}"} for cart bins.
        </p>
        <form className="admin-form" onSubmit={onSaveTemplates}>
          <label>
            Bin pattern
            <input value={templates.binPattern} onChange={(e) => setTemplate("binPattern", e.target.value)} />
          </label>
          <div className="admin-form-grid">
            <label>
              Aisle from
              <input value={templates.binAisleMin} onChange={(e) => setTemplate("binAisleMin", e.target.value)} inputMode="numeric" />
            </label>
            <label>
              Aisle to
              <input value={templates.binAisleMax} onChange={(e) => setTemplate("binAisleMax", e.target.value)} inputMode="numeric" />
            </label>
            <label>
              Bin from
              <input value={templates.binIdMin} onChange={(e) => setTemplate("binIdMin", e.target.value)} inputMode="numeric" />
            </label>
            <label>
              Bin to
              <input value={templates.binIdMax} onChange={(e) => setTemplate("binIdMax", e.target.value)} inputMode="numeric" />
            </label>
          </div>
          <label>
            Cart pattern
            <input value={templates.cartPattern} onChange={(e) => setTemplate("cartPattern", e.target.value)} />
          </label>
          <div className="admin-form-grid">
            <label>
              Cart from
              <input value={templates.cartMin} onChange={(e) => setTemplate("cartMin", e.target.value)} inputMode="numeric" />
            </label>
            <label>
              Cart to
              <input value={templates.cartMax} onChange={(e) => setTemplate("cartMax", e.target.value)} inputMode="numeric" />
            </label>
          </div>
          <label>
            Cart bin pattern
            <input value={templates.cartbinPattern} onChange={(e) => setTemplate("cartbinPattern", e.target.value)} />
          </label>
          <div className="admin-form-grid">
            <label>
              Cart bin from
              <input value={templates.cartbinMin} onChange={(e) => setTemplate("cartbinMin", e.target.value)} inputMode="numeric" />
            </label>
            <label>
              Cart bin to
              <input value={templates.cartbinMax} onChange={(e) => setTemplate("cartbinMax", e.target.value)} inputMode="numeric" />
            </label>
          </div>
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

      {message ? <p className="admin-message">{message}</p> : null}
    </div>
  );
}

type TemplateFields = {
  binPattern: string;
  binAisleMin: string;
  binAisleMax: string;
  binIdMin: string;
  binIdMax: string;
  cartPattern: string;
  cartMin: string;
  cartMax: string;
  cartbinPattern: string;
  cartbinMin: string;
  cartbinMax: string;
};

function swapTokens(pattern: string, pairs: Array<[string, string]>) {
  return pairs.reduce((out, [from, to]) => out.split(from).join(to), pattern);
}

function fieldsFrom(config: LabelTemplateConfig): TemplateFields {
  return {
    binPattern: swapTokens(config.bin.pattern, [
      ["{xxx}", "{aisle}"],
      ["{y}", "{level}"],
      ["{zzzz}", "{bin}"],
    ]),
    binAisleMin: String(config.bin.validation.xxx.min),
    binAisleMax: String(config.bin.validation.xxx.max),
    binIdMin: String(config.bin.validation.zzzz.min),
    binIdMax: String(config.bin.validation.zzzz.max),
    cartPattern: swapTokens(config.cart.pattern, [["{xxx}", "{cart}"]]),
    cartMin: String(config.cart.validation.xxx.min),
    cartMax: String(config.cart.validation.xxx.max),
    cartbinPattern: swapTokens(config.cartbin.pattern, [
      ["{xxx}", "{cart}"],
      ["{y}", "{level}"],
      ["{z}", "{slot}"],
    ]),
    cartbinMin: String(config.cartbin.validation.xxx.min),
    cartbinMax: String(config.cartbin.validation.xxx.max),
  };
}

function wholeNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function configFrom(fields: TemplateFields): LabelTemplateConfig {
  return {
    bin: {
      pattern: swapTokens(fields.binPattern.trim(), [
        ["{aisle}", "{xxx}"],
        ["{level}", "{y}"],
        ["{bin}", "{zzzz}"],
      ]),
      validation: {
        xxx: {
          min: wholeNumber(fields.binAisleMin, DEFAULT_TEMPLATES.bin.validation.xxx.min),
          max: wholeNumber(fields.binAisleMax, DEFAULT_TEMPLATES.bin.validation.xxx.max),
        },
        zzzz: {
          min: wholeNumber(fields.binIdMin, DEFAULT_TEMPLATES.bin.validation.zzzz.min),
          max: wholeNumber(fields.binIdMax, DEFAULT_TEMPLATES.bin.validation.zzzz.max),
        },
      },
    },
    cart: {
      pattern: swapTokens(fields.cartPattern.trim(), [["{cart}", "{xxx}"]]),
      validation: {
        xxx: {
          min: wholeNumber(fields.cartMin, DEFAULT_TEMPLATES.cart.validation.xxx.min),
          max: wholeNumber(fields.cartMax, DEFAULT_TEMPLATES.cart.validation.xxx.max),
        },
      },
    },
    cartbin: {
      pattern: swapTokens(fields.cartbinPattern.trim(), [
        ["{cart}", "{xxx}"],
        ["{level}", "{y}"],
        ["{slot}", "{z}"],
      ]),
      validation: {
        xxx: {
          min: wholeNumber(fields.cartbinMin, DEFAULT_TEMPLATES.cartbin.validation.xxx.min),
          max: wholeNumber(fields.cartbinMax, DEFAULT_TEMPLATES.cartbin.validation.xxx.max),
        },
      },
    },
  };
}
