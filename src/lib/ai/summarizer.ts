import { HEALTH_DISCLAIMER } from "@/lib/constants";
import { getEnv } from "@/lib/env";
import { buildHealthSummaryPrompt } from "@/lib/ai/prompts";
import { cleanProfileAge, cleanProfileText, hasRecommendationContext } from "@/lib/settings/profile";
import type { HealthSummary, ParsedLabResult, RecommendationContext } from "@/lib/labs/types";

function humanizeFlag(flag: string) {
  return flag.toLowerCase().replace("_", " ");
}

function hasCategory(results: ParsedLabResult[], pattern: RegExp) {
  return results.some((result) => pattern.test(result.category) || pattern.test(result.testName));
}

function hasFlag(results: ParsedLabResult[], pattern: RegExp) {
  return results.some((result) => pattern.test(result.category) && !["NORMAL", "UNKNOWN"].includes(result.flag));
}

function normalizedTestName(result: ParsedLabResult) {
  return result.testName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function coerceNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === "object") {
    const decimalLike = value as { toNumber?: () => number; toString?: () => string };
    if (typeof decimalLike.toNumber === "function") {
      const parsed = decimalLike.toNumber();
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (typeof decimalLike.toString === "function") {
      const parsed = Number(decimalLike.toString());
      return Number.isFinite(parsed) ? parsed : undefined;
    }
  }
  return undefined;
}

function resultValue(result?: ParsedLabResult) {
  if (!result) return undefined;
  const value = coerceNumber(result.value);
  if (value === undefined) return result.stringValue;
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  if (result.unit === "%") return `${formatted}%`;
  return `${formatted}${result.unit ? ` ${result.unit}` : ""}`;
}

function valueSentence(subject: string, result?: ParsedLabResult, verb = "is") {
  const value = resultValue(result);
  return value ? `${subject} ${verb} ${value}` : `${subject} ${verb} flagged`;
}

function normalValueSentence(subject: string, result?: ParsedLabResult, verb = "is") {
  const value = resultValue(result);
  return value ? `${subject} ${verb} ${value} and ${verb} not flagged here` : `${subject} ${verb} not flagged here`;
}

function isFlagged(result?: ParsedLabResult) {
  return Boolean(result && !["NORMAL", "UNKNOWN"].includes(result.flag));
}

function findTotalCholesterol(results: ParsedLabResult[]) {
  return results.find((result) => {
    const name = normalizedTestName(result);
    return (
      (name.includes("total cholesterol") || name.includes("cholesterol total") || name === "cholesterol") &&
      !/(hdl|ldl|non hdl|ratio)/.test(name)
    );
  });
}

function findHdl(results: ParsedLabResult[]) {
  return results.find((result) => {
    const name = normalizedTestName(result);
    return name.includes("hdl") && name.includes("cholesterol") && !name.includes("ratio");
  });
}

function findTriglycerides(results: ParsedLabResult[]) {
  return results.find((result) => normalizedTestName(result).includes("triglycerides"));
}

function findA1c(results: ParsedLabResult[]) {
  return results.find((result) => /a1c|hemoglobin a1c/.test(normalizedTestName(result)));
}

function findVitaminD(results: ParsedLabResult[]) {
  return results.find((result) => normalizedTestName(result).includes("vitamin d"));
}

function contextLabel(context?: RecommendationContext) {
  const parts = [cleanProfileText(context?.ethnicity), cleanProfileText(context?.country)].filter(Boolean);
  return parts.join(" / ");
}

function ageGenderLabel(context?: RecommendationContext) {
  const age = cleanProfileAge(context?.age);
  const gender = cleanProfileText(context?.gender);
  const parts = [age === undefined ? undefined : `age ${age}`, gender ? `gender: ${gender}` : undefined].filter(Boolean);
  return parts.join(", ");
}

