import type { ParsedLabResult } from "@/lib/labs/types";

export type LatestLabResult = ParsedLabResult & {
  resultDate: string;
};

export type ReportWithLabResults<T extends ParsedLabResult = ParsedLabResult> = {
  reportDate: string | Date;
  labResults: T[];
};

export function normalizeLatestLabKey(testName: string) {
  return testName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const categoryOrder = [
  "Cholesterol",
  "Glucose",
  "Liver",
  "Kidney",
  "Blood Count",
  "Vitamins and Minerals",
  "Thyroid",
  "Electrolytes",
  "Inflammation",
  "Other",
];

const categoryRank = new Map(categoryOrder.map((category, index) => [category.toLowerCase(), index]));

const flagRank: Record<ParsedLabResult["flag"], number> = {
  CONCERNING: 0,
  HIGH: 1,
  LOW: 1,
  BORDERLINE: 2,
  UNKNOWN: 3,
  NORMAL: 4,
};

function dateTime(value: string | Date) {
  const parsed = value instanceof Date ? value : new Date(value);
  const time = parsed.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base", numeric: true });
}

function rankCategory(category: string) {
  return categoryRank.get(category.toLowerCase()) ?? categoryOrder.length - 1;
}

export function sortLatestLabValues<T extends ParsedLabResult>(results: T[]) {
  return results.slice().sort((first, second) => {
    const categoryComparison = rankCategory(first.category) - rankCategory(second.category);
    if (categoryComparison !== 0) return categoryComparison;

    const flagComparison = flagRank[first.flag] - flagRank[second.flag];
    if (flagComparison !== 0) return flagComparison;

    return compareText(first.testName, second.testName);
  });
}

export function latestLabValuesByTest<T extends ParsedLabResult>(reports: Array<ReportWithLabResults<T>>): Array<T & LatestLabResult> {
  const seen = new Set<string>();
  const latest: Array<T & LatestLabResult> = [];

  const newestFirst = reports
    .slice()
    .sort((first, second) => dateTime(second.reportDate) - dateTime(first.reportDate));

  for (const report of newestFirst) {
    for (const result of report.labResults) {
      const key = normalizeLatestLabKey(result.testName);
      if (!key || seen.has(key)) continue;

      seen.add(key);
      latest.push({
        ...result,
        resultDate: report.reportDate instanceof Date ? report.reportDate.toISOString() : report.reportDate,
      });
    }
  }

  return sortLatestLabValues(latest);
}
