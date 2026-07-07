import { describe, expect, it } from "vitest";
import { latestLabValuesByTest, sortLatestLabValues } from "@/lib/labs/latest-values";

describe("latest lab values", () => {
  it("picks the newest saved value for each test across reports", () => {
    const results = latestLabValuesByTest([
      {
        reportDate: "2026-01-15",
        labResults: [
          {
            testName: "Total Cholesterol",
            category: "Cholesterol",
            value: 179,
            unit: "mg/dL",
            flag: "NORMAL",
          },
          {
            testName: "Vitamin D",
            category: "Vitamins and Minerals",
            value: 22,
            unit: "ng/mL",
            flag: "LOW",
          },
        ],
      },
      {
        reportDate: "2026-06-15",
        labResults: [
          {
            testName: "TOTAL CHOLESTEROL",
            category: "Cholesterol",
            value: 214,
            unit: "mg/dL",
            flag: "HIGH",
          },
          {
            testName: "A1c",
            category: "Glucose",
            value: 5.7,
            unit: "%",
            flag: "HIGH",
          },
        ],
      },
    ]);

    expect(results).toHaveLength(3);
    expect(results.map((result) => result.testName)).toEqual(["TOTAL CHOLESTEROL", "A1c", "Vitamin D"]);
    expect(results.find((result) => result.testName === "TOTAL CHOLESTEROL")?.value).toBe(214);
    expect(results.find((result) => result.testName === "Vitamin D")?.resultDate).toBe("2026-01-15");
    expect(results.find((result) => result.testName === "A1c")?.resultDate).toBe("2026-06-15");
  });

  it("sorts by useful category groups, then attention status, then test name", () => {
    const results = sortLatestLabValues([
      {
        testName: "Creatinine",
        category: "Kidney",
        value: 0.9,
        flag: "NORMAL",
      },
      {
        testName: "HDL Cholesterol",
        category: "Cholesterol",
        value: 58,
        flag: "NORMAL",
      },
      {
        testName: "LDL Cholesterol",
        category: "Cholesterol",
        value: 121,
        flag: "HIGH",
      },
      {
        testName: "A1c",
        category: "Glucose",
        value: 5.7,
        flag: "HIGH",
      },
      {
        testName: "ALT",
        category: "Liver",
        value: 44,
        flag: "BORDERLINE",
      },
    ]);

    expect(results.map((result) => result.testName)).toEqual([
      "LDL Cholesterol",
      "HDL Cholesterol",
      "A1c",
      "ALT",
      "Creatinine",
    ]);
  });
});