function stapleExamplesForContext(context?: RecommendationContext) {
  const text = `${cleanProfileText(context?.ethnicity) ?? ""} ${cleanProfileText(context?.country) ?? ""}`.toLowerCase();
  if (/(vietnam|chinese|korean|japanese|thai|filipino|asian)/.test(text)) return "rice or noodles";
  if (/(indian|pakistan|bangladesh|nepal|sri lanka|south asian)/.test(text)) return "rice, roti, naan, or other usual starches";
  if (/(mexican|latino|latina|latin|central american|south american)/.test(text)) return "rice, tortillas, bread, or plantains";
  if (/(middle eastern|arab|persian|turkish|mediterranean)/.test(text)) return "rice, pita, bread, or potatoes";
  if (/(african|caribbean)/.test(text)) return "rice, plantains, yams, cassava, or bread";
  if (/(united states|american|canada|western)/.test(text)) return "bread, pasta, rice, potatoes, or snack foods";
  return "your usual rice, noodles, bread, potatoes, tortillas, or other starches";
}

function buildCultureFoodHabit(context?: RecommendationContext) {
  const label = contextLabel(context);
  if (!label) return undefined;
  return `For your ${label} food routine, keep the familiar flavors. If ${stapleExamplesForContext(context)} are regular meals, make that starch the smaller part, add vegetables or herbs plus protein, and choose water or unsweetened tea most often.`;
}

function buildWorkRoutineHabit(context?: RecommendationContext) {
  const job = cleanProfileText(context?.job);
  if (!job) return undefined;

  const lower = job.toLowerCase();
  if (/(desk|office|computer|software|remote|admin|student)/.test(lower)) {
    return `For your ${job}, attach a 5-10 minute walk or stretch to a real cue, like after lunch, after a meeting, or when you close the laptop.`;
  }
  if (/(driver|drive|truck|travel|sales|flight|pilot|delivery)/.test(lower)) {
    return `For your ${job}, pack water or an unsweetened drink plus a protein/fiber snack before the route or travel block starts.`;
  }
  if (/(shift|night|nurse|doctor|hospital|restaurant|bar|factory)/.test(lower)) {
    return `For your ${job}, anchor one steady meal before the shift and one wind-down cue after work so the day has bookends.`;
  }
  if (/(construction|warehouse|labor|server|retail|teacher|trainer|active|standing)/.test(lower)) {
    return `For your ${job}, set up water and a simple protein/fiber snack before the day gets busy.`;
  }

  return `Use your ${job} schedule as the cue: attach one habit to the start or end of the workday.`;
}

function buildHobbyRoutineHabit(context?: RecommendationContext) {
  const hobbies = cleanProfileText(context?.hobbies);
  if (!hobbies) return undefined;

  const lower = hobbies.toLowerCase();
  if (/(walk|hike|dance|bike|cycle|swim|sport|tennis|pickleball|yoga|gym|lift|run)/.test(lower) && /(cook|bake|garden|meal|food)/.test(lower)) {
    return `Use ${hobbies} together: prep one high-fiber food when you cook, and use a short walk after your most carb-heavy meal.`;
  }
  if (/(walk|hike|dance|bike|cycle|swim|sport|tennis|pickleball|yoga|gym|lift|run)/.test(lower)) {
    return `Use ${hobbies} as the movement anchor: schedule 2-3 short sessions you would actually look forward to, not a workout you dread.`;
  }
  if (/(cook|bake|garden|meal|food)/.test(lower)) {
    return `Use ${hobbies} as the food anchor: prep one high-fiber staple or vegetable you can reuse for easy meals.`;
  }
  if (/(game|gaming|read|reading|craft|music|movie|tv)/.test(lower)) {
    return `Pair ${hobbies} with a small cue: water first, a short walk after, or a stretch break between sessions.`;
  }

  return `Tie one habit to ${hobbies}: water before it, a short walk after it, or a simple meal prep step around it.`;
}

