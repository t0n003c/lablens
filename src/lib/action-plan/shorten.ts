const MAX_NEXT_STEP_LENGTH = 86;

const actionRules: Array<[RegExp, string]> = [
  [/meals that feel familiar.*rice or noodles/i, "Make rice or noodles the smaller part."],
  [/food routine.*rice or noodles/i, "Make rice or noodles the smaller part."],
  [/food routine.*usual starches/i, "Make your usual starch the smaller part."],
  [/food routine.*starches/i, "Make your regular starch smaller."],
  [/food routine/i, "Keep familiar meals; make the starch smaller."],
  [/meals that feel familiar/i, "Keep familiar meals; make the starch smaller."],
  [/total cholesterol.*soluble-fiber food/i, "Add one soluble-fiber food today."],
  [/swap one regular saturated-fat choice/i, "Swap one saturated-fat food."],
  [/a1c.*carb-heavy meal/i, "Balance your carb-heavy meal."],
  [/cut back on sweet drinks/i, "Cut back one sweet drink or refined carb."],
  [/vitamin d.*foods/i, "Add salmon, eggs, or fortified milk."],
  [
    /liver markers are flagged|liver.*(alcohol|pain relievers|supplements|hard workouts)|alcohol.*(supplements.*pain relievers|pain relievers.*supplements).*hard workouts/i,
    "Avoid extra alcohol, supplements, pain relievers, or hard workouts.",
  ],
  [/cholesterol.*brisk.*walk/i, "Take a brisk 20-30 minute walk."],
  [/a1c.*10-20 minute.*walk/i, "Walk 10-20 minutes after a carb-heavy meal."],
  [/strength sessions/i, "Do 2 simple strength sessions this week."],
  [/remote desk job|desk-heavy/i, "Take a 5-10 minute walk or stretch after lunch."],
  [/5-10 minute walk or stretch/i, "Take a 5-10 minute walk or stretch."],
  [/walking and cooking together/i, "Cook one high-fiber food, then take a short walk."],
  [/night before: set water/i, "Set up one healthy step the night before."],
  [/pre-work meal.*wind-down cue/i, "Set one pre-work meal and wind-down cue."],
  [/travel basics/i, "Pack water and one protein/fiber snack."],
  [/routine note says/i, "Choose one habit that fits busy days."],
  [/At age .*build a baseline/i, "Pick one meal cue and one movement cue."],
  [/At age .*(protect consistency|make movement easier)/i, "Take a short walk or stretch after lunch or dinner."],
  [/At age .*joint-friendly movement/i, "Do joint-friendly movement this week."],
  [/default grocery swap/i, "Add oats, beans, or olive oil to your list."],
  [/fasting instructions/i, "Follow fasting instructions for lab work."],
  [/weekday rule.*sweet drinks|sweet drinks.*planned times/i, "Set a weekday rule for sweet drinks."],
  [/sleep and wake times/i, "Keep sleep and wake times steady."],
  [/short sleep.*illness.*stress/i, "Note short sleep, illness, or stress before labs."],
];

export function buildShortNextStep(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const matched = actionRules.find(([pattern]) => pattern.test(cleaned))?.[1];
  if (matched) return matched;

  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.replace(/^[A-Za-z0-9 ()/%.-]+ is [^.!?]+[.!?]\s*/, "").trim();
  const fallback = firstSentence || cleaned;

  if (fallback.length <= MAX_NEXT_STEP_LENGTH) return fallback;
  return `${fallback.slice(0, MAX_NEXT_STEP_LENGTH - 1).replace(/\s+\S*$/, "")}.`;
}
