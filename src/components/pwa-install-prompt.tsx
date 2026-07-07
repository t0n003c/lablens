"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_UNTIL_KEY = "lablens-pwa-install-dismissed-until";
const DISMISS_DAYS = 7;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 820px)").matches || /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function isAppleMobile() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent) || nav.standalone !== undefined;
}

function hasDismissedRecently() {
  try {
    const dismissedUntil = Number(window.localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0);
    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(DISMISSED_UNTIL_KEY, String(dismissedUntil));
  } catch {
    return;
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      window.addEventListener(
        "load",
        () => {
          navigator.serviceWorker.register("/sw.js").catch(() => {});
        },
        { once: true },
      );
    }

    if (isStandaloneMode() || !isMobileDevice() || hasDismissedRecently()) return;

    const appleDevice = isAppleMobile();
    window.setTimeout(() => setIsApple(appleDevice), 0);

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      window.setTimeout(() => setVisible(true), 700);
    };

    const installed = () => {
      setVisible(false);
      setDeferredPrompt(null);
      try {
        window.localStorage.removeItem(DISMISSED_UNTIL_KEY);
      } catch {
        return;
      }
    };

    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);

    const fallbackTimer = window.setTimeout(() => {
      if (!isStandaloneMode() && !hasDismissedRecently()) {
        setVisible(true);
      }
    }, 1400);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) {
      setShowSteps(true);
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: "dismissed" as const, platform: "" }));
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setVisible(false);
      return;
    }

    rememberDismissal();
    setVisible(false);
  }

  function dismiss() {
    rememberDismissal();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section className="fixed inset-x-3 bottom-20 z-50 rounded-md border border-border-soft bg-surface-glass p-3 shadow-[var(--shadow-glass)] backdrop-blur-xl sm:left-auto sm:right-4 sm:w-96 lg:bottom-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-white dark:text-[#02110f]">
          <Smartphone className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Install LabLens?</h2>
              <p className="mt-0.5 text-xs leading-5 text-muted">Open from your home screen.</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss install prompt"
              className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-panel text-muted transition hover:border-primary/60 hover:bg-panel-muted hover:text-primary"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {showSteps ? (
            <p className="mt-3 rounded-md border border-border-soft bg-panel/80 p-3 text-sm leading-6 text-muted">
              {isApple ? (
                <>
                  On iPhone, tap <Share className="mx-1 inline size-4 align-[-2px]" aria-hidden="true" /> Share, then Add to Home Screen.
                </>
              ) : (
                "Open your browser menu, then choose Install app or Add to Home screen."
              )}
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void installApp()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong dark:text-[#02110f]"
            >
              <Download className="size-4" aria-hidden="true" />
              {deferredPrompt ? "Install" : "How"}
            </button>
            <button type="button" onClick={dismiss} className="inline-flex min-h-10 items-center justify-center rounded-md border border-border-soft bg-panel/70 px-3 text-sm font-semibold text-muted transition hover:border-primary/50 hover:bg-panel-muted hover:text-foreground">
              Not now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
