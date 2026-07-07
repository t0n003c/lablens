import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneClass = {
  default: "border-border bg-panel text-muted",
  primary: "border-primary/25 bg-primary/10 text-primary",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  accent: "border-accent/25 bg-accent/10 text-accent",
} as const;

export function MetricTile({
  className,
  icon: Icon,
  label,
  meta,
  tone = "default",
  value,
}: {
  className?: string;
  icon?: LucideIcon;
  label: string;
  meta?: string;
  tone?: keyof typeof toneClass;
  value: string;
}) {
  return (
    <div className={cn("rounded-md border px-3 py-3", toneClass[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal text-foreground dark:text-current">{value}</p>
        </div>
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-panel/80 text-current dark:bg-white/10">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {meta ? <p className="mt-2 text-xs leading-5 opacity-80">{meta}</p> : null}
    </div>
  );
}
