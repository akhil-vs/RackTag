"use client";

import { FormEvent, useState } from "react";

type LoginFormProps = {
  next: string;
  initialError?: string;
};

export function LoginForm({ next, initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Login failed.");
        return;
      }
      window.location.href = next;
    } catch {
      setMessage("Login unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-card" style={{ maxWidth: 420, margin: "80px auto" }}>
      <h1>RackTag Sign In</h1>
      <p className="admin-muted">Enterprise accounts for audit logs, custom templates, and billing.</p>
      <form onSubmit={onSubmit} className="admin-form">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {message ? <p className="admin-error">{message}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="admin-muted" style={{ marginTop: 16 }}>
        SSO available on Enterprise plans when OIDC env vars are configured.
      </p>
      <p style={{ marginTop: 12 }}>
        <a href="/api/auth/sso">Sign in with SSO</a> · <a href="/">Back to label app</a>
      </p>
    </section>
  );
}
