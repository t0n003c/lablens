import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "primary" | "success" | "warning" | "danger" | "accent";

const toneClasses: Record<BadgeTone, string> = {
  default: "border-border bg-panel-muted text-muted",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  accent: "border-accent/30 bg-accent/10 text-accent",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
}) {
  return <span className={cn("inline-flex w-fit items-center rounded-md border px-2 py-1 text-xs font-semibold", toneClasses[tone], className)} {...props} />;
}
