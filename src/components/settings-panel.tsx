"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { Bot, CheckCircle2, Download, Fingerprint, KeyRound, Monitor, Moon, Palette, Shield, ShieldCheck, SunMedium, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { applyTheme, isThemeChoice, readStoredTheme, storeTheme, type ThemeChoice } from "@/lib/theme";

type BiometricSetupResponse = {
  options?: PublicKeyCredentialCreationOptionsJSON;
  passkeyEnabled?: boolean;
  error?: string;
};

const themeOptions = [
  { value: "system", label: "System", description: "Match this device", icon: Monitor },
  { value: "light", label: "Light", description: "Bright clean mode", icon: SunMedium },
  { value: "dark", label: "OLED dark", description: "Black background", icon: Moon },
] as const;

export function SettingsPanel() {
  const [message, setMessage] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [theme, setTheme] = useState<ThemeChoice>(() => readStoredTheme() ?? "system");
  const [storeRawPdfs, setStoreRawPdfs] = useState(false);
  const [passkeyEnabled, setPasskeyEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);
  const [biometricPending, setBiometricPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const storedTheme = readStoredTheme();
    if (storedTheme) {
      applyTheme(storedTheme);
    }

    fetch("/api/settings")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json();
        if (!cancelled) {
          const nextTheme = body.settings?.theme;
          if (isThemeChoice(nextTheme)) {
            setTheme(nextTheme);
            applyTheme(nextTheme);
            storeTheme(nextTheme);
          }
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

  async function saveTheme(nextTheme: ThemeChoice) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    storeTheme(nextTheme);

    setMessage("Saving theme...");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    });
    const body = await response.json().catch(() => ({ error: "Could not save this theme." }));

    if (!response.ok) {
      setMessage(response.status === 401 ? "Theme saved on this device. Login to save it to your account." : body.error ?? "Could not save this theme.");
      return;
    }

    setMessage(`Theme set to ${themeOptions.find((option) => option.value === nextTheme)?.label ?? "System"}.`);
  }

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
      {message ? <p className="rounded-md border border-border bg-panel p-3 text-sm text-muted shadow-[var(--shadow-card)]">{message}</p> : null}
      <section className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <Palette className="mt-1 size-5 text-primary" aria-hidden="true" />
          <div className="w-full">
            <h2 className="font-semibold">Appearance</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Choose the app color mode for this device. Signed-in users also save it to their account.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => {
                const selected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => void saveTheme(option.value)}
                    aria-label={option.label}
                    aria-pressed={selected}
                    className={`grid min-h-24 gap-2 rounded-md border p-3 text-left transition ${
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-panel-muted/70 text-muted hover:border-primary/50 hover:bg-panel-muted hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <option.icon className="size-4 text-primary" aria-hidden="true" />
                      {option.label}
                    </span>
                    <span className="text-xs leading-5">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <Shield className="mt-1 size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Security</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={setup2fa} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 font-medium transition hover:border-primary/50 hover:bg-panel-muted">
                <KeyRound className="size-4" aria-hidden="true" />
                Set up 2FA
              </button>
              <button
                onClick={passkeyEnabled ? disableBiometric : setupBiometric}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 font-medium transition hover:border-primary/50 hover:bg-panel-muted disabled:opacity-60"
                type="button"
                disabled={biometricPending || (!passkeyEnabled && biometricSupported === false)}
              >
                <Fingerprint className="size-4" aria-hidden="true" />
                {biometricPending ? "Working..." : passkeyEnabled ? "Turn off biometric" : "Set up biometric"}
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
                  <button onClick={verify2fa} type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 font-semibold text-white shadow-sm transition hover:bg-primary-strong dark:text-[#02110f]">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Verify 2FA
                  </button>
                </div>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-panel-muted p-3 text-sm leading-6 text-muted">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                  Runtime protection
                </p>
                <p className="mt-1">Turnstile is configured by the server from `.env`, so there is no local toggle here.</p>
              </div>
              <div className="rounded-md border border-border bg-panel-muted p-3 text-sm leading-6 text-muted">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <KeyRound className="size-4 text-primary" aria-hidden="true" />
                  Login layers
                </p>
                <p className="mt-1">Password comes first. 2FA and biometric can add extra checks when enabled.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <Bot className="mt-1 size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Intelligence</h2>
            <div className="mt-3 rounded-md bg-panel-muted p-3 text-sm leading-6 text-muted">
              <p className="font-medium text-foreground">Summary provider: configured by server</p>
              <p>
                LabLens uses the provider set in `.env`. If that provider is unavailable, the app keeps using cautious local summaries instead of making medical claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="data" className="scroll-mt-8 rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold">Data</h2>
        <div className="mt-3 rounded-md bg-panel-muted p-3 text-sm leading-6 text-muted">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Raw PDF storage: {storeRawPdfs ? "On" : "Off"}</p>
              <p>Future uploads {storeRawPdfs ? "will keep" : "will not keep"} the original PDF file.</p>
            </div>
            <button onClick={toggleRawPdfStorage} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 font-medium text-foreground transition hover:border-primary/50 hover:bg-background" type="button">
              {storeRawPdfs ? <ToggleRight className="size-4 text-success" aria-hidden="true" /> : <ToggleLeft className="size-4" aria-hidden="true" />}
              {storeRawPdfs ? "Turn off" : "Turn on"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button onClick={exportData} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 text-left font-medium transition hover:border-primary/50 hover:bg-panel-muted" type="button">
            <Download className="size-4" aria-hidden="true" />
            Export data
          </button>
          <button onClick={deleteAccountData} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-danger/40 bg-panel px-3 text-left font-medium text-danger transition hover:bg-danger/10" type="button">
            <Trash2 className="size-4" aria-hidden="true" />
            Delete account data
          </button>
        </div>
      </section>
    </div>
  );
}
