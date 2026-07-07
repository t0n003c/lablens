import { cn } from "@/lib/utils";

const toneClass = {
  default: "bg-muted",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
} as const;

export function StatusDot({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: keyof typeof toneClass;
}) {
  return <span className={cn("inline-block size-2 rounded-full", toneClass[tone], className)} aria-hidden="true" />;
}
