"use client";

import Image from "next/image";
import { useState } from "react";
import { Info, LineChart, RadioTower } from "lucide-react";
import { TrendChart } from "@/components/trend-chart";
import { InstrumentPanel } from "@/components/ui/instrument-panel";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { trendMetrics, type TrendInsight, type TrendMetricKey, type TrendPoint, type TrendTone } from "@/lib/labs/trends";

type TrendMode = "trend" | "compare" | "distribution";

const metricColors: Record<TrendMetricKey, string> = {
  totalCholesterol: "var(--chart-total-cholesterol)",
  hdlCholesterol: "var(--chart-hdl)",
  triglycerides: "var(--chart-triglycerides)",
  a1c: "var(--chart-a1c)",
  vitaminD: "var(--chart-vitamin-d)",
};

function trendToneClass(tone: TrendTone) {
  if (tone === "success") return "border-success/30 bg-success/15 text-success";
  if (tone === "warning") return "border-warning/30 bg-warning/15 text-warning";
  if (tone === "info") return "border-primary/35 bg-primary/15 text-primary";
  return "border-white/10 bg-white/[0.06] text-white/70";
}

function formatMetricValue(value: number, unit: string) {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  if (unit === "%") return `${formatted}%`;
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function metricStats(data: TrendPoint[], insights: TrendInsight[]) {
  return trendMetrics
    .map((metric) => {
      const points = data
        .map((point) => ({ date: point.date, flag: point[`${metric.key}Flag` as `${TrendMetricKey}Flag`], value: point[metric.key] }))
        .filter((point): point is { date: string; flag: NonNullable<typeof point.flag>; value: number } => typeof point.value === "number");
      if (!points.length) return undefined;

      const first = points[0];
      const latest = points[points.length - 1];
      const min = Math.min(...points.map((point) => point.value));
      const max = Math.max(...points.map((point) => point.value));
      const change = first.value === 0 ? 0 : ((latest.value - first.value) / Math.abs(first.value)) * 100;
      const insight = insights.find((item) => item.metricKey === metric.key);

      return {
        change,
        color: metricColors[metric.key],
        first,
        insight,
        key: metric.key,
        label: metric.label,
        latest,
        max,
        min,
        points,
        unit: metric.unit,
      };
    })
    .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat));
}

