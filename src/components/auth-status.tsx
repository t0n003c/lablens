"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";

type AuthUser = {
  email: string;
  name: string;
} | null;

export function AuthStatus() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return { user: null };
        return response.json();
      })
      .then((body) => setUser(body.user))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!loaded || !user) {
    return (
      <div className="grid gap-2 rounded-md border border-border bg-panel-muted p-3">
        <Link href="/login" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong dark:text-[#02110f]">
          <LogIn className="size-4" aria-hidden="true" />
          Login
        </Link>
        <Link href="/register" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold transition hover:border-primary/50 hover:bg-background">
          <UserPlus className="size-4" aria-hidden="true" />
          Create account
        </Link>
        <p className="text-xs leading-5 text-muted">{loaded ? "Demo: demo@lablens.local" : "Checking session..."}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-panel-muted p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Signed in</p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{user.name}</p>
      <p className="truncate text-xs text-muted">{user.email}</p>
      <button onClick={logout} className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold transition hover:border-primary/50 hover:bg-background" type="button">
        <LogOut className="size-4" aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}
