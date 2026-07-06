import type { NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/constants";
import { assertSameOrigin, getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { hashPassword } from "@/lib/security/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSession } from "@/lib/security/session";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);

  const ipAddress = getClientIp(request);
  const limited = rateLimit(`register:${ipAddress}`, 5, 15 * 60 * 1000);
  if (!limited.allowed) return jsonError("Too many registration attempts.", 429);

  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Registration details are invalid.", 422, body.error.flatten());

  const turnstile = await verifyTurnstile(body.data.turnstileToken, ipAddress);
  if (!turnstile.ok) return jsonError(turnstile.error ?? "Turnstile failed.", 403);

  const existing = await prisma.user.findUnique({ where: { email: body.data.email } });
  if (existing) return jsonError("An account already exists for this email.", 409);

  const passwordHash = await hashPassword(body.data.password);
  const user = await prisma.user.create({
    data: {
      email: body.data.email,
      name: body.data.name,
      passwordHash,
      settings: { create: {} },
    },
  });

  await auditLog({
    userId: user.id,
    action: "REGISTER",
    ipAddress,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  const session = await createSession({
    userId: user.id,
    ipAddress,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  const response = Response.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
  return response;
}
