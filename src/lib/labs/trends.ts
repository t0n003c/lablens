import type { LabFlag, ParsedLabResult } from "@/lib/labs/types";

export type TrendMetricKey = "totalCholesterol" | "hdlCholesterol" | "triglycerides" | "a1c" | "vitaminD";
export type TrendStatus = "Better" | "Worse" | "Stable" | "Not enough data yet";
export type TrendTone = "success" | "warning" | "muted" | "info";

export type TrendPoint = {
  date: string;
} & Partial<Record<TrendMetricKey, number>> &
  Partial<Record<`${TrendMetricKey}Flag`, LabFlag>>;

export type TrendInsight = {
  metricKey: TrendMetricKey;
  label: string;
  status: TrendStatus;
  tone: TrendTone;
  summary: string;
  detail: string;
};

function normalizedTestName(result: ParsedLabResult) {
  return result.testName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export const trendMetrics = [
  {
    key: "totalCholesterol",
    label: "Total cholesterol",
    unit: "mg/dL",
    steadyThreshold: 3,
    healthyDirection: "lower",
    matches: (result: ParsedLabResult) => {
      const name = normalizedTestName(result);
      return (
        (name.includes("total cholesterol") || name.includes("cholesterol total") || name === "cholesterol") &&
        !/(hdl|ldl|non hdl|ratio)/.test(name)
      );
    },
  },
  {
    key: "hdlCholesterol",
    label: "HDL cholesterol",
    unit: "mg/dL",
    steadyThreshold: 2,
    healthyDirection: "higher",
    matches: (result: ParsedLabResult) => {
      const name = normalizedTestName(result);
      return name.includes("hdl") && name.includes("cholesterol") && !name.includes("ratio");
    },
  },
  {
    key: "triglycerides",
    label: "Triglycerides",
    unit: "mg/dL",
    steadyThreshold: 5,
    healthyDirection: "lower",
    matches: (result: ParsedLabResult) => normalizedTestName(result).includes("triglycerides"),
  },
  {
    key: "a1c",
    label: "A1c",
    unit: "%",
    steadyThreshold: 0.1,
    healthyDirection: "lower",
    matches: (result: ParsedLabResult) => /a1c|hemoglobin a1c/.test(normalizedTestName(result)),
  },
  {
    key: "vitaminD",
    label: "Vitamin D",
    unit: "ng/mL",
    steadyThreshold: 2,
    healthyDirection: "range",
    matches: (result: ParsedLabResult) => normalizedTestName(result).includes("vitamin d"),
  },
] as const;

function formatTrendDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function formatTrendValue(value: number, unit: string) {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  if (unit === "%") return `${formatted}%`;
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function referenceStatus(flag?: LabFlag) {
  switch (flag) {
    case "NORMAL":
      return "your latest result is inside the lab's range";
    case "BORDERLINE":
      return "your latest result is close to the edge of the lab's range";
    case "HIGH":
      return "your latest result is above the lab's range";
    case "LOW":
      return "your latest result is below the lab's range";
    case "CONCERNING":
      return "your latest result is well outside the lab's range";
    default:
      return "use the lab's range and your clinician's guidance to judge the latest result";
  }
}

function statusTone(status: TrendStatus): TrendTone {
  if (status === "Better") return "success";
  if (status === "Worse") return "warning";
  if (status === "Stable") return "muted";
  return "info";
}

function trendFlagKey(key: TrendMetricKey) {
  return `${key}Flag` as `${TrendMetricKey}Flag`;
}

function metricResult(results: ParsedLabResult[], metric: (typeof trendMetrics)[number]) {
  return results.find((result) => typeof result.value === "number" && metric.matches(result));
}

export function hasTrendValue(point: TrendPoint) {
  return trendMetrics.some((metric) => typeof point[metric.key] === "number");
}

export function getVisibleTrendMetrics(data: TrendPoint[]) {
  return trendMetrics.filter((metric) => data.some((point) => typeof point[metric.key] === "number"));
}

export function buildTrendPoint(reportDate: string | Date, results: ParsedLabResult[]): TrendPoint {
  const point: TrendPoint = {
    date: formatTrendDate(reportDate),
  };

  for (const metric of trendMetrics) {
    const result = metricResult(results, metric);
    if (typeof result?.value !== "number") continue;
    point[metric.key] = result.value;
    point[trendFlagKey(metric.key)] = result.flag;
  }

  return point;
}

function movementText(label: string, first: TrendPoint, latest: TrendPoint, firstValue: number, latestValue: number, unit: string, steadyThreshold: number) {
  const change = latestValue - firstValue;
  if (Math.abs(change) <= steadyThreshold) {
    return `${label} stayed about the same, around ${formatTrendValue(latestValue, unit)}`;
  }

  return `${label} went ${change > 0 ? "up" : "down"} from ${formatTrendValue(firstValue, unit)} to ${formatTrendValue(latestValue, unit)}`;
}

function trendStatus(
  key: TrendMetricKey,
  healthyDirection: "lower" | "higher" | "range",
  firstValue: number,
  latestValue: number,
  latestFlag?: LabFlag,
  steadyThreshold = 0,
): TrendStatus {
  const change = latestValue - firstValue;
  if (Math.abs(change) <= steadyThreshold) return "Stable";

  if (healthyDirection === "higher") return change > 0 ? "Better" : "Worse";
  if (healthyDirection === "lower") return change < 0 ? "Better" : "Worse";

  if (key === "vitaminD") {
    if (latestFlag === "HIGH" || latestFlag === "CONCERNING") return change > 0 ? "Worse" : "Better";
    if (latestFlag === "LOW") return change > 0 ? "Better" : "Worse";
    return "Stable";
  }

  return "Stable";
}

function trendMeaning(key: TrendMetricKey, firstValue: number, latestValue: number, latestFlag?: LabFlag, trendStatusLabel?: TrendStatus) {
  const movedUp = latestValue > firstValue;
  const latestStatus = referenceStatus(latestFlag);

  if (key === "totalCholesterol") {
    return movedUp
      ? `This leans worse because lower is usually the better direction for total cholesterol. Still, the full picture depends on LDL, HDL, triglycerides, and the fact that ${latestStatus}.`
      : `This leans better because lower is usually the better direction when total cholesterol was high. Still, the full picture depends on LDL, HDL, triglycerides, and the fact that ${latestStatus}.`;
  }

  if (key === "hdlCholesterol") {
    return movedUp
      ? `For HDL, going up is usually good news because HDL is the cholesterol marker where higher is often better; ${latestStatus}.`
      : `For HDL, going down can be less helpful if it gets too low; ${latestStatus}.`;
  }

  if (key === "triglycerides") {
    return movedUp
      ? `This leans worse because lower triglycerides are usually preferred. Recent meals, alcohol, and whether you were fasting can affect it; ${latestStatus}.`
      : `This leans better because lower triglycerides are usually preferred, and ${latestStatus}.`;
  }

  if (key === "a1c") {
    return movedUp
      ? `This leans worse because it can mean average blood sugar has been running higher over the last few months, and ${latestStatus}.`
      : `This leans better because it usually means average blood sugar has been running lower over the last few months, and ${latestStatus}.`;
  }

  if (trendStatusLabel === "Stable") {
    return `Vitamin D is best read against the lab's range rather than as simply higher or lower; ${latestStatus}.`;
  }

  return movedUp
    ? `This may be better if vitamin D was low, but more is not always better; ${latestStatus}.`
    : `This may be worse if it keeps moving toward the low end; ${latestStatus}.`;
}

export function buildTrendInsights(data: TrendPoint[], selectedMetric?: TrendMetricKey): TrendInsight[] {
  const insights: TrendInsight[] = [];
  const singlePointInsights: TrendInsight[] = [];
  const metrics = selectedMetric ? trendMetrics.filter((metric) => metric.key === selectedMetric) : trendMetrics;

  for (const metric of metrics) {
    const points = data.filter((point) => typeof point[metric.key] === "number");
    if (points.length === 1) {
      const value = points[0][metric.key];
      if (typeof value === "number") {
        singlePointInsights.push({
          metricKey: metric.key,
          label: metric.label,
          status: "Not enough data yet",
          tone: "info",
          summary: `${metric.label} only appears once so far: ${formatTrendValue(value, metric.unit)} in ${points[0].date}.`,
          detail: "Add another report with the same test before trusting a trend.",
        });
      }
      continue;
    }

    if (points.length < 2) continue;

    const first = points[0];
    const latest = points[points.length - 1];
    const firstValue = first[metric.key];
    const latestValue = latest[metric.key];
    if (typeof firstValue !== "number" || typeof latestValue !== "number") continue;
    const latestFlag = latest[trendFlagKey(metric.key)];
    const status = trendStatus(metric.key, metric.healthyDirection, firstValue, latestValue, latestFlag, metric.steadyThreshold);
    const summary = `${movementText(metric.label, first, latest, firstValue, latestValue, metric.unit, metric.steadyThreshold)} between ${first.date} and ${latest.date}.`;
    const detail =
      status === "Stable"
        ? `${metric.label} has not moved much. That can be reassuring when ${referenceStatus(latestFlag)}, but it is still worth comparing with symptoms, habits, and your clinician's goals.`
        : trendMeaning(metric.key, firstValue, latestValue, latestFlag, status);

    insights.push({
      metricKey: metric.key,
      label: metric.label,
      status,
      tone: statusTone(status),
      summary,
      detail,
    });
  }

  const nextInsights = [...insights.slice(0, 4), ...singlePointInsights.slice(0, 2)];

  if (!nextInsights.length) {
    return [
      {
        metricKey: selectedMetric ?? "totalCholesterol",
        label: "Trends",
        status: "Not enough data yet",
        tone: "info",
        summary: "There is not enough matching data for a trend yet.",
        detail: "Add another report with matching lab names to see whether values are rising, falling, or staying steady.",
      },
    ];
  }

  if (selectedMetric) {
    return nextInsights.slice(0, 2);
  }

  return nextInsights.slice(0, 5);
}

export function buildTrendNotes(data: TrendPoint[], selectedMetric?: TrendMetricKey) {
  const notes = buildTrendInsights(data, selectedMetric).map((insight) => `${insight.status}: ${insight.summary} ${insight.detail}`);

  if (selectedMetric) return notes;

  return [
    ...notes,
    "Read each line by itself. Different tests use different units, and up is not always better or worse.",
  ];
}