function buildRoutineConstraintHabit(context?: RecommendationContext) {
  const routine = cleanProfileText(context?.routine);
  if (!routine) return undefined;
  const lower = routine.toLowerCase();
  if (/busy.*morning|morning.*busy|rush|rushed/.test(lower)) {
    return `Your routine note says "${routine}." Move one healthy step to the night before: set water, walking shoes, or an easy protein/fiber breakfast option.`;
  }
  if (/night|shift|late/.test(lower)) {
    return `Your routine note says "${routine}." Keep one steady pre-work meal and one wind-down cue after work so the day has bookends.`;
  }
  if (/travel|trip|road|hotel|airport/.test(lower)) {
    return `Your routine note says "${routine}." Pack the default travel basics first: water, an unsweetened drink, and one protein/fiber snack.`;
  }
  return `Your routine note says "${routine}." Choose the one habit that can survive those days, even if it is smaller than the ideal plan.`;
}

function buildAgeRoutineHabit(context?: RecommendationContext) {
  const age = cleanProfileAge(context?.age);
  if (age === undefined) return undefined;

  if (age < 30) {
    return `At age ${age}, build a baseline you can keep: one meal cue and one movement cue that still work during busy weeks.`;
  }
  if (age < 50) {
    return `At age ${age}, make movement easier to remember: take a short walk or stretch after lunch or dinner instead of waiting for free time.`;
  }
  return `At age ${age}, favor repeatable, joint-friendly movement: walks plus light strength or balance work if safe for you.`;
}

