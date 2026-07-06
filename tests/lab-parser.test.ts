import { describe, expect, it } from "vitest";
import { flagLabValue } from "@/lib/labs/flagging";
import { parseLabText } from "@/lib/labs/parser";

describe("lab parsing", () => {
  it("extracts common Quest-style rows", () => {
    const parsed = parseLabText(`
      Quest Diagnostics
      Collected: 06/15/2026
      Total Cholesterol 214 mg/dL <200
      HDL Cholesterol 58 mg/dL >39
      Hemoglobin A1c 5.7 % 4.8-5.6
    `);

    expect(parsed.labName).toBe("Quest Diagnostics");
    expect(parsed.results).toHaveLength(3);
    expect(parsed.results[0]).toMatchObject({
      testName: "Total Cholesterol",
      category: "Cholesterol",
      value: 214,
      flag: "HIGH",
    });
  });

  it("extracts MyQuest comprehensive panel rows with reference range before unit", () => {
    const parsed = parseLabText(`
      Quest Diagnostics
      Collected: 04/30/2026 07:48
      COMPREHENSIVE METABOLIC PANEL
      Analyte Value
      GLUCOSE 102 Reference Range: 65-99 mg/dL
      UREA NITROGEN (BUN) 17 Reference Range: 7-25 mg/dL
      CREATININE 1.11 Reference Range: 0.70-1.28 mg/dL
      EGFR 71 Reference Range: > OR = 60 mL/min/1.73m2
      BUN/CREATININE RATIO SEE NOTE: Reference Range: 6-22 (calc)
      POTASSIUM 4.3 Reference Range: 3.5-5.3 mmol/L
    `);

    expect(parsed.results).toHaveLength(6);
    expect(parsed.results[0]).toMatchObject({
      testName: "GLUCOSE",
      value: 102,
      unit: "mg/dL",
      referenceLow: 65,
      referenceHigh: 99,
      flag: "HIGH",
    });
    expect(parsed.results[3]).toMatchObject({
      testName: "EGFR",
      value: 71,
      unit: "mL/min/1.73m2",
      referenceLow: 60,
      flag: "NORMAL",
    });
    expect(parsed.results[4]).toMatchObject({
      testName: "BUN/CREATININE RATIO",
      stringValue: "SEE NOTE",
      unit: "(calc)",
      referenceLow: 6,
      referenceHigh: 22,
      flag: "UNKNOWN",
    });
  });

  it("marks near-edge values as borderline", () => {
    expect(flagLabValue(99, 70, 100)).toBe("BORDERLINE");
  });

  it("marks values inside one-sided reference ranges as normal", () => {
    expect(flagLabValue(58, 39, undefined)).toBe("NORMAL");
    expect(flagLabValue(72, undefined, 150)).toBe("NORMAL");
  });
});
