"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendMetricKey, TrendPoint } from "@/lib/labs/trends";

const chartLines = [
  { key: "totalCholesterol", name: "Total cholesterol", color: "var(--primary)", unit: "mg/dL" },
  { key: "hdlCholesterol", name: "HDL cholesterol", color: "var(--success)", unit: "mg/dL" },
  { key: "triglycerides", name: "Triglycerides", color: "var(--warning)", unit: "mg/dL" },
  { key: "a1c", name: "A1c", color: "var(--accent)", unit: "%" },
  { key: "vitaminD", name: "Vitamin D", color: "var(--danger)", unit: "ng/mL" },
] as const;

type ChartLine = (typeof chartLines)[number];
type IndexedTrendPoint = {
  date: string;
} & Partial<Record<TrendMetricKey, number>> &
  Partial<Record<`${TrendMetricKey}Raw`, number>>;

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

function TrendTooltip({ active, label, payload }: { active?: boolean; label?: string; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-panel p-3 text-xs text-foreground shadow-sm">
      <p className="font-semibold">{label}</p>
      <div className="mt-2 grid gap-1">
        {payload.map((item) => {
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

export function TrendChart({
  data,
  onSelectMetric,
  selectedMetric,
}: {
  data: TrendPoint[];
  onSelectMetric?: (metric: TrendMetricKey) => void;
  selectedMetric?: TrendMetricKey;
}) {
  const visibleLines = chartLines.filter((line) => data.some((point) => typeof point[line.key] === "number"));
  const indexedData = buildIndexedData(data, visibleLines);

  return (
    <div className="grid w-full gap-3">
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
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-panel text-muted hover:border-primary/60 hover:text-foreground"
              }`}
              onClick={() => onSelectMetric?.(line.key)}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: line.color }} aria-hidden="true" />
              {line.name}
            </button>
          );
        })}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={indexedData} margin={{ left: 0, right: 18, top: 18, bottom: 8 }}>
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis
            domain={["dataMin - 8", "dataMax + 8"]}
            tickFormatter={(value) => `${Math.round(Number(value))}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            width={46}
          />
          <Tooltip content={<TrendTooltip />} />
          {visibleLines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeOpacity={!selectedMetric || selectedMetric === line.key ? 1 : 0.3}
              strokeWidth={selectedMetric === line.key ? 4 : 2.5}
              dot={{ r: selectedMetric === line.key ? 5 : 3 }}
              activeDot={{ r: 7, onClick: () => onSelectMetric?.(line.key) }}
              className="cursor-pointer"
              onClick={() => onSelectMetric?.(line.key)}
            />
          ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
