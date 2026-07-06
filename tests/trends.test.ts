import { describe, expect, it } from "vitest";
import { buildTrendInsights, buildTrendNotes, buildTrendPoint, getVisibleTrendMetrics, trendMetrics } from "@/lib/labs/trends";
import type { ParsedLabResult } from "@/lib/labs/types";

describe("lab trends", () => {
  it("does not treat HDL cholesterol as total cholesterol", () => {
    const point = buildTrendPoint("2026-04-30", [
      {
        testName: "HDL CHOLESTEROL",
        category: "Cholesterol",
        value: 57,
        unit: "mg/dL",
        referenceRangeRaw: "> OR = 40",
        referenceLow: 40,
        flag: "NORMAL",
      },
    ]);

    expect(point.totalCholesterol).toBeUndefined();
    expect(point.hdlCholesterol).toBe(57);
  });

  it("adds interpretation beyond movement direction", () => {
    const results: ParsedLabResult[][] = [
      [
        {
          testName: "HDL CHOLESTEROL",
          category: "Cholesterol",
          value: 45,
          unit: "mg/dL",
          referenceRangeRaw: "> OR = 40",
          referenceLow: 40,
          flag: "NORMAL",
        },
      ],
      [
        {
          testName: "HDL CHOLESTEROL",
          category: "Cholesterol",
          value: 57,
          unit: "mg/dL",
          referenceRangeRaw: "> OR = 40",
          referenceLow: 40,
          flag: "NORMAL",
        },
      ],
    ];

    const notes = buildTrendNotes([
      buildTrendPoint("2022-08-01", results[0]),
      buildTrendPoint("2026-04-30", results[1]),
    ]);

    expect(notes.join(" ")).toContain("For HDL, going up is usually good news");
  });

  it("labels trend movement as better, worse, stable, or not enough data", () => {
    const better = buildTrendInsights([
      buildTrendPoint("2025-01-01", [
        {
          testName: "Hemoglobin A1c",
          category: "Glucose",
          value: 6.1,
          unit: "%",
          flag: "HIGH",
        },
      ]),
      buildTrendPoint("2026-01-01", [
        {
          testName: "Hemoglobin A1c",
          category: "Glucose",
          value: 5.7,
          unit: "%",
          flag: "HIGH",
        },
      ]),
    ], "a1c");
    const worse = buildTrendInsights([
      buildTrendPoint("2025-01-01", [
        {
          testName: "HDL CHOLESTEROL",
          category: "Cholesterol",
          value: 55,
          unit: "mg/dL",
          flag: "NORMAL",
        },
      ]),
      buildTrendPoint("2026-01-01", [
        {
          testName: "HDL CHOLESTEROL",
          category: "Cholesterol",
          value: 45,
          unit: "mg/dL",
          flag: "NORMAL",
        },
      ]),
    ], "hdlCholesterol");
    const stable = buildTrendInsights([
      buildTrendPoint("2025-01-01", [
        {
          testName: "Triglycerides",
          category: "Cholesterol",
          value: 120,
          unit: "mg/dL",
          flag: "NORMAL",
        },
      ]),
      buildTrendPoint("2026-01-01", [
        {
          testName: "Triglycerides",
          category: "Cholesterol",
          value: 123,
          unit: "mg/dL",
          flag: "NORMAL",
        },
      ]),
    ], "triglycerides");
    const sparse = buildTrendInsights([
      buildTrendPoint("2026-01-01", [
        {
          testName: "Vitamin D",
          category: "Vitamins and Minerals",
          value: 22,
          unit: "ng/mL",
          flag: "LOW",
        },
      ]),
    ], "vitaminD");

    expect(better[0].status).toBe("Better");
    expect(worse[0].status).toBe("Worse");
    expect(stable[0].status).toBe("Stable");
    expect(sparse[0].status).toBe("Not enough data yet");
  });

  it("can focus notes on one selected trend line", () => {
    const points = [
      buildTrendPoint("2022-08-01", [
        {
          testName: "CHOLESTEROL, TOTAL",
          category: "Cholesterol",
          value: 179,
          unit: "mg/dL",
          referenceRangeRaw: "<200",
          referenceHigh: 200,
          flag: "NORMAL",
        },
        {
          testName: "HDL CHOLESTEROL",
          category: "Cholesterol",
          value: 45,
          unit: "mg/dL",
          referenceRangeRaw: "> OR = 40",
          referenceLow: 40,
          flag: "NORMAL",
        },
      ]),
      buildTrendPoint("2026-04-30", [
        {
          testName: "CHOLESTEROL, TOTAL",
          category: "Cholesterol",
          value: 214,
          unit: "mg/dL",
          referenceRangeRaw: "<200",
          referenceHigh: 200,
          flag: "HIGH",
        },
        {
          testName: "HDL CHOLESTEROL",
          category: "Cholesterol",
          value: 57,
          unit: "mg/dL",
          referenceRangeRaw: "> OR = 40",
          referenceLow: 40,
          flag: "NORMAL",
        },
      ]),
    ];

    const notes = buildTrendNotes(points, "hdlCholesterol").join(" ");

    expect(notes).toContain("HDL cholesterol went up");
    expect(notes).not.toContain("Total cholesterol");
  });

  it("only shows trend lines for supported markers found in reports", () => {
    const point = buildTrendPoint("2026-04-30", [
      {
        testName: "LDL CHOLESTEROL",
        category: "Cholesterol",
        value: 131,
        unit: "mg/dL",
        referenceRangeRaw: "<100",
        referenceHigh: 100,
        flag: "HIGH",
      },
      {
        testName: "Hemoglobin A1c",
        category: "Glucose",
        value: 5.7,
        unit: "%",
        referenceRangeRaw: "4.8-5.6",
        referenceLow: 4.8,
        referenceHigh: 5.6,
        flag: "HIGH",
      },
    ]);

    expect(trendMetrics.map((metric) => metric.label)).not.toContain("LDL cholesterol");
    expect(getVisibleTrendMetrics([point]).map((metric) => metric.label)).toEqual(["A1c"]);
  });
});
