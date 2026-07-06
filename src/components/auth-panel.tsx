"use client";

import { useState } from "react";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { ArrowRight, Fingerprint, Loader2 } from "lucide-react";

type LoginResponse = {
  biometricRequired?: boolean;
  options?: PublicKeyCredentialRequestOptionsJSON;
  error?: string;
};

export function AuthPanel({ mode }: { mode: "login" | "register" }) {
  const [status, setStatus] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"info" | "error">("info");
  const [pending, setPending] = useState(false);
  const [biometricOptions, setBiometricOptions] = useState<PublicKeyCredentialRequestOptionsJSON | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    setStatusTone("info");
    setBiometricOptions(null);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            twoFactorCode: String(form.get("twoFactorCode") ?? "") || undefined,
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as LoginResponse;
    setPending(false);

    if (!response.ok) {
      setStatusTone("error");
      setStatus(body.error ?? "Something went wrong.");
      return;
    }

    if (mode === "login" && body.biometricRequired && body.options) {
      setBiometricOptions(body.options);
      setStatusTone("info");
      setStatus("Password accepted. Finish with your device biometric to log in.");
      return;
    }

    window.location.href = "/";
  }

  async function finishBiometricLogin() {
    if (!biometricOptions) return;
    if (!browserSupportsWebAuthn()) {
      setStatusTone("error");
      setStatus("This browser does not support biometric login. Try a secure phone browser or log in on another device.");
      return;
    }

    setPending(true);
    setStatusTone("info");
    setStatus("Waiting for your device...");

    try {
      const credential = await startAuthentication({ optionsJSON: biometricOptions });
      const response = await fetch("/api/auth/biometric/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const body = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        setPending(false);
        setStatusTone("error");
        setStatus(body.error ?? "Biometric login failed.");
        return;
      }

      window.location.href = "/";
    } catch {
      setPending(false);
      setStatusTone("error");
      setStatus("Biometric login was canceled or blocked by this browser.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {mode === "register" ? (
        <label className="grid gap-2 text-sm font-medium">
          Name
          <input name="name" required className="min-h-11 rounded-md border border-border bg-panel px-3 text-foreground" />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input name="email" type="email" required className="min-h-11 rounded-md border border-border bg-panel px-3 text-foreground" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          minLength={mode === "register" ? 12 : 1}
          required
          className="min-h-11 rounded-md border border-border bg-panel px-3 text-foreground"
        />
      </label>
      {mode === "login" ? (
        <label className="grid gap-2 text-sm font-medium">
          2FA code
          <input name="twoFactorCode" inputMode="numeric" className="min-h-11 rounded-md border border-border bg-panel px-3 text-foreground" />
        </label>
      ) : null}
      {status ? (
        <p
          className={
            statusTone === "error"
              ? "rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              : "rounded-md border border-border bg-panel-muted px-3 py-2 text-sm text-muted"
          }
        >
          {status}
        </p>
      ) : null}
      {biometricOptions ? (
        <div className="rounded-md border border-border bg-panel-muted p-3">
          <p className="text-sm font-medium">One more step</p>
          <p className="mt-1 text-sm leading-6 text-muted">Use Face ID, fingerprint, device PIN, or your device biometric prompt to finish.</p>
          <button
            type="button"
            onClick={() => void finishBiometricLogin()}
            disabled={pending}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:opacity-60 dark:text-[#06201d]"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Fingerprint className="size-4" aria-hidden="true" />}
            Continue with biometric
          </button>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#06201d]"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
        {mode === "register" ? "Create account" : "Login"}
      </button>
    </form>
  );
}
