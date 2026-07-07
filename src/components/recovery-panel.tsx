"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, Send } from "lucide-react";

export function RecoveryPanel() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function requestRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await response.json();
    setMessage(body.message ?? body.error ?? "Recovery request processed.");
    if (body.recoveryToken) setToken(body.recoveryToken);
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Password reset. You can login now." : body.error ?? "Password reset failed.");
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={requestRecovery} className="grid gap-3">
        <label className="grid gap-2 text-sm font-medium">
          Account email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className="min-h-11 rounded-md border border-border bg-background px-3 shadow-sm" />
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-white shadow-sm transition hover:bg-primary-strong dark:text-[#02110f]">
          <Send className="size-4" aria-hidden="true" />
          Create recovery token
        </button>
      </form>

      <form onSubmit={resetPassword} className="grid gap-3 border-t border-border pt-5">
        <label className="grid gap-2 text-sm font-medium">
          Recovery token
          <textarea value={token} onChange={(event) => setToken(event.target.value)} required rows={3} className="rounded-md border border-border bg-background px-3 py-2 shadow-sm" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          New password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required className="min-h-11 rounded-md border border-border bg-background px-3 shadow-sm" />
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-panel px-4 font-semibold transition hover:border-primary/50 hover:bg-panel-muted">
          <KeyRound className="size-4" aria-hidden="true" />
          Reset password
        </button>
      </form>

      {message ? <p className="rounded-md border border-border bg-panel-muted p-3 text-sm text-muted">{message}</p> : null}
      <Link href="/login" className="text-sm font-semibold text-primary">
        Back to login
      </Link>
    </div>
  );
}
