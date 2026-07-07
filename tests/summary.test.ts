import { describe, expect, it } from "vitest";
import { createLocalSummary } from "@/lib/ai/summarizer";
import { demoResults } from "@/lib/demo/data";
import type { ParsedLabResult } from "@/lib/labs/types";

describe("local health summary", () => {
  it("keeps medical language cautious", () => {
    const summary = createLocalSummary(demoResults);

    expect(summary.disclaimer).toContain("does not diagnose");
    expect(summary.flags.length).toBeGreaterThan(0);
    expect(summary.recommendations.askDoctor[0]).toContain("How");
  });

  it("keeps clinician questions distinct from the flagged-value list", () => {
    const summary = createLocalSummary(demoResults);

    expect(summary.recommendations.askDoctor).toContain(
      "Which flagged results should be repeated, and what timing makes sense?",
    );
    expect(summary.recommendations.askDoctor).not.toContain(
      "Whether the Total Cholesterol result needs repeat testing or follow-up.",
    );
  });

  it("gives flagged values marker-specific review explanations", () => {
    const summary = createLocalSummary(demoResults);
    const totalCholesterol = summary.flags.find((flag) => flag.testName === "Total Cholesterol")?.explanation;
    const a1c = summary.flags.find((flag) => flag.testName === "Hemoglobin A1c")?.explanation;
    const vitaminD = summary.flags.find((flag) => flag.testName === "Vitamin D")?.explanation;

    expect(totalCholesterol).toContain("LDL, HDL, triglycerides");
    expect(a1c).toContain("average blood sugar");
    expect(vitaminD).toContain("cutoffs can vary");
    expect(new Set(summary.flags.map((flag) => flag.explanation)).size).toBe(summary.flags.length);
    expect(summary.flags.map((flag) => flag.explanation).join(" ")).not.toContain("is marked high against the supplied reference range");
  });

  it("makes recommendations specific to the report markers", () => {
    const summary = createLocalSummary(demoResults);

    expect(summary.recommendations.food.join(" ")).toContain("Total cholesterol");
    expect(summary.recommendations.food.join(" ")).toContain("A1c");
    expect(summary.recommendations.food.join(" ")).toContain("cut back on sweet drinks");
    expect(summary.recommendations.food.join(" ")).toContain("refined carbs");
    expect(summary.recommendations.food.join(" ")).toContain("Vitamin D");
    expect(summary.recommendations.exercise.join(" ")).toContain("10-20 minute");
    expect(summary.recommendations.sleep.join(" ")).toContain("A1c");
    expect(summary.recommendations.sleep.join(" ")).not.toContain("Vitamin D");
    expect(summary.recommendations.lifestyle.join(" ")).toContain("supplement");
    expect(summary.recommendations.lifestyle.join(" ")).not.toContain("default grocery swap");
    expect(summary.recommendations.lifestyle.join(" ")).not.toContain("grocery swap");
    expect(summary.recommendations.lifestyle.join(" ")).toContain("weekday rule");
    expect(summary.recommendations.lifestyle.join(" ")).not.toContain("Pick one or two habits");
    expect(summary.recommendations.lifestyle.join(" ")).not.toContain("movement habit");
    expect(summary.recommendations.lifestyle.join(" ")).not.toContain("ApoB");
    expect(summary.recommendations.lifestyle.join(" ")).not.toContain("heart-risk");
  });

  it("formats stored numeric values in recommendations", () => {
    const storedLikeResults = demoResults.map((result) => ({
      ...result,
      value:
        result.value === undefined
          ? result.value
          : {
              toNumber: () => result.value,
              toString: () => String(result.value),
            },
    })) as unknown as ParsedLabResult[];
    const summary = createLocalSummary(storedLikeResults);
    const recommendations = Object.values(summary.recommendations).flat().join(" ");

    expect(recommendations).toContain("A1c is 5.7%");
    expect(recommendations).toContain("Total cholesterol is 214 mg/dL");
    expect(recommendations).not.toContain("undefined");
  });

  it("uses optional profile context for practical habit fit", () => {
    const summary = createLocalSummary(demoResults, {
      age: 42,
      gender: "woman",
      country: "United States",
      ethnicity: "Vietnamese",
      job: "remote desk job",
      hobbies: "walking and cooking",
      routine: "busy mornings",
    });
    const recommendations = Object.values(summary.recommendations).flat().join(" ");

    expect(recommendations).toContain("Vietnamese / United States");
    expect(recommendations).toContain("rice or noodles");
    expect(recommendations).toContain("At age 42");
    expect(recommendations).toContain("take a short walk or stretch after lunch or dinner");
    expect(recommendations).not.toContain("place movement after lunch or dinner");
    expect(recommendations).not.toContain("profile lists gender");
    expect(recommendations).not.toContain("hormones");
    expect(recommendations).toContain("remote desk job");
    expect(recommendations).toContain("walking and cooking");
    expect(recommendations).toContain("busy mornings");
    expect(recommendations).not.toContain("higher risk");
    expect(recommendations).not.toContain("because you are");
  });

  it("uses plain fasting guidance when triglycerides are present", () => {
    const summary = createLocalSummary([
      {
        testName: "Triglycerides",
        category: "Cholesterol",
        value: 104,
        unit: "mg/dL",
        referenceHigh: 149,
        referenceRangeRaw: "<150",
        flag: "NORMAL",
      },
    ]);
    const lifestyle = summary.recommendations.lifestyle.join(" ");

    expect(lifestyle).toContain("Follow fasting instructions for lab work");
    expect(lifestyle).not.toContain("pre-lab morning routine");
  });

  it("uses direct liver next-step language when liver markers are flagged", () => {
    const summary = createLocalSummary([
      {
        testName: "ALT",
        category: "Liver",
        value: 68,
        unit: "U/L",
        referenceHigh: 44,
        referenceRangeRaw: "0-44",
        flag: "HIGH",
      },
    ]);
    const lifestyle = summary.recommendations.lifestyle.join(" ");

    expect(lifestyle).toContain("Avoid extra alcohol, supplements, pain relievers, or hard workouts");
    expect(lifestyle).not.toContain("Keep alcohol, pain relievers, supplements");
  });
});
