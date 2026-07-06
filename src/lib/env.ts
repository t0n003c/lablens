import { z } from "zod";
import { DEFAULT_MAX_UPLOAD_MB } from "@/lib/constants";

const envBoolean = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (["true", "1", "yes", "on"].includes(value.toLowerCase())) return true;
  if (["false", "0", "no", "off", ""].includes(value.toLowerCase())) return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32).default("development-only-secret-change-before-prod"),
  DATABASE_URL: z.string().min(1).optional(),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(DEFAULT_MAX_UPLOAD_MB),
  STORE_RAW_PDFS: envBoolean.default(false),
  UPLOAD_DIR: z.string().default("/app/data/uploads"),
  TURNSTILE_ENABLED: envBoolean.default(false),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["mock", "openai-compatible", "local"]).default("mock"),
  AI_MODEL: z.string().default("local-lab-summary"),
  AI_BASE_URL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  DATA_ENCRYPTION_KEY: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function getEnvWarnings() {
  const env = getEnv();
  const warnings: string[] = [];

  if (env.SESSION_SECRET.includes("development-only")) {
    warnings.push("SESSION_SECRET is using the development fallback.");
  }

  if (env.TURNSTILE_ENABLED && !env.TURNSTILE_SECRET_KEY) {
    warnings.push("TURNSTILE_ENABLED is true but TURNSTILE_SECRET_KEY is missing.");
  }

  if (env.AI_PROVIDER !== "mock" && !env.AI_BASE_URL) {
    warnings.push("AI_PROVIDER is configured but AI_BASE_URL is missing.");
  }

  if (!env.DATA_ENCRYPTION_KEY) {
    warnings.push("DATA_ENCRYPTION_KEY is not configured; future app-level encryption migrations will need one stable key.");
  }

  return warnings;
}
