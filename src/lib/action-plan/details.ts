import { buildShortNextStep } from "@/lib/action-plan/shorten";

export type NextStepDetails = {
  reason?: string;
  frequency: string;
  effort: string;
  tags: string[];
  priority: number;
  alternativeText: string;
  isReplacement: boolean;
};

function normalizedText(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags)).slice(0, 4);
}

function markerTags(text: string) {
  const tags: string[] = [];
  if (/a1c|glucose|blood sugar|carb|sweet drink|refined carb/.test(text)) tags.push("A1c");
  if (/triglyceride/.test(text)) tags.push("Triglycerides");
  if (/cholesterol|hdl|ldl|soluble[- ]fiber|saturated[- ]fat|butter|cream|processed meat/.test(text)) tags.push("Cholesterol");
  if (/vitamin d|sun|supplement/.test(text)) tags.push("Vitamin D");
  if (/kidney|creatinine|egfr|bun/.test(text)) tags.push("Kidney");
  if (/\bliver\b|\balt\b|\bast\b|\bbilirubin\b|\balcohol\b|\bacetaminophen\b/.test(text)) tags.push("Liver");
  if (/profile|routine note|age |gender|desk job|hobbies|food routine/.test(text)) tags.push("Profile");
  return tags;
}

function priorityFor(text: string, category: string) {
  let priority = 10;
  if (/a1c|glucose|blood sugar/.test(text)) priority += 60;
  if (/triglyceride/.test(text)) priority += 55;
  if (/cholesterol|hdl|ldl|soluble[- ]fiber|saturated[- ]fat|butter|cream|processed meat/.test(text)) priority += 45;
  if (/vitamin d/.test(text)) priority += 30;
  if (/kidney|\bliver\b/.test(text)) priority += 25;
  if (/sweet drink|refined carb|carb-heavy|after.*meal/.test(text)) priority += 12;
  if (/default|routine|profile|age |gender/.test(text)) priority += 8;

  if (category === "Food") priority += 4;
  if (category === "Movement") priority += 3;
  if (category === "Routine") priority += 2;
  if (category === "Sleep") priority += 1;

  return priority;
}

function reasonFor(text: string) {
  if (/a1c|glucose|blood sugar/.test(text)) {
    return "Helps with A1c or glucose by making meals, movement, and sleep easier to repeat.";
  }
  if (/triglyceride/.test(text)) {
    return "Helps with triglycerides by focusing on sweet drinks, refined carbs, alcohol, and fasting consistency.";
  }
  if (/hdl/.test(text)) {
    return "Helps with low HDL by making walking and simple strength work easier to repeat.";
  }
  if (/cholesterol|hdl|ldl|soluble[- ]fiber|saturated[- ]fat|butter|cream|processed meat/.test(text)) {
    return "Helps with cholesterol by adding fiber, swapping saturated fat, or keeping movement repeatable.";
  }
  if (/vitamin d/.test(text)) {
    return "Helps with low vitamin D by adding simple food sources and keeping supplement questions easy to review.";
  }
  if (/kidney/.test(text)) {
    return "Helps explain kidney markers by keeping hydration, workouts, protein, and pain reliever notes clear.";
  }
  if (/\bliver\b|\balt\b|\bast\b|\bbilirubin\b|\balcohol\b|\bacetaminophen\b/.test(text)) {
    return "Helps with liver markers by reducing extra alcohol, supplements, pain relievers, and hard workouts.";
  }
  if (/profile|routine note|age |gender|desk job|food routine|hobbies/.test(text)) {
    return undefined;
  }
  return undefined;
}

