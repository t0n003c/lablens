import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border border-primary bg-primary text-white shadow-sm hover:bg-primary-strong dark:text-[#02110f]",
  secondary: "border border-border bg-panel text-foreground hover:border-primary/50 hover:bg-panel-muted",
  ghost: "border border-transparent text-muted hover:bg-panel-muted hover:text-foreground",
  danger: "border border-danger/40 bg-panel text-danger hover:bg-danger/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4",
  icon: "size-10 p-0",
};

export function buttonVariants({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }>(
  ({ className, size, variant, ...props }, ref) => <button ref={ref} className={buttonVariants({ className, size, variant })} {...props} />,
);
Button.displayName = "Button";
