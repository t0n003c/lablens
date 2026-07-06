import { createHash } from "node:crypto";
import { categorizeTest } from "@/lib/labs/categories";
import { flagLabValue } from "@/lib/labs/flagging";
import type { ParsedLabResult, ParsedReport } from "@/lib/labs/types";

const VALUE_PATTERN = String.raw`[<>]?\d+(?:\.\d+)?|see note:?|positive|negative|detected|not detected|non-reactive|reactive`;
const RANGE_PATTERN = String.raw`[<>]=?\s*(?:OR\s*=\s*)?\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:-|to)\s*[<>]?\d+(?:\.\d+)?|negative|positive|non-reactive|not detected`;
const TEST_NAME_PATTERN = String.raw`[A-Za-z][A-Za-z0-9 /%().,'+-]{2,100}?`;

const RESULT_LINE = new RegExp(
  String.raw`^(${TEST_NAME_PATTERN})\s+(${VALUE_PATTERN})\s*([A-Za-z/%0-9^().-]+)?\s+(?:Reference Range:?\s*)?(${RANGE_PATTERN})?$`,
  "i",
);
const QUEST_REFERENCE_LINE = new RegExp(String.raw`^(${TEST_NAME_PATTERN})\s+(${VALUE_PATTERN})\s+Reference Range:?\s+(.+)$`, "i");
const REFERENCE_WITH_UNIT = new RegExp(String.raw`^(${RANGE_PATTERN})\s*(.*)$`, "i");

function parseNumber(input?: string) {
  if (!input) return undefined;
  const match = input.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function parseRange(referenceRangeRaw?: string) {
  if (!referenceRangeRaw) return {};
  const normalized = referenceRangeRaw
    .replace(/[–—]/g, "-")
    .replace(/\bOR\s*=/gi, "=")
    .replace(/\s+/g, " ")
    .trim();

  const boundedRange = normalized.match(/^(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*([<>]?\s*-?\d+(?:\.\d+)?)/i);
  if (boundedRange) {
    return {
      referenceLow: Number(boundedRange[1]),
      referenceHigh: parseNumber(boundedRange[2]),
    };
  }

  const values = normalized.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];

  if (values.length >= 2 && !/^[<>]/.test(normalized)) {
    return { referenceLow: values[0], referenceHigh: values[1] };
  }

  if (/^</.test(normalized) && values[0] !== undefined) {
    return { referenceHigh: values[0] };
  }

  if (/^>/.test(normalized) && values[0] !== undefined) {
    return { referenceLow: values[0] };
  }

  return {};
}

function cleanTestName(testName: string) {
  return testName.replace(/[:.]+$/, "").trim();
}

function cleanReferenceRange(referenceRangeRaw?: string) {
  return referenceRangeRaw?.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function parseReferenceWithUnit(referenceText?: string) {
  const cleaned = cleanReferenceRange(referenceText);
  if (!cleaned) return {};

  const match = cleaned.match(REFERENCE_WITH_UNIT);
  if (!match) return { referenceRangeRaw: cleaned };

  const [, referenceRangeRaw, unit] = match;
  return {
    referenceRangeRaw: cleanReferenceRange(referenceRangeRaw),
    unit: unit?.trim() || undefined,
  };
}

function buildParsedResult(input: {
  testNameRaw: string;
  rawValue: string;
  unit?: string;
  referenceRangeRaw?: string;
}): ParsedLabResult {
  const testName = cleanTestName(input.testNameRaw);
  const value = parseNumber(input.rawValue);
  const referenceRangeRaw = cleanReferenceRange(input.referenceRangeRaw);
  const range = parseRange(referenceRangeRaw);
  const rawStringValue = input.rawValue.replace(/:$/, "").trim();

  return {
    testName,
    category: categorizeTest(testName),
    value,
    stringValue: value === undefined ? rawStringValue : undefined,
    unit: input.unit?.trim() || undefined,
    referenceRangeRaw,
    ...range,
    flag: flagLabValue(value, range.referenceLow, range.referenceHigh),
  };
}

function parseResultLine(line: string) {
  const questMatch = line.match(QUEST_REFERENCE_LINE);
  if (questMatch) {
    const [, testNameRaw, rawValue, referenceText] = questMatch;
    return buildParsedResult({
      testNameRaw,
      rawValue,
      ...parseReferenceWithUnit(referenceText),
    });
  }

  const genericMatch = line.match(RESULT_LINE);
  if (genericMatch) {
    const [, testNameRaw, rawValue, unit, referenceRangeRaw] = genericMatch;
    return buildParsedResult({ testNameRaw, rawValue, unit, referenceRangeRaw });
  }

  return undefined;
}

function cleanText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseLabText(text: string): ParsedReport {
  const cleaned = cleanText(text);
  const hash = createHash("sha256").update(cleaned).digest("hex");
  const warnings: string[] = [];
  const results: ParsedLabResult[] = [];

  const dateMatch =
    cleaned.match(/(?:Collected|Reported|Result Date|Date of Service)[: ]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i) ??
    cleaned.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  const labName = /quest/i.test(cleaned) ? "Quest Diagnostics" : undefined;

  for (const rawLine of cleaned.split("\n")) {
    const line = rawLine.trim();
    if (line.length < 8 || /patient|account|page \d|doctor|specimen/i.test(line)) continue;

    const result = parseResultLine(line);
    if (result) results.push(result);
  }

  if (results.length === 0) {
    warnings.push("No structured lab rows were detected. Manual review is required.");
  }

  return {
    labName,
    reportDate: dateMatch?.[1],
    results,
    warnings,
    extractedTextHash: hash,
  };
}

export function parseManualResult(input: {
  testName: string;
  value?: number;
  stringValue?: string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  referenceRangeRaw?: string;
  notes?: string;
}): ParsedLabResult {
  return {
    ...input,
    category: categorizeTest(input.testName),
    flag: flagLabValue(input.value, input.referenceLow, input.referenceHigh),
  };
}
