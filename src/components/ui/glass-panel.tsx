import * as React from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-md border border-border-soft bg-surface-glass shadow-[var(--shadow-glass)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
