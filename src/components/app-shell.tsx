import Link from "next/link";
import {
  ClipboardList,
  FilePlus2,
  Gauge,
  History,
  LogIn,
  Settings,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AuthStatus } from "@/components/auth-status";
import { Logo } from "@/components/logo";
import { HEALTH_DISCLAIMER } from "@/lib/constants";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/upload", label: "Upload", icon: FilePlus2 },
  { href: "/manual", label: "Manual", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: History },
  { href: "/people", label: "People", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-panel px-5 py-6 lg:block">
        <Logo />
        <nav className="mt-10 grid gap-1" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition hover:bg-panel-muted hover:text-foreground"
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <AuthStatus />
        </div>
        <div className="absolute bottom-6 left-5 right-5 rounded-md border border-border bg-panel-muted p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-6 text-muted">{HEALTH_DISCLAIMER}</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-panel/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="grid size-10 place-items-center rounded-md border border-border text-muted"
              aria-label="Create account"
              title="Create account"
            >
              <UserPlus className="size-5" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="grid size-10 place-items-center rounded-md border border-border text-muted"
              aria-label="Login"
              title="Login"
            >
              <LogIn className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:ml-72 lg:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-panel lg:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted">
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
