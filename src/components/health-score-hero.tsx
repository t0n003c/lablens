import Link from "next/link";
import { type ReactNode } from "react";
import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MetricTile } from "@/components/ui/metric-tile";
import { getHealthScoreTone } from "@/lib/health-score";

export function HealthScoreHero({
  rawPdfStorageHref,
  rawPdfStorageValue,
  reviewCount,
  reviewHref,
  reviewValue,
  savedReportsHref,
  savedReportsValue,
  score,
  scoreReason,
  statusLabel,
  startHereCard,
}: {
  rawPdfStorageHref: string;
  rawPdfStorageValue: string;
  reviewCount: number;
  reviewHref: string;
  reviewValue: string;
  savedReportsHref: string;
  savedReportsValue: string;
  score: number;
  scoreReason: string;
  statusLabel: string;
  startHereCard?: ReactNode;
}) {
  const scoreTone = getHealthScoreTone(score);
  const reviewTone: "warning" | "success" = reviewCount ? "warning" : "success";

  return (
    <>
      <GlassPanel className="grid gap-3 p-3 md:hidden">
        <div className="grid content-center gap-4 rounded-md border border-border-soft bg-surface-raised/80 p-5 text-center shadow-[var(--shadow-card)] dark:bg-white/[0.04]">
          <div
            className="mx-auto grid size-40 place-items-center rounded-full p-3"
            style={{
              background: `conic-gradient(${scoreTone} ${score * 3.6}deg, color-mix(in srgb, var(--border) 70%, transparent) 0deg)`,
            }}
            aria-hidden="true"
          >
            <div className="grid size-full place-items-center rounded-full border border-border-soft bg-panel shadow-inner">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Health score</p>
                <p className="mt-1 text-5xl font-semibold tracking-normal text-foreground">{score}</p>
                <p className="text-xs text-muted">/100</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{statusLabel}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{scoreReason}</p>
          </div>
        </div>

        {startHereCard}

        <div className="grid gap-2 sm:grid-cols-3">
          <Link href={savedReportsHref} aria-label="Open saved reports" className="block rounded-md transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">
            <MetricTile icon={FileText} label="Saved reports" value={savedReportsValue} meta="Report history" tone="success" />
          </Link>
          <Link href={rawPdfStorageHref} aria-label="Open raw PDF storage settings" className="block rounded-md transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">
            <MetricTile icon={ShieldCheck} label="Raw PDF storage" value={rawPdfStorageValue} meta="Future uploads" tone="accent" />
          </Link>
          <Link href={reviewHref} aria-label="Open lab values that need review" className="block rounded-md transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">
            <MetricTile icon={AlertTriangle} label="Needs review" value={reviewValue} meta={reviewCount ? "Flagged values" : "No flags"} tone={reviewTone} />
          </Link>
        </div>
      </GlassPanel>

      <GlassPanel className="hidden gap-5 p-5 md:grid xl:grid-cols-[0.72fr_1.28fr] xl:items-stretch">
        <div className="grid content-center gap-5 rounded-md border border-border-soft bg-surface-raised/80 p-5 dark:bg-white/[0.04]">
          <div
            className="mx-auto grid size-40 place-items-center rounded-full p-3 sm:size-44"
            style={{
              background: `conic-gradient(${scoreTone} ${score * 3.6}deg, color-mix(in srgb, var(--border) 70%, transparent) 0deg)`,
            }}
            aria-hidden="true"
          >
            <div className="grid size-full place-items-center rounded-full border border-border-soft bg-panel shadow-inner">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Health score</p>
                <p className="mt-1 text-5xl font-semibold tracking-normal text-foreground">{score}</p>
                <p className="text-xs text-muted">/100</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{statusLabel}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{scoreReason}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {startHereCard}
          <div className="grid gap-3 md:grid-cols-3">
            <Link href={savedReportsHref} aria-label="Open saved reports" className="block rounded-md transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">
              <MetricTile icon={FileText} label="Saved reports" value={savedReportsValue} meta="Report history" tone="success" />
            </Link>
            <Link href={rawPdfStorageHref} aria-label="Open raw PDF storage settings" className="block rounded-md transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">
              <MetricTile icon={ShieldCheck} label="Raw PDF storage" value={rawPdfStorageValue} meta="Future uploads" tone="accent" />
            </Link>
            <Link href={reviewHref} aria-label="Open lab values that need review" className="block rounded-md transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">
              <MetricTile icon={AlertTriangle} label="Needs review" value={reviewValue} meta={reviewCount ? "Flagged values" : "No flags"} tone={reviewTone} />
            </Link>
          </div>
        </div>
      </GlassPanel>
    </>
  );
}
