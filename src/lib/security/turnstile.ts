import { getEnv } from "@/lib/env";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstile(token?: string | null, ipAddress?: string) {
  const env = getEnv();

  if (!env.TURNSTILE_ENABLED) return { ok: true };
  if (!env.TURNSTILE_SECRET_KEY) {
    return { ok: false, error: "Turnstile is enabled but not configured." };
  }
  if (!token) return { ok: false, error: "Turnstile token is missing." };

  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  if (ipAddress) form.set("remoteip", ipAddress);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const result = (await response.json()) as TurnstileResponse;

  return result.success
    ? { ok: true }
    : { ok: false, error: result["error-codes"]?.join(", ") ?? "Turnstile verification failed." };
}
