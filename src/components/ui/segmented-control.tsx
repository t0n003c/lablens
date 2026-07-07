"use client";

import { cn } from "@/lib/utils";

export function SegmentedControl<TValue extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
}) {
  return (
    <div className={cn("inline-flex rounded-md border border-border-soft bg-panel-muted p-1 dark:bg-white/5", className)} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-8 rounded-md px-3 text-xs font-semibold text-muted transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            value === option.value ? "bg-panel text-foreground shadow-sm dark:bg-white/10 dark:text-white" : "",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
