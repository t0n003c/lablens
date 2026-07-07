"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FilePlus2, Gauge, History, Settings, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/upload", label: "Upload", icon: FilePlus2 },
  { href: "/manual", label: "Manual", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: History },
  { href: "/people", label: "People", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLink({
  href,
  icon: Icon,
  label,
  mobile = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition hover:bg-panel-muted hover:text-foreground",
          active ? "bg-primary/10 text-primary" : "text-muted",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition hover:bg-panel-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
        active ? "bg-primary/10 text-foreground" : "text-muted",
      )}
    >
      <span className={cn("grid size-8 place-items-center rounded-md text-primary transition group-hover:bg-primary/10", active ? "bg-primary/10" : "")}>
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      {label}
    </Link>
  );
}

export function PrimaryNav({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} mobile={mobile} />
      ))}
    </>
  );
}