export function TrendInstrument({
  data,
  onSelectMetric,
  selectedMetric,
  trendInfoText,
  trendInsights,
}: {
  data: TrendPoint[];
  onSelectMetric?: (metric: TrendMetricKey) => void;
  selectedMetric?: TrendMetricKey;
  trendInfoText: string;
  trendInsights: TrendInsight[];
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [mode, setMode] = useState<TrendMode>("trend");
  const stats = metricStats(data, trendInsights);
  const selectedStats = selectedMetric ? stats.filter((stat) => stat.key === selectedMetric) : stats;
  const modeOptions = [
    { label: "Trend", value: "trend" },
    { label: "Compare", value: "compare" },
    { label: "Distribution", value: "distribution" },
  ] as const;

  return (
    <InstrumentPanel className="p-3 sm:p-5">
      <Image
        src="/illustrations/lablens-trend-lens.png"
        alt=""
        width={1536}
        height={960}
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-surface-instrument/82" aria-hidden="true" />

      <div className="relative grid gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-primary sm:size-11">
              <LineChart className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Longitudinal view</p>
              <h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Trends</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl ariaLabel="Trend view mode" className="border-white/10 bg-white/[0.06]" options={[...modeOptions]} value={mode} onChange={setMode} />
            <div className="relative">
              <button
                type="button"
                aria-label="Trend chart info"
                aria-expanded={infoOpen}
                onClick={() => setInfoOpen((open) => !open)}
                onMouseEnter={() => setInfoOpen(true)}
                onMouseLeave={() => setInfoOpen(false)}
                onFocus={() => setInfoOpen(true)}
                onBlur={() => setInfoOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-primary transition hover:border-primary/60 hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <Info className="size-4" aria-hidden="true" />
              </button>
              {infoOpen ? (
                <div className="absolute right-0 top-11 z-20 w-[min(23rem,calc(100vw-3rem))] rounded-md border border-white/10 bg-[#071716]/95 p-3 text-sm leading-6 text-white/72 shadow-[var(--shadow-instrument)] backdrop-blur">
                  {trendInfoText}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="grid gap-4">
            {mode === "trend" ? (
              data.length ? (
                <TrendChart data={data} selectedMetric={selectedMetric} onSelectMetric={onSelectMetric} />
              ) : (
                <p className="rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm text-white/70">Add more reports to build trend charts.</p>
              )
            ) : null}

            {mode === "compare" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {stats.map((stat) => {
                  const direction = stat.change >= 0 ? "+" : "";
                  return (
                    <button
                      key={stat.key}
                      type="button"
                      onClick={() => onSelectMetric?.(stat.key)}
                      aria-pressed={selectedMetric === stat.key}
                      className="grid gap-3 rounded-md border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-primary/60 hover:bg-primary/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{stat.label}</p>
                          <p className="mt-1 text-xs text-white/55">{stat.points.length} saved point{stat.points.length === 1 ? "" : "s"}</p>
                        </div>
                        <span className="size-2 rounded-full" style={{ backgroundColor: stat.color }} aria-hidden="true" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                        <span>
                          First
                          <strong className="mt-1 block text-sm text-white">{formatMetricValue(stat.first.value, stat.unit)}</strong>
                        </span>
                        <span>
                          Latest
                          <strong className="mt-1 block text-sm text-white">{formatMetricValue(stat.latest.value, stat.unit)}</strong>
                        </span>
                      </div>
                      <span className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${trendToneClass(stat.insight?.tone ?? "info")}`}>
                        {stat.insight?.status ?? "Tracked"} {direction}
                        {stat.change.toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {mode === "distribution" ? (
              <div className="grid gap-3">
                {selectedStats.map((stat) => {
                  const range = Math.max(1, stat.max - stat.min);
                  const latestPosition = Math.min(100, Math.max(0, ((stat.latest.value - stat.min) / range) * 100));
                  return (
                    <article key={stat.key} className="rounded-md border border-white/10 bg-white/[0.06] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{stat.label}</p>
                          <p className="mt-1 text-xs text-white/55">Shows latest value inside the saved range for this marker.</p>
                        </div>
                        <span className="rounded-md border border-white/10 bg-black/15 px-2 py-1 text-xs font-semibold text-white/70">
                          {formatMetricValue(stat.latest.value, stat.unit)}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="relative h-3 rounded-full bg-white/10">
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${latestPosition}%`, backgroundColor: stat.color }} />
                          <span
                            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-surface-instrument"
                            style={{ left: `${latestPosition}%` }}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-white/55">
                          <span>Low saved: {formatMetricValue(stat.min, stat.unit)}</span>
                          <span>High saved: {formatMetricValue(stat.max, stat.unit)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className="relative grid content-start gap-4 rounded-md border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
            <div className="rounded-md border border-white/10 bg-black/15 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <RadioTower className="size-4" aria-hidden="true" />
                Chart updates
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/62">
                <span className="rounded-md bg-white/[0.06] p-2">
                  Mode
                  <strong className="mt-1 block text-white">{mode === "trend" ? "Trend line" : mode === "compare" ? "Marker compare" : "Saved range"}</strong>
                </span>
                <span className="rounded-md bg-white/[0.06] p-2">
                  Coverage
                  <strong className="mt-1 block text-white">{stats.length} marker{stats.length === 1 ? "" : "s"}</strong>
                </span>
              </div>
            </div>

            <ul className="grid gap-4 text-sm leading-6 text-white/68">
              {trendInsights.map((item) => (
                <li key={`${item.metricKey}-${item.status}-${item.summary}`} className="rounded-md border border-white/10 bg-black/15 p-3">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${trendToneClass(item.tone)}`}>{item.status}</span>
                  <p className="mt-2 font-medium text-white">{item.summary}</p>
                  <p className="mt-1">{item.detail}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </InstrumentPanel>
  );
}
