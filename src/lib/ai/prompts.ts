import { cleanProfileText, hasRecommendationContext } from "@/lib/settings/profile";
import type { ParsedLabResult, RecommendationContext } from "@/lib/labs/types";

function buildContextBlock(context?: RecommendationContext) {
  if (!hasRecommendationContext(context)) return "No optional user context was provided.";

  return JSON.stringify(
    {
      age: context?.age,
      gender: cleanProfileText(context?.gender),
      country: cleanProfileText(context?.country),
      culturalBackgroundOrEthnicity: cleanProfileText(context?.ethnicity),
      workOrDailyRole: cleanProfileText(context?.job),
      hobbies: cleanProfileText(context?.hobbies),
      routineNotes: cleanProfileText(context?.routine),
    },
    null,
    2,
  );
}

export function buildHealthSummaryPrompt(results: ParsedLabResult[], context?: RecommendationContext) {
  return `You are summarizing lab results for a self-hosted personal health app.

Safety rules:
- Do not diagnose or prescribe treatment.
- Explain uncertainty and recommend clinician follow-up for abnormal or concerning values.
- Use plain English.
- Keep "flags" focused on specific abnormal lab values.
- For each "flags" explanation, mention the marker value and range context, then explain what that specific marker usually needs for interpretation. Avoid repeating the same generic sentence for every flag.
- Keep "recommendations.askDoctor" as 2-4 broader appointment questions about context, timing, medications, history, risk, symptoms, or trends. Do not create one question per flagged result.
- Keep food, exercise, lifestyle, and sleep recommendations specific to the marker names, values, and flags when possible. Use short, practical actions that fit the section; avoid generic advice like "eat healthy" unless no relevant marker is available.
- Treat "recommendations.lifestyle" as the user's Routine section. Write it like daily habits and behavior: default groceries, drink habits, calendar reminders, after-meal cues, simple weekly checklists, and what to keep steady. Do not fill this section with doctor questions or technical lab interpretation.
- For glucose, A1c, or triglyceride food guidance, be direct about cutting back on sugary drinks, desserts, and refined carbs when relevant. Do not imply that all carbohydrates should be removed; prefer smaller portions and higher-fiber carbs.
- If optional user context is provided, echo the user's actual age, gender, country, cultural background or ethnicity, work, hobbies, and routine notes in practical examples so the advice feels personal and relatable. Use this context only to fit daily life and visit preparation. Do not infer disease risk, change lab thresholds, or stereotype based on age, gender, identity, or country.
- Recommendations can suggest small habits and tracking ideas, but must not prescribe treatment, supplement doses, medication changes, or a diagnosis.
- Return valid JSON only.

Required JSON shape:
{
  "overall": ["short bullet"],
  "flags": [{"testName":"name","flag":"HIGH|LOW|BORDERLINE|CONCERNING|UNKNOWN|NORMAL","explanation":"cautious explanation"}],
  "categories": [{"name":"category","bullets":["short bullet"]}],
  "recommendations": {
    "food": ["general suggestion"],
    "exercise": ["general suggestion"],
    "lifestyle": ["general suggestion"],
    "sleep": ["general sleep or routine suggestion"],
    "askDoctor": ["topic to discuss"]
  }
}

Optional user context:
${buildContextBlock(context)}

Lab results:
${JSON.stringify(results, null, 2)}`;
}
