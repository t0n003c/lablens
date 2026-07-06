import type { RecommendationContext } from "@/lib/labs/types";

const MAX_CONTEXT_LENGTH = 160;
const MAX_AGE = 120;

export function cleanProfileText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, MAX_CONTEXT_LENGTH) : undefined;
}

export function cleanProfileAge(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const age = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(age) || age < 0 || age > MAX_AGE) return undefined;
  return age;
}

export function recommendationContextFromSettings(settings?: {
  profileAge?: number | null;
  profileGender?: string | null;
  profileCountry?: string | null;
  profileEthnicity?: string | null;
  profileJob?: string | null;
  profileHobbies?: string | null;
  profileRoutine?: string | null;
} | null): RecommendationContext {
  return {
    age: cleanProfileAge(settings?.profileAge),
    gender: cleanProfileText(settings?.profileGender),
    country: cleanProfileText(settings?.profileCountry),
    ethnicity: cleanProfileText(settings?.profileEthnicity),
    job: cleanProfileText(settings?.profileJob),
    hobbies: cleanProfileText(settings?.profileHobbies),
    routine: cleanProfileText(settings?.profileRoutine),
  };
}

export const recommendationContextFromPerson = recommendationContextFromSettings;

export function hasRecommendationContext(context?: RecommendationContext) {
  return Boolean(
    context &&
      (cleanProfileAge(context.age) !== undefined ||
        cleanProfileText(context.gender) ||
        cleanProfileText(context.country) ||
        cleanProfileText(context.ethnicity) ||
        cleanProfileText(context.job) ||
        cleanProfileText(context.hobbies) ||
        cleanProfileText(context.routine)),
  );
}
