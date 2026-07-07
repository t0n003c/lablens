"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CircleUserRound, LogIn, LogOut, UserPlus } from "lucide-react";

type AuthUser = {
  email: string;
  name: string;
} | null;

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser>(null);
  const [loaded, setLoaded] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return { user: null };
        return response.json();
      })
      .then((body) => {
        if (!cancelled) setUser(body.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  function clearCloseDelay() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu() {
    clearCloseDelay();
    setOpen(true);
  }

  function closeMenuNow() {
    clearCloseDelay();
    setOpen(false);
  }

  function closeMenuWithDelay() {
    clearCloseDelay();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 450);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeMenuNow();
      }}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenuWithDelay}
    >
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          clearCloseDelay();
          setOpen((current) => !current);
        }}
        className="grid size-10 place-items-center rounded-md border border-border-soft bg-panel/80 text-muted transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <CircleUserRound className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-40 w-64 rounded-md border border-border-soft bg-panel p-3 text-sm shadow-[var(--shadow-glass)]">
          {!loaded ? (
            <p className="text-sm text-muted">Checking session...</p>
          ) : user ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Signed in</p>
              <p className="mt-2 truncate font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <button
                type="button"
                onClick={logout}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-panel-muted px-3 font-semibold transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </button>
            </>
          ) : (
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Not signed in</p>
              <Link href="/login" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 font-semibold text-white transition hover:bg-primary-strong dark:text-[#02110f]">
                <LogIn className="size-4" aria-hidden="true" />
                Login
              </Link>
              <Link href="/register" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-panel-muted px-3 font-semibold transition hover:border-primary/50 hover:bg-primary/10">
                <UserPlus className="size-4" aria-hidden="true" />
                Create account
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
