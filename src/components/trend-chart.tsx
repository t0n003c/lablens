"use client";

import { useMemo, useState } from "react";
import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Maximize2, Minus, Plus } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { TrendMetricKey, TrendPoint } from "@/lib/labs/trends";

const chartLines = [
  { key: "totalCholesterol", name: "Total cholesterol", color: "var(--chart-total-cholesterol)", unit: "mg/dL" },
  { key: "hdlCholesterol", name: "HDL cholesterol", color: "var(--chart-hdl)", unit: "mg/dL" },
  { key: "triglycerides", name: "Triglycerides", color: "var(--chart-triglycerides)", unit: "mg/dL" },
  { key: "a1c", name: "A1c", color: "var(--chart-a1c)", unit: "%" },
  { key: "vitaminD", name: "Vitamin D", color: "var(--chart-vitamin-d)", unit: "ng/mL" },
] as const;

type ChartLine = (typeof chartLines)[number];
type IndexedTrendPoint = {
  date: string;
} & Partial<Record<TrendMetricKey, number>> &
  Partial<Record<`${TrendMetricKey}Raw`, number>>;

type ActiveChartState = {
  activeLabel?: unknown;
  activePayload?: TooltipItem[];
};

function rawKey(key: TrendMetricKey) {
  return `${key}Raw` as `${TrendMetricKey}Raw`;
}

function formatRawValue(value: number, unit: string) {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  if (unit === "%") return `${formatted}%`;
  return `${formatted} ${unit}`;
}

function buildIndexedData(data: TrendPoint[], visibleLines: readonly ChartLine[]) {
  const baselines = new Map<TrendMetricKey, number>();

  for (const line of visibleLines) {
    const baseline = data.find((point) => typeof point[line.key] === "number")?.[line.key];
    if (typeof baseline === "number" && baseline !== 0) baselines.set(line.key, baseline);
  }

  return data.map((point) => {
    const indexedPoint: IndexedTrendPoint = { date: point.date };

    for (const line of visibleLines) {
      const value = point[line.key];
      const baseline = baselines.get(line.key);
      if (typeof value !== "number" || typeof baseline !== "number") continue;
      indexedPoint[line.key] = (value / baseline) * 100;
      indexedPoint[rawKey(line.key)] = value;
    }

    return indexedPoint;
  });
}

type TooltipItem = {
  color?: string;
  dataKey?: TrendMetricKey;
  name?: string;
  payload?: IndexedTrendPoint;
  value?: number;
};

function TrendTooltip({
  active,
  activeMetric,
  label,
  payload,
}: {
  active?: boolean;
  activeMetric?: TrendMetricKey;
  label?: string;
  payload?: TooltipItem[];
}) {
  if (!active || !payload?.length) return null;
  const visiblePayload = activeMetric ? payload.filter((item) => item.dataKey === activeMetric) : payload.slice(0, 1);

  return (
    <div className="rounded-md border border-white/10 bg-[#071716]/95 p-3 text-xs text-white shadow-[var(--shadow-instrument)] backdrop-blur">
      <p className="font-semibold">{label}</p>
      <div className="mt-2 grid gap-1">
        {visiblePayload.map((item) => {
          const line = chartLines.find((candidate) => candidate.key === item.dataKey);
          const rawValue = item.dataKey ? item.payload?.[rawKey(item.dataKey)] : undefined;
          const indexedValue = typeof item.value === "number" ? item.value - 100 : undefined;
          if (!line || typeof rawValue !== "number" || typeof indexedValue !== "number") return null;
          const direction = indexedValue >= 0 ? "+" : "";

          return (
            <p key={line.key} style={{ color: item.color }}>
              {line.name}: {formatRawValue(rawValue, line.unit)} ({direction}
              {indexedValue.toFixed(0)}%)
            </p>
          );
        })}
      </div>
    </div>
  );
}

function takeRange(data: TrendPoint[], range: "3" | "6" | "all", zoomLevel: number) {
  const rangeCount = range === "all" ? data.length : Number(range);
  const rangedData = data.slice(-rangeCount);
  if (zoomLevel <= 1) return rangedData;
  const zoomCount = Math.max(2, Math.ceil(rangedData.length / zoomLevel));
  return rangedData.slice(-zoomCount);
}