function buildRecommendations(results: ParsedLabResult[], context?: RecommendationContext) {
  const food = new Set<string>();
  const exercise = new Set<string>();
  const lifestyle = new Set<string>();
  const sleep = new Set<string>();
  const totalCholesterol = findTotalCholesterol(results);
  const hdl = findHdl(results);
  const triglycerides = findTriglycerides(results);
  const a1c = findA1c(results);
  const vitaminD = findVitaminD(results);
  const shouldPersonalize = hasRecommendationContext(context);

  if (shouldPersonalize) {
    const cultureFoodHabit = buildCultureFoodHabit(context);
    const workRoutineHabit = buildWorkRoutineHabit(context);
    const hobbyRoutineHabit = buildHobbyRoutineHabit(context);
    const routineHabit = buildRoutineConstraintHabit(context);
    const ageRoutineHabit = buildAgeRoutineHabit(context);

    if (cultureFoodHabit && (isFlagged(totalCholesterol) || isFlagged(triglycerides) || isFlagged(a1c))) {
      food.add(cultureFoodHabit);
    }
    if (workRoutineHabit) lifestyle.add(workRoutineHabit);
    if (hobbyRoutineHabit) lifestyle.add(hobbyRoutineHabit);
    if (routineHabit) lifestyle.add(routineHabit);
    if (ageRoutineHabit) lifestyle.add(ageRoutineHabit);
  }

  if (isFlagged(totalCholesterol)) {
    food.add(`${valueSentence("Total cholesterol", totalCholesterol)}. Add one soluble-fiber food most days: oats, beans, lentils, apples, barley, or chia.`);
    food.add("Swap one regular saturated-fat choice, such as butter, cream, or fatty processed meat, for olive oil, nuts, avocado, or fish.");
    exercise.add("For cholesterol, aim for a repeatable cardio habit first: a brisk 20-30 minute walk on 5 days if that is safe for you.");
    lifestyle.add("Make one default grocery swap this week: keep oats, beans, nuts, olive oil, or fish on hand and buy less butter, cream, or processed meat.");
  } else if (totalCholesterol) {
    food.add(`${normalValueSentence("Total cholesterol", totalCholesterol)}. Keep the pattern that is working: fiber-rich plants plus mostly unsaturated fats.`);
  }

  if (isFlagged(hdl)) {
    exercise.add(`${valueSentence("HDL", hdl)}. If exercise is safe for you, regular walking plus 2 simple strength sessions per week is a reasonable habit to discuss.`);
  }

  if (isFlagged(triglycerides)) {
    food.add(`${valueSentence("Triglycerides", triglycerides, "are")}. Cut back on alcohol, sugary drinks, desserts, and refined carbs first; note what changes so patterns are easier to see.`);
    lifestyle.add("If alcohol or sweet drinks are part of your routine, choose a few default alcohol-free or unsweetened-drink days each week.");
  } else if (triglycerides) {
    lifestyle.add("Follow fasting instructions for lab work, especially when triglycerides are being checked.");
  }

  if (isFlagged(a1c)) {
    food.add(`${valueSentence("A1c", a1c)}. Rebuild your most carb-heavy meal: protein and vegetables first, then a smaller high-fiber carb portion.`);
    food.add("For A1c, cut back on sweet drinks, juice, sweet coffee, desserts, white bread, white rice, and other refined carbs; start with the one you have most often.");
    exercise.add("For A1c, try a 10-20 minute easy walk after the meal that usually has the most carbs, if that is safe for you.");
    exercise.add("If you are cleared for it, add 2 simple strength sessions per week; use bodyweight, bands, or weights.");
    lifestyle.add("Set a simple weekday rule for sweet drinks or desserts, such as saving them for planned times instead of making them an automatic habit.");
    sleep.add("For A1c, keep sleep and wake times steady and aim for at least 7 hours when possible.");
    sleep.add("Before your next lab, note any unusually short sleep, illness, or stress because they can make glucose markers harder to interpret.");
  } else if (a1c) {
    lifestyle.add("Keep the food and movement routines that are working, and compare A1c over time instead of reacting to one report.");
  }

  if (isFlagged(vitaminD)) {
    food.add(`${valueSentence("Vitamin D", vitaminD)}. Add vitamin-D foods you tolerate: salmon, sardines, trout, eggs, or fortified milk/soy/oat drinks.`);
    lifestyle.add("Put vitamin-D foods into a regular meal slot, and keep your current supplement bottles together so they are easy to review at visits.");
  } else if (vitaminD) {
    lifestyle.add("Keep any vitamin D supplement habit steady unless you and your clinician decide to change it.");
  }

  if (hasCategory(results, /kidney/i) && hasFlag(results, /kidney/i)) {
    lifestyle.add("Use one quick notes-app line before labs: water intake, hard workouts, creatine, high-protein meals, and pain relievers.");
  }

  if (hasCategory(results, /liver/i) && hasFlag(results, /liver/i)) {
    lifestyle.add("Avoid extra alcohol, supplements, pain relievers, or hard workouts when liver markers are flagged.");
  }

  if (!food.size) {
    food.add("No food-specific marker stood out. Keep a simple plate pattern: vegetables or fruit, protein, high-fiber starch, and mostly unsaturated fats.");
  }

  if (!exercise.size) {
    exercise.add("No movement-specific marker stood out. Keep a repeatable baseline: walking or cycling most weeks plus simple strength work if safe.");
  }

  if (!lifestyle.size) {
    lifestyle.add("Use a tiny weekly habit checklist: one food swap, one movement slot, one sleep target, and one thing to keep steady.");
  }

  if (!sleep.size) {
    sleep.add("Keep sleep timing steady for the week before routine labs so future comparisons are less noisy.");
    sleep.add("Aim for at least 7 hours when possible, and note short-sleep nights near lab dates.");
  }

  return {
    food: Array.from(food).slice(0, 6),
    exercise: Array.from(exercise).slice(0, 4),
    lifestyle: Array.from(lifestyle).slice(0, 6),
    sleep: Array.from(sleep).slice(0, 4),
  };
}

