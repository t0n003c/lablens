import { describe, expect, it } from "vitest";
import { getHealthScoreBand, getHealthScoreStatusLabel, getHealthScoreTone } from "@/lib/health-score";

describe("health score display thresholds", () => {
  it("uses green for scores from 80 to 100", () => {
    expect(getHealthScoreBand(80)).toBe("good");
    expect(getHealthScoreBand(100)).toBe("good");
    expect(getHealthScoreTone(80)).toBe("var(--score-good)");
    expect(getHealthScoreStatusLabel(80)).toBe("Steady snapshot");
  });

  it("uses yellow for scores from 70 to 79", () => {
    expect(getHealthScoreBand(70)).toBe("review");
    expect(getHealthScoreBand(79)).toBe("review");
    expect(getHealthScoreTone(79)).toBe("var(--score-review)");
    expect(getHealthScoreStatusLabel(79)).toBe("Review a few items");
  });

  it("uses red for scores below 70", () => {
    expect(getHealthScoreBand(69)).toBe("careful");
    expect(getHealthScoreBand(0)).toBe("careful");
    expect(getHealthScoreTone(69)).toBe("var(--score-careful)");
    expect(getHealthScoreStatusLabel(69)).toBe("Careful review");
  });
});
