"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { CheckCircle2, Download, Fingerprint, KeyRound, Shield, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

type BiometricSetupResponse = {
  options?: PublicKeyCredentialCreationOptionsJSON;
  passkeyEnabled?: boolean;
  error?: string;
};

export function SettingsPanel() {
  const [message, setMessage] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [storeRawPdfs, setStoreRawPdfs] = useState(false);
  const [passkeyEnabled, setPasskeyEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);
  const [biometricPending, setBiometricPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/settings")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json();
        if (!cancelled) {
          setStoreRawPdfs(Boolean(body.settings?.storeRawPdfs));
        }
      })
      .catch(() => {});

    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json();
        if (!cancelled) setPasskeyEnabled(Boolean(body.user?.passkeyEnabled));
      })
      .catch(() => {});

    if (browserSupportsWebAuthn()) {
      platformAuthenticatorIsAvailable()
        .then((available) => {
          if (!cancelled) setBiometricSupported(available);
        })
        .catch(() => {
          if (!cancelled) setBiometricSupported(false);
        });
    } else {
      window.setTimeout(() => {
        if (!cancelled) setBiometricSupported(false);
      }, 0);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  async function setup2fa() {
    const response = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const body = await response.json();
    setQrCode(response.ok ? body.qrCode : null);
    setMessage(response.ok ? "2FA setup generated." : body.error);
  }

  async function verify2fa() {
    const response = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: twoFactorCode }),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "2FA is enabled." : body.error ?? "Could not verify 2FA code.");
  }

  async function setupBiometric() {
    if (!browserSupportsWebAuthn()) {
      setMessage("This browser does not support biometric login. Try Safari or Chrome on your phone with a secure link.");
      return;
    }

    const available = await platformAuthenticatorIsAvailable().catch(() => false);
    if (!available) {
      setBiometricSupported(false);
      setMessage("This device does not offer biometric login right now. Try a phone, Face ID, fingerprint, or device PIN setup.");
      return;
    }

    setBiometricPending(true);
    setMessage("Starting biometric setup...");

    try {
      const optionsResponse = await fetch("/api/auth/biometric/register/options", { method: "POST" });
      const optionsBody = (await optionsResponse.json().catch(() => ({}))) as BiometricSetupResponse;
      if (!optionsResponse.ok || !optionsBody.options) {
        setMessage(optionsBody.error ?? "Could not start biometric setup.");
        setBiometricPending(false);
        return;
      }

      const credential = await startRegistration({ optionsJSON: optionsBody.options });
      const verifyResponse = await fetch("/api/auth/biometric/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const verifyBody = (await verifyResponse.json().catch(() => ({}))) as BiometricSetupResponse;

      if (!verifyResponse.ok) {
        setMessage(verifyBody.error ?? "Biometric setup failed.");
        setBiometricPending(false);
        return;
      }

      setPasskeyEnabled(Boolean(verifyBody.passkeyEnabled));
      setMessage("Biometric login is on. Password is still required first.");
    } catch {
      setMessage("Biometric setup was canceled or blocked by this browser.");
    } finally {
      setBiometricPending(false);
    }
  }

  async function disableBiometric() {
    const confirmed = window.confirm("Turn off biometric login for this account?");
    if (!confirmed) return;

    setBiometricPending(true);
    setMessage("Turning off biometric login...");
    const response = await fetch("/api/auth/biometric", { method: "DELETE" });
    const body = (await response.json().catch(() => ({}))) as BiometricSetupResponse;
    setBiometricPending(false);

    if (!response.ok) {
      setMessage(body.error ?? "Could not turn off biometric login.");
      return;
    }

    setPasskeyEnabled(false);
    setMessage("Biometric login is off.");
  }

  async function exportData() {
    setMessage("Preparing export...");
    const response = await fetch("/api/account/export");

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Export failed." }));
      setMessage(body.error ?? "Export failed.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lablens-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Export downloaded.");
  }

  async function deleteAccountData() {
    const confirmed = window.confirm("Delete all saved lab reports and results for this account? Your login will remain.");
    if (!confirmed) return;

    const response = await fetch("/api/account/data", { method: "DELETE" });
    const body = await response.json().catch(() => ({ error: "Delete failed." }));

    if (!response.ok) {
      setMessage(body.error ?? "Delete failed.");
      return;
    }

    setMessage(`Deleted ${body.deletedReports} report${body.deletedReports === 1 ? "" : "s"}.`);
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  }

  async function toggleRawPdfStorage() {
    const nextValue = !storeRawPdfs;
    setMessage("Saving setting...");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeRawPdfs: nextValue }),
    });
    const body = await response.json().catch(() => ({ error: "Could not save this setting." }));

    if (!response.ok) {
      setMessage(body.error ?? "Could not save this setting.");
      return;
    }

    setStoreRawPdfs(Boolean(body.settings?.storeRawPdfs));
    setMessage(nextValue ? "Raw PDF storage is on for future uploads." : "Raw PDF storage is off.");
  }

  return (
    <div className="grid gap-4">
      {message ? <p className="rounded-md border border-border bg-panel p-3 text-sm text-muted">{message}</p> : null}
      <section className="rounded-md border border-border bg-panel p-5">
        <div className="flex items-start gap-3">
          <Shield className="mt-1 size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Security</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={setup2fa} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 font-medium">
                <KeyRound className="size-4" aria-hidden="true" />
                Set up 2FA
              </button>
              <button
                onClick={passkeyEnabled ? disableBiometric : setupBiometric}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 font-medium disabled:opacity-60"
                type="button"
                disabled={biometricPending || (!passkeyEnabled && biometricSupported === false)}
              >
                <Fingerprint className="size-4" aria-hidden="true" />
                {biometricPending ? "Working..." : passkeyEnabled ? "Turn off biometric" : "Set up biometric"}
              </button>
              <button className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-md border border-border px-3 font-medium opacity-60" type="button" disabled>
                <ToggleLeft className="size-4" aria-hidden="true" />
                Turnstile
              </button>
            </div>
            <div className="mt-4 rounded-md bg-panel-muted p-3 text-sm leading-6 text-muted">
              <p className="font-medium text-foreground">Biometric login: {passkeyEnabled ? "On" : "Off"}</p>
              <p>
                {passkeyEnabled
                  ? "After email and password, this account also asks for Face ID, fingerprint, or the device biometric prompt."
                  : "Turn this on to require your device biometric after email and password."}
              </p>
              {biometricSupported === false && !passkeyEnabled ? (
                <p className="mt-2 text-warning">Biometric setup needs a supported browser and a secure link. Localhost works for testing.</p>
              ) : null}
            </div>
            {qrCode ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-[176px_1fr] sm:items-end">
                <Image src={qrCode} alt="2FA setup QR code" width={176} height={176} unoptimized className="rounded-md border border-border bg-white p-2" />
                <div className="grid gap-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Authenticator code
                    <input
                      value={twoFactorCode}
                      onChange={(event) => setTwoFactorCode(event.target.value)}
                      inputMode="numeric"
                      className="min-h-10 rounded-md border border-border bg-background px-3"
                    />
                  </label>
                  <button onClick={verify2fa} type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 font-semibold text-white dark:text-[#06201d]">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Verify 2FA
                  </button>
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-muted">Turnstile runtime protection is configured from `.env`.</p>
          </div>
        </div>
      </section>

      <section id="data" className="scroll-mt-8 rounded-md border border-border bg-panel p-5">
        <h2 className="font-semibold">Data</h2>
        <div className="mt-3 rounded-md bg-panel-muted p-3 text-sm leading-6 text-muted">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Raw PDF storage: {storeRawPdfs ? "On" : "Off"}</p>
              <p>Future uploads {storeRawPdfs ? "will keep" : "will not keep"} the original PDF file.</p>
            </div>
            <button onClick={toggleRawPdfStorage} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 font-medium text-foreground" type="button">
              {storeRawPdfs ? <ToggleRight className="size-4 text-success" aria-hidden="true" /> : <ToggleLeft className="size-4" aria-hidden="true" />}
              {storeRawPdfs ? "Turn off" : "Turn on"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button onClick={exportData} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-left font-medium" type="button">
            <Download className="size-4" aria-hidden="true" />
            Export data
          </button>
          <button onClick={deleteAccountData} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-danger/40 px-3 text-left font-medium text-danger" type="button">
            <Trash2 className="size-4" aria-hidden="true" />
            Delete account data
          </button>
        </div>
      </section>
    </div>
  );
}
