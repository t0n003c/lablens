import type { HealthSummary, ParsedLabResult } from "@/lib/labs/types";
import { createLocalSummary } from "@/lib/ai/summarizer";

export const demoResults: ParsedLabResult[] = [
  {
    testName: "Total Cholesterol",
    category: "Cholesterol",
    value: 214,
    unit: "mg/dL",
    referenceHigh: 199,
    referenceRangeRaw: "<200",
    flag: "HIGH",
  },
  {
    testName: "HDL Cholesterol",
    category: "Cholesterol",
    value: 58,
    unit: "mg/dL",
    referenceLow: 39,
    referenceRangeRaw: ">39",
    flag: "NORMAL",
  },
  {
    testName: "Hemoglobin A1c",
    category: "Glucose",
    value: 5.7,
    unit: "%",
    referenceLow: 4.8,
    referenceHigh: 5.6,
    referenceRangeRaw: "4.8-5.6",
    flag: "HIGH",
  },
  {
    testName: "Creatinine",
    category: "Kidney",
    value: 0.91,
    unit: "mg/dL",
    referenceLow: 0.76,
    referenceHigh: 1.27,
    referenceRangeRaw: "0.76-1.27",
    flag: "NORMAL",
  },
  {
    testName: "Vitamin D",
    category: "Vitamins and Minerals",
    value: 27,
    unit: "ng/mL",
    referenceLow: 30,
    referenceHigh: 100,
    referenceRangeRaw: "30-100",
    flag: "LOW",
  },
];

export const demoSummary: HealthSummary = createLocalSummary(demoResults);

export const trendData = [
  { date: "Jan", totalCholesterol: 226, totalCholesterolFlag: "HIGH" as const, hdlCholesterol: 45, hdlCholesterolFlag: "NORMAL" as const, triglycerides: 142, triglyceridesFlag: "NORMAL" as const, a1c: 5.9, a1cFlag: "HIGH" as const, vitaminD: 22, vitaminDFlag: "LOW" as const },
  { date: "Mar", totalCholesterol: 220, totalCholesterolFlag: "HIGH" as const, hdlCholesterol: 49, hdlCholesterolFlag: "NORMAL" as const, triglycerides: 126, triglyceridesFlag: "NORMAL" as const, a1c: 5.8, a1cFlag: "HIGH" as const, vitaminD: 24, vitaminDFlag: "LOW" as const },
  { date: "Jun", totalCholesterol: 214, totalCholesterolFlag: "HIGH" as const, hdlCholesterol: 58, hdlCholesterolFlag: "NORMAL" as const, triglycerides: 104, triglyceridesFlag: "NORMAL" as const, a1c: 5.7, a1cFlag: "HIGH" as const, vitaminD: 27, vitaminDFlag: "LOW" as const },
];