function buildDoctorQuestions(results: ParsedLabResult[], context?: RecommendationContext) {
  const abnormal = results.filter((result) => !["NORMAL", "UNKNOWN"].includes(result.flag));
  const questions = new Set<string>();
  const profileLabel = ageGenderLabel(context);

  questions.add("How do these results fit with my history, medications, family risk, and symptoms?");

  if (profileLabel) {
    questions.add(`Should my ${profileLabel} affect screening timing, reference ranges, or how we compare these results over time?`);
  }

  if (abnormal.length) {
    questions.add("Which flagged results should be repeated, and what timing makes sense?");
    questions.add("Are any of these changes meaningful compared with my prior reports?");
  } else {
    questions.add("When should I repeat routine screening based on my age, history, and risk factors?");
  }

  if (hasCategory(results, /cholesterol|glucose/i)) {
    questions.add("Should we review cardiovascular or metabolic risk goals, not just whether each value is in range?");
  }

  if (hasCategory(results, /vitamins|minerals/i)) {
    questions.add("Should diet, supplement dose, or absorption factors be reviewed before I change anything?");
  }

  if (hasCategory(results, /kidney|liver/i)) {
    questions.add("Could hydration, exercise, alcohol, medication, or supplement timing have affected these results?");
  }

  return Array.from(questions).slice(0, 4);
}

function flagPositionText(result: ParsedLabResult) {
  if (result.flag === "LOW") return "below the report's range";
  if (result.flag === "HIGH" || result.flag === "CONCERNING") return "above the report's range";
  if (result.flag === "BORDERLINE") return "near the edge of the report's range";
  return "outside the report's expected pattern";
}

function rangeText(result: ParsedLabResult) {
  return result.referenceRangeRaw ? ` Report range: ${result.referenceRangeRaw}.` : "";
}

function baseFlagSentence(result: ParsedLabResult) {
  const value = resultValue(result);
  return `${result.testName}${value ? ` is ${value}` : ""}, which is ${flagPositionText(result)}.${rangeText(result)}`;
}

function buildFlagExplanation(result: ParsedLabResult) {
  const name = normalizedTestName(result);
  const base = baseFlagSentence(result);

  if (/a1c|hemoglobin a1c/.test(name)) {
    return `${base} A1c reflects average blood sugar over about 2-3 months, so this is worth reviewing with fasting glucose, meals, sleep, stress, illness, and prior A1c trends.`;
  }

  if (
    (name.includes("total cholesterol") || name.includes("cholesterol total") || name === "cholesterol") &&
    !/(hdl|ldl|non hdl|ratio)/.test(name)
  ) {
    return `${base} Total cholesterol is a broad lipid number; review LDL, HDL, triglycerides, and overall heart-risk context instead of reading this value alone.`;
  }

  if (name.includes("ldl")) {
    return `${base} LDL is often the cholesterol number clinicians use for heart-risk planning, so compare it with HDL, triglycerides, blood pressure, family history, and medications.`;
  }

  if (name.includes("hdl")) {
    return `${base} HDL has a different meaning than total or LDL cholesterol, so it should be interpreted separately from the rest of the lipid panel.`;
  }

  if (name.includes("triglycerides")) {
    return `${base} Triglycerides can move with fasting status, alcohol, recent meals, sugary drinks, and refined carbs, so note the 24-48 hours before the test.`;
  }

  if (/glucose|blood sugar/.test(name)) {
    return `${base} A single glucose value depends heavily on fasting status, recent food, illness, and stress, so compare it with A1c and the lab instructions.`;
  }

  if (name.includes("vitamin d")) {
    return `${base} Vitamin D cutoffs can vary by lab and guideline, so review diet, supplements, calcium intake, sun exposure, and whether repeat testing makes sense.`;
  }

  if (/creatinine|egfr|bun|urea|kidney/.test(name) || /kidney/i.test(result.category)) {
    return `${base} Kidney markers can be affected by hydration, recent hard workouts, muscle mass, creatine, high-protein meals, and some medicines.`;
  }

  if (/alt|ast|alkaline|bilirubin|albumin|protein|liver/.test(name) || /liver/i.test(result.category)) {
    return `${base} Liver-related markers can shift with alcohol, acetaminophen, supplements, intense exercise, recent illness, and medication timing.`;
  }

  if (/wbc|rbc|hemoglobin|hematocrit|platelet|mcv|mch|rdw|neutrophil|lymphocyte|monocyte|eosinophil|basophil/.test(name)) {
    return `${base} Blood-count markers often need context from symptoms, infection, hydration, iron/B12/folate status, medications, and prior results.`;
  }

  if (/tsh|t3|t4|thyroid/.test(name) || /thyroid/i.test(result.category)) {
    return `${base} Thyroid markers are usually interpreted with symptoms, medications, timing, and related thyroid tests rather than one value alone.`;
  }

  return `${base} Review this with your clinician in the context of symptoms, medications, recent routine changes, and prior reports.`;
}

