export type LabFlag = "NORMAL" | "LOW" | "HIGH" | "BORDERLINE" | "CONCERNING" | "UNKNOWN";

export type ParsedLabResult = {
  testName: string;
  category: string;
  value?: number;
  stringValue?: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  referenceRangeRaw?: string;
  flag: LabFlag;
  notes?: string;
};

export type ParsedReport = {
  labName?: string;
  reportDate?: string;
  results: ParsedLabResult[];
  warnings: string[];
  extractedTextHash?: string;
};

export type HealthSummary = {
  overall: string[];
  flags: Array<{
    testName: string;
    flag: LabFlag;
    explanation: string;
  }>;
  categories: Array<{
    name: string;
    bullets: string[];
  }>;
  recommendations: {
    food: string[];
    exercise: string[];
    lifestyle: string[];
    sleep: string[];
    askDoctor: string[];
  };
  disclaimer: string;
};

export type RecommendationContext = {
  age?: number | null;
  gender?: string | null;
  country?: string | null;
  ethnicity?: string | null;
  job?: string | null;
  hobbies?: string | null;
  routine?: string | null;
};
