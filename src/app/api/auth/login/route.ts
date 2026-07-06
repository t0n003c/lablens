import type { NextRequest } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { verify } from "otplib";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/constants";
import { assertSameOrigin, getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { verifyPassword } from "@/lib/security/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { createSession } from "@/lib/security/session";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { buildChallengeCookie, createChallengePayload, getWebAuthnRequestContext, WEBAUTHN_LOGIN_COOKIE } from "@/lib/security/webauthn";

export const runtime = "nodejs";

const schema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);

  const ipAddress = getClientIp(request);
  const limited = rateLimit(`login:${ipAddress}`, 12, 15 * 60 * 1000);
  if (!limited.allowed) return jsonError("Too many login attempts.", 429);

  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Login details are invalid.", 422, body.error.flatten());

  const turnstile = await verifyTurnstile(body.data.turnstileToken, ipAddress);
  if (!turnstile.ok) return jsonError(turnstile.error ?? "Turnstile failed.", 403);

  const user = await prisma.user.findUnique({ where: { email: body.data.email }, include: { passkeys: true } });
  const passwordOk = user ? await verifyPassword(body.data.password, user.passwordHash) : false;

  if (!user || !passwordOk) {
    await auditLog({
      action: "LOGIN_FAILURE",
      ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
      metadata: { email: body.data.email },
    });
    return jsonError("Email or password is incorrect.", 401);
  }

  if (user.twoFactorEnabled) {
    const result =
      user.twoFactorSecret && body.data.twoFactorCode
        ? await verify({ secret: user.twoFactorSecret, token: body.data.twoFactorCode, epochTolerance: 30 })
        : { valid: false };
    const ok = result.valid;
    if (!ok) return jsonError("A valid 2FA code is required.", 401);
  }

  if (user.passkeyEnabled && user.passkeys.length > 0) {
    const context = getWebAuthnRequestContext(request);
    const options = await generateAuthenticationOptions({
      rpID: context.rpID,
      allowCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: "required",
    });

    const response = Response.json({
      biometricRequired: true,
      options,
      user: { email: user.email, name: user.name, twoFactorEnabled: user.twoFactorEnabled, passkeyEnabled: user.passkeyEnabled },
    });
    response.headers.append(
      "Set-Cookie",
      buildChallengeCookie(
        WEBAUTHN_LOGIN_COOKIE,
        createChallengePayload({
          type: "authentication",
          userId: user.id,
          challenge: options.challenge,
          origin: context.origin,
          rpID: context.rpID,
        }),
        request,
      ),
    );
    return response;
  }

  const session = await createSession({
    userId: user.id,
    ipAddress,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  await auditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    ipAddress,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  const response = Response.json({
    user: { id: user.id, email: user.email, name: user.name, twoFactorEnabled: user.twoFactorEnabled, passkeyEnabled: user.passkeyEnabled },
  });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
  return response;
}