export function createLocalSummary(results: ParsedLabResult[], context?: RecommendationContext): HealthSummary {
  const abnormal = results.filter((result) => !["NORMAL", "UNKNOWN"].includes(result.flag));
  const grouped = new Map<string, ParsedLabResult[]>();
  const recommendations = buildRecommendations(results, context);
  const doctorQuestions = buildDoctorQuestions(results, context);

  for (const result of results) {
    const group = grouped.get(result.category) ?? [];
    group.push(result);
    grouped.set(result.category, group);
  }

  return {
    overall:
      results.length === 0
        ? ["No lab values were available to summarize yet."]
        : [
            `${results.length} lab value${results.length === 1 ? "" : "s"} reviewed across ${grouped.size} categor${grouped.size === 1 ? "y" : "ies"}.`,
            abnormal.length
              ? `${abnormal.length} value${abnormal.length === 1 ? "" : "s"} may need closer review based on the provided reference ranges.`
              : "No values were outside the provided reference ranges.",
          ],
    flags: abnormal.slice(0, 8).map((result) => ({
      testName: result.testName,
      flag: result.flag,
      explanation: buildFlagExplanation(result),
    })),
    categories: Array.from(grouped.entries()).map(([name, items]) => ({
      name,
      bullets: [
        `${items.length} result${items.length === 1 ? "" : "s"} in this category.`,
        ...items
          .filter((item) => item.flag !== "NORMAL")
          .slice(0, 2)
          .map((item) => `${item.testName} is ${humanizeFlag(item.flag)}.`),
      ],
    })),
    recommendations: {
      ...recommendations,
      askDoctor: doctorQuestions,
    },
    disclaimer: HEALTH_DISCLAIMER,
  };
}

function coerceSummary(value: unknown): HealthSummary | null {
  if (!value || typeof value !== "object") return null;
  const summary = value as Partial<HealthSummary>;
  if (!Array.isArray(summary.overall) || !summary.recommendations) return null;

  return {
    overall: summary.overall,
    flags: Array.isArray(summary.flags) ? summary.flags : [],
    categories: Array.isArray(summary.categories) ? summary.categories : [],
    recommendations: {
      food: summary.recommendations.food ?? [],
      exercise: summary.recommendations.exercise ?? [],
      lifestyle: summary.recommendations.lifestyle ?? [],
      sleep: summary.recommendations.sleep ?? [],
      askDoctor: summary.recommendations.askDoctor ?? [],
    },
    disclaimer: HEALTH_DISCLAIMER,
  };
}

export async function summarizeLabResults(results: ParsedLabResult[], context?: RecommendationContext): Promise<HealthSummary> {
  const env = getEnv();

  if (env.AI_PROVIDER === "mock" || !env.AI_BASE_URL) {
    return createLocalSummary(results, context);
  }

  try {
    const response = await fetch(env.AI_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.AI_API_KEY ? { Authorization: `Bearer ${env.AI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: [{ role: "user", content: buildHealthSummaryPrompt(results, context) }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content ?? payload.content ?? payload;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    return coerceSummary(parsed) ?? createLocalSummary(results, context);
  } catch {
    return createLocalSummary(results, context);
  }
}