export function TrendChart({
  data,
  onSelectMetric,
  selectedMetric,
}: {
  data: TrendPoint[];
  onSelectMetric?: (metric: TrendMetricKey) => void;
  selectedMetric?: TrendMetricKey;
}) {
  const [range, setRange] = useState<"3" | "6" | "all">("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTooltipMetric, setActiveTooltipMetric] = useState<TrendMetricKey>();
  const chartData = useMemo(() => takeRange(data, range, zoomLevel), [data, range, zoomLevel]);
  const visibleLines = chartLines.filter((line) => data.some((point) => typeof point[line.key] === "number"));
  const indexedData = buildIndexedData(chartData, visibleLines);
  const activeMetric = activeTooltipMetric ?? selectedMetric;
  const rangeOptions = [
    { value: "3", label: "Last 3" },
    { value: "6", label: "Last 6" },
    { value: "all", label: "All" },
  ] as const;

  return (
    <div className="grid w-full gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          ariaLabel="Trend date range"
          className="border-white/10 bg-white/[0.06]"
          options={[...rangeOptions]}
          value={range}
          onChange={(nextRange) => {
            setRange(nextRange);
            setZoomLevel(1);
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((current) => Math.min(4, current + 1))}
            disabled={indexedData.length <= 2 || zoomLevel >= 4}
            className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-white/70 transition hover:border-primary/60 hover:bg-primary/15 hover:text-primary disabled:opacity-40"
            aria-label="Zoom in on trend chart"
            title="Zoom in"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((current) => Math.max(1, current - 1))}
            disabled={zoomLevel <= 1}
            className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-white/70 transition hover:border-primary/60 hover:bg-primary/15 hover:text-primary disabled:opacity-40"
            aria-label="Zoom out on trend chart"
            title="Zoom out"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRange("all");
              setZoomLevel(1);
            }}
            className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-white/70 transition hover:border-primary/60 hover:bg-primary/15 hover:text-primary"
            aria-label="Reset trend chart zoom"
            title="Reset zoom"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleLines.map((line) => {
          const isSelected = line.key === selectedMetric;

          return (
            <button
              key={line.key}
              type="button"
              aria-pressed={isSelected}
              className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                isSelected
                  ? "border-primary/70 bg-primary/15 text-white shadow-sm"
                  : "border-white/10 bg-white/[0.05] text-white/65 hover:border-primary/60 hover:bg-primary/10 hover:text-white"
              }`}
              onClick={() => onSelectMetric?.(line.key)}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: line.color }} aria-hidden="true" />
              {line.name}
            </button>
          );
        })}
      </div>
      <div className="h-80 w-full rounded-md border border-white/10 bg-surface-chart/95 p-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06)] [&_*:focus]:outline-none [&_.recharts-surface]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={indexedData}
            margin={{ left: 0, right: 18, top: 18, bottom: indexedData.length > 3 ? 38 : 18 }}
            onClick={(state) => {
              const activeState = state as ActiveChartState;
              const metric = activeTooltipMetric ?? selectedMetric ?? activeState?.activePayload?.[0]?.dataKey;
              if (metric) onSelectMetric?.(metric);
            }}
            onMouseLeave={() => setActiveTooltipMetric(undefined)}
          >
            <CartesianGrid stroke="rgb(255 255 255 / 0.11)" strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="date"
              height={38}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgb(255 255 255 / 0.58)", fontSize: 12 }}
              tickMargin={14}
              minTickGap={18}
            />
            <YAxis
              domain={["dataMin - 8", "dataMax + 8"]}
              tickFormatter={(value) => `${Math.round(Number(value))}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgb(255 255 255 / 0.58)", fontSize: 12 }}
              width={46}
            />
            <Tooltip content={<TrendTooltip activeMetric={activeMetric} />} />
            {visibleLines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeOpacity={!selectedMetric || selectedMetric === line.key ? 1 : 0.24}
                strokeWidth={selectedMetric === line.key ? 4 : 2.5}
                dot={{
                  r: selectedMetric === line.key ? 5 : 3,
                  strokeWidth: 2,
                  onClick: () => onSelectMetric?.(line.key),
                  onMouseEnter: () => setActiveTooltipMetric(line.key),
                }}
                activeDot={
                  activeMetric === line.key
                    ? {
                        r: 7,
                        onClick: () => onSelectMetric?.(line.key),
                        onMouseEnter: () => setActiveTooltipMetric(line.key),
                      }
                    : false
                }
                className="cursor-pointer"
                isAnimationActive
                onClick={() => {
                  setActiveTooltipMetric(line.key);
                  onSelectMetric?.(line.key);
                }}
                onMouseEnter={() => setActiveTooltipMetric(line.key)}
                tabIndex={-1}
              />
            ))}
            {indexedData.length > 3 ? (
              <Brush
                dataKey="date"
                height={18}
                travellerWidth={8}
                stroke="var(--primary)"
                fill="rgb(255 255 255 / 0.07)"
                tickFormatter={(value) => String(value).slice(5)}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
