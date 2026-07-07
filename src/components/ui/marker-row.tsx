import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";

type MarkerTone = "success" | "warning" | "danger" | "default";

export function MarkerRow({
  className,
  label,
  meta,
  tone = "default",
  value,
}: {
  className?: string;
  label: string;
  meta?: string;
  tone?: MarkerTone;
  value: string;
}) {
  return (
    <div className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-border-soft py-2.5 text-sm first:border-t-0", className)}>
      <StatusDot tone={tone === "danger" ? "danger" : tone === "warning" ? "warning" : tone === "success" ? "success" : "primary"} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{label}</p>
        {meta ? <p className="truncate text-xs text-muted">{meta}</p> : null}
      </div>
      <p className="whitespace-nowrap font-semibold tracking-normal text-foreground">{value}</p>
    </div>
  );
}
