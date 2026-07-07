import * as React from "react";
import { cn } from "@/lib/utils";

export function InstrumentPanel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-md border border-white/10 bg-surface-instrument text-white shadow-[var(--shadow-instrument)]",
        className,
      )}
      {...props}
    />
  );
}
