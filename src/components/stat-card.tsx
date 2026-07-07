import Link from "next/link";
import { type LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  href,
  ariaLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger" | "success";
  href?: string;
  ariaLabel?: string;
}) {
  const toneClass = {
    default: "text-primary",
    warning: "text-warning",
    danger: "text-danger",
    success: "text-success",
  }[tone];

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-foreground">{value}</p>
        </div>
        <div className={`grid size-11 shrink-0 place-items-center rounded-md bg-panel-muted ${toneClass}`}>
          <Icon className="size-6" aria-hidden="true" />
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel ?? `${label}: ${value}`}
        className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)] transition hover:border-primary/50 hover:bg-panel-muted focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {content}
      </Link>
    );
  }

  return (
    <section className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
      {content}
    </section>
  );
}
