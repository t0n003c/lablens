import type { LabFlag } from "@/lib/labs/types";

export function flagLabValue(value?: number, low?: number, high?: number): LabFlag {
  if (typeof value !== "number" || Number.isNaN(value)) return "UNKNOWN";

  if (typeof low === "number" && value < low) {
    if (low !== 0 && value < low * 0.85) return "CONCERNING";
    return "LOW";
  }

  if (typeof high === "number" && value > high) {
    if (high !== 0 && value > high * 1.25) return "CONCERNING";
    return "HIGH";
  }

  if (typeof low === "number" && typeof high === "number") {
    const span = high - low;
    if (span > 0 && (value <= low + span * 0.08 || value >= high - span * 0.08)) {
      return "BORDERLINE";
    }
    return "NORMAL";
  }

  if (typeof low === "number") {
    if (low !== 0 && value <= low + Math.abs(low) * 0.08) return "BORDERLINE";
    return "NORMAL";
  }

  if (typeof high === "number") {
    if (high !== 0 && value >= high - Math.abs(high) * 0.08) return "BORDERLINE";
    return "NORMAL";
  }

  return "UNKNOWN";
}
