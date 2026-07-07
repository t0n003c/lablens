import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const visualCopy = {
  report: {
    src: "/illustrations/lablens-report-lens.png",
    title: "Private by design",
    fallback: "Your report stays on this server unless you export it.",
  },
  trust: {
    src: "/illustrations/lablens-glass-trust.png",
    title: "Private by design",
    fallback: "Your reports stay on this server and remain separated by person.",
  },
  trend: {
    src: "/illustrations/lablens-trend-lens.png",
    title: "Careful trends",
    fallback: "The chart shows change over time without mixing different lab units.",
  },
  upload: {
    src: "/illustrations/lablens-upload-review.png",
    title: "Review before saving",
    fallback: "Confirm extracted rows before you rely on a report.",
  },
} as const;

export function LabLensVisual({
  className,
  compact = false,
  description,
  priority = false,
  variant = "report",
}: {
  className?: string;
  compact?: boolean;
  description?: string;
  priority?: boolean;
  variant?: keyof typeof visualCopy;
}) {
  const visual = visualCopy[variant];

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-panel-muted", className)}>
      <Image
        src={visual.src}
        alt=""
        width={1024}
        height={1024}
        priority={priority}
        className={cn("h-full w-full object-cover", compact ? "opacity-55" : "opacity-80")}
      />
      <div className="absolute inset-0 bg-panel/10 dark:bg-black/10" aria-hidden="true" />
      <div className={cn("absolute inset-x-3 bottom-3 rounded-md border border-border bg-panel/90 p-3 shadow-[var(--shadow-card)] backdrop-blur", compact ? "p-2.5" : "")}>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          {visual.title}
        </p>
        {description || !compact ? (
          <p className="mt-1 text-xs leading-5 text-muted">{description ?? visual.fallback}</p>
        ) : null}
      </div>
    </div>
  );
}
