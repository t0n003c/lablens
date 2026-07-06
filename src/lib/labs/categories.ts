const categoryRules: Array<[RegExp, string]> = [
  [/(cholesterol|ldl|hdl|triglycerides?|non-hdl|vldl|lipid)/i, "Cholesterol"],
  [/(glucose|a1c|hemoglobin a1c|insulin)/i, "Glucose"],
  [/(creatinine|egfr|bun|urea|kidney)/i, "Kidney"],
  [/(alt|ast|alkaline|bilirubin|albumin|protein|liver)/i, "Liver"],
  [/(wbc|rbc|hemoglobin|hematocrit|platelet|mcv|mch|rdw|neutrophils?|lymphocytes?|monocytes?|eosinophils?|basophils?)/i, "Blood Count"],
  [/(vitamin|b12|folate|ferritin|iron|magnesium)/i, "Vitamins and Minerals"],
  [/(tsh|t3|t4|thyroid)/i, "Thyroid"],
  [/(crp|sed rate|esr|inflammation)/i, "Inflammation"],
  [/(sodium|potassium|chloride|calcium|carbon dioxide|electrolyte)/i, "Electrolytes"],
];

export function categorizeTest(testName: string) {
  return categoryRules.find(([pattern]) => pattern.test(testName))?.[1] ?? "Other";
}
