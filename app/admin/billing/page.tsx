"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function BillingClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(
    searchParams.get("success")
      ? "Subscription checkout completed."
      : searchParams.get("canceled")
        ? "Checkout canceled."
        : "",
  );
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await response.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMessage(data.error ?? "Stripe checkout unavailable.");
  }

  return (
    <section className="admin-card">
      <h1>Billing</h1>
      <p className="admin-muted">
        Pro plan: unlimited labels, custom templates, audit export, email support ($99–299/site/month via Stripe).
      </p>
      <ul className="admin-list">
        <li>Free: 500 labels/month</li>
        <li>Pilot: 10,000 labels/month (manual activation)</li>
        <li>Pro: unlimited (Stripe subscription)</li>
        <li>Enterprise: custom annual + SSO, API, webhooks</li>
      </ul>
      <button type="button" onClick={startCheckout} disabled={loading}>
        {loading ? "Redirecting…" : "Upgrade to Pro (Stripe)"}
      </button>
      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
      <p className="admin-muted" style={{ marginTop: 16 }}>
        Set `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` in Vercel env vars.
      </p>
    </section>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<section className="admin-card">Loading billing…</section>}>
      <BillingClient />
    </Suspense>
  );
}