function frequencyFor(text: string, category: string) {
  if (/10-20 minute.*after|after.*carb-heavy meal|after.*meal/.test(text)) return "After your biggest carb meal";
  if (/20-30 minute|brisk/.test(text)) return "5 days this week";
  if (/strength/.test(text)) return "2 times this week";
  if (/soluble-fiber|fiber food|beans|oats|chia/.test(text)) return "Most days this week";
  if (/saturated-fat|butter|cream|processed meat/.test(text)) return "1 swap this week";
  if (/sweet drink|dessert|refined carb|white bread|white rice/.test(text)) return "Start with 1 regular choice";
  if (/vitamin-d food|vitamin d food/.test(text)) return "3 meals this week";
  if (/sleep and wake|sleep timing|7 hours/.test(text)) return "Nightly for 7 days";
  if (/short sleep|illness|stress|before labs|before your next lab/.test(text)) return "Before your next lab";
  if (/gender|hormones|menopause|pregnancy|testosterone|visit/.test(text)) return "Before your next visit";
  if (/grocery|shopping/.test(text)) return "Next grocery trip";
  if (/water|snack|night before|wind-down|routine/.test(text)) return "This week";
  if (category === "Food") return "This week";
  if (category === "Movement") return "2-5 times this week";
  if (category === "Sleep") return "Nightly";
  return "This week";
}

function effortFor(text: string, category: string) {
  if (/20-30 minute/.test(text)) return "20-30 min";
  if (/10-20 minute/.test(text)) return "10-20 min";
  if (/5-10 minute/.test(text)) return "5-10 min";
  if (/strength/.test(text)) return "15 min";
  if (/short sleep|illness|stress|hormones|visit|notes-app|note/.test(text)) return "2 min";
  if (/grocery|shopping|buy less|on hand/.test(text)) return "shopping";
  if (/sleep|wake|nightly/.test(text)) return "daily";
  if (category === "Food") return "meal swap";
  if (category === "Movement") return "easy";
  return "easy";
}

function replacementFor(text: string, category: string) {
  if (/sweet drink|dessert|refined carb|white bread|white rice/.test(text)) return "Switch one regular sweet drink to unsweetened.";
  if (/carb-heavy meal|starch|rice|noodles|bread|pasta|potatoes|tortillas/.test(text)) return "Keep the meal, but make the starch smaller once.";
  if (/soluble-fiber|fiber food|beans|oats|chia/.test(text)) return "Add beans, oats, or chia to one meal.";
  if (/saturated-fat|butter|cream|processed meat/.test(text)) return "Swap butter, cream, or processed meat once.";
  if (/10-20 minute.*walk|after.*meal/.test(text)) return "Stand or stretch 5 minutes after that meal.";
  if (/20-30 minute|brisk/.test(text)) return "Take two 10-minute walks today.";
  if (/strength/.test(text)) return "Do one short bodyweight set.";
  if (/vitamin-d food|vitamin d food|salmon|sardines|trout|eggs|fortified/.test(text)) return "Add salmon, eggs, or fortified milk.";
  if (/sleep and wake|sleep timing|7 hours/.test(text)) return "Set the same wake time for 3 days.";
  if (/short sleep|illness|stress|before labs/.test(text)) return "Write one pre-lab note.";
  if (/night before|busy morning/.test(text)) return "Set water or walking shoes out tonight.";
  if (/water|snack|travel|route/.test(text)) return "Pack water and one protein/fiber snack.";
  if (category === "Movement") return "Do 5 minutes of easy movement instead.";
  if (category === "Food") return "Make one smaller food swap this week.";
  if (category === "Sleep") return "Pick one steady bedtime cue.";
  return "Choose one smaller version you can do this week.";
}

export function buildNextStepDetails(category: string, displayText: string, sourceText = displayText): NextStepDetails {
  const originalShortText = buildShortNextStep(sourceText);
  const isReplacement = displayText.trim().toLowerCase() !== originalShortText.trim().toLowerCase();
  const text = normalizedText(displayText, sourceText);

  return {
    reason: reasonFor(text),
    frequency: frequencyFor(text, category),
    effort: effortFor(text, category),
    tags: uniqueTags(markerTags(text)),
    priority: priorityFor(text, category),
    alternativeText: isReplacement ? originalShortText : replacementFor(text, category),
    isReplacement,
  };
}
