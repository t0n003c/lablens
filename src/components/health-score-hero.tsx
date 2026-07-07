import Link from "next/link";
import { type ReactNode } from "react";
import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { MetricTile } from "@/components/ui/metric-tile";

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
  const scoreTone = reviewCount >= 3 ? "var(--score-careful)" : reviewCount ? "var(--score-review)" : "var(--score-good)";
  const reviewTone: "warning" | "success" = reviewCount ? "warning" : "success";

  return (
    <>
      <GlassPanel className="grid gap-3 p-3 md:hidden">
        <div className="relative overflow-hidden rounded-md border border-white/10 bg-surface-instrument p-4 text-white shadow-[var(--shadow-instrument)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(61,218,199,0.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.08),transparent_46%)]" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <div
              className="grid size-32 shrink-0 place-items-center rounded-full p-2"
              style={{
                background: `conic-gradient(${scoreTone} ${score * 3.6}deg, rgb(255 255 255 / 0.12) 0deg)`,
              }}
              aria-hidden="true"
            >
              <div className="grid size-full place-items-center rounded-full border border-white/10 bg-black/25">
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Score</p>
                  <p className="mt-1 text-4xl font-semibold tracking-normal">{score}</p>
                  <p className="text-[11px] text-white/55">/100</p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Health score</p>
              <h2 className="mt-1 text-xl font-semibold">{statusLabel}</h2>
              <p className="mt-2 text-sm leading-6 text-white/68">{scoreReason}</p>
            </div>
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
