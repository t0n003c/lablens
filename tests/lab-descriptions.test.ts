import { describe, expect, it } from "vitest";
import { getLabTestDescription } from "@/lib/labs/descriptions";

describe("lab test descriptions", () => {
  it("describes absolute neutrophil count in practical language", () => {
    const description = getLabTestDescription({ testName: "Absolute Neutrophil Count", category: "Blood Count" });

    expect(description).toContain("infection risk");
    expect(description).toContain("Low ANC");
    expect(description).toContain("high");
  });

  it("handles common aliases", () => {
    expect(getLabTestDescription({ testName: "ANC", category: "Blood Count" })).toContain("infection risk");
    expect(getLabTestDescription({ testName: "Hemoglobin A1c", category: "Glucose" })).toContain("2 to 3 months");
    expect(getLabTestDescription({ testName: "HDL CHOLESTEROL", category: "Cholesterol" })).toContain("good");
  });

  it("explains low and high MCH in everyday terms", () => {
    const description = getLabTestDescription({ testName: "MCH", category: "Blood Count" });

    expect(description).toContain("Low MCH");
    expect(description).toContain("iron deficiency");
    expect(description).toContain("high MCH");
    expect(description).toContain("certain medications");
  });

  it("uses the BUN/creatinine ratio description before the generic creatinine description", () => {
    const description = getLabTestDescription({ testName: "BUN/Creatinine Ratio", category: "Kidney" });

    expect(description).toContain("Compares BUN with creatinine");
    expect(description).toContain("high ratio");
  });

  it("falls back to category descriptions when the exact marker is unknown", () => {
    expect(getLabTestDescription({ testName: "Custom Kidney Marker", category: "Kidney" })).toContain("kidney-function review");
  });
});
