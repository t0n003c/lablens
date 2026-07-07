import * as React from "react";
import { cn } from "@/lib/utils";

export function fieldControlClasses(className?: string) {
  return cn(
    "min-h-11 rounded-md border border-border bg-background px-3 text-foreground shadow-sm transition placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );
}

export function Field({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("grid gap-2 text-sm font-medium text-foreground", className)} {...props} />;
}
