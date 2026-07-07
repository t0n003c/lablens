import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/logo";
import { PrimaryNav } from "@/components/nav-link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border-soft bg-surface-glass px-5 py-6 shadow-[var(--shadow-glass)] backdrop-blur-xl lg:block">
        <div className="flex items-start justify-between gap-3">
          <Link href="/" aria-label="Open dashboard" className="min-w-0 flex-1">
            <Logo />
          </Link>
          <AccountMenu />
        </div>
        <nav className="mt-10 grid gap-1" aria-label="Primary navigation">
          <PrimaryNav />
        </nav>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border-soft bg-surface-glass px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Open dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="grid size-10 place-items-center rounded-md border border-border bg-panel-muted text-muted transition hover:border-primary/50 hover:text-foreground"
              aria-label="Create account"
              title="Create account"
            >
              <UserPlus className="size-5" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="grid size-10 place-items-center rounded-md border border-border bg-primary text-white transition hover:bg-primary-strong dark:text-[#02110f]"
              aria-label="Login"
              title="Login"
            >
              <LogIn className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:ml-72 lg:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border-soft bg-surface-glass shadow-[0_-12px_32px_rgb(17_24_23_/_0.08)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <PrimaryNav mobile />
      </nav>
    </div>
  );
}
