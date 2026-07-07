export type HealthScoreBand = "good" | "review" | "careful";

export function getHealthScoreBand(score: number): HealthScoreBand {
  if (score >= 80) return "good";
  if (score >= 70) return "review";
  return "careful";
}

export function getHealthScoreTone(score: number) {
  const band = getHealthScoreBand(score);

  if (band === "good") return "var(--score-good)";
  if (band === "review") return "var(--score-review)";
  return "var(--score-careful)";
}

export function getHealthScoreStatusLabel(score: number) {
  const band = getHealthScoreBand(score);

  if (band === "good") return "Steady snapshot";
  if (band === "review") return "Review a few items";
  return "Careful review";
}
