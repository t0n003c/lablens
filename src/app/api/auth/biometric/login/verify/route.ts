import type { NextRequest } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { z } from "zod";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { serializeSessionCookie } from "@/lib/security/cookies";
import { createSession } from "@/lib/security/session";
import { clearChallengeCookie, readChallengeCookie, toWebAuthnCredential, WEBAUTHN_LOGIN_COOKIE } from "@/lib/security/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ credential: z.object({ id: z.string().min(1) }).passthrough() });

export async function POST(request: NextRequest) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Biometric response is invalid.", 422);

  const challenge = readChallengeCookie(request.cookies.get(WEBAUTHN_LOGIN_COOKIE)?.value, "authentication");
  if (!challenge) return jsonError("Biometric login expired. Enter your password again.", 401);

  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
    include: { passkeys: true },
  });
  if (!user?.passkeyEnabled) return jsonError("Biometric login is not enabled.", 401);

  const passkey = user.passkeys.find((candidate) => candidate.credentialId === body.data.credential.id);
  if (!passkey) return jsonError("This biometric login is not attached to the account.", 401);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.data.credential as unknown as AuthenticationResponseJSON,
      expectedChallenge: challenge.challenge,
      expectedOrigin: challenge.origin,
      expectedRPID: challenge.rpID,
      credential: toWebAuthnCredential(passkey),
      requireUserVerification: true,
    });
  } catch {
    return jsonError("Biometric check failed.", 401);
  }

  if (!verification.verified) return jsonError("Biometric check failed.", 401);

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      deviceType: verification.authenticationInfo.credentialDeviceType,
      backedUp: verification.authenticationInfo.credentialBackedUp,
      lastUsedAt: new Date(),
    },
  });

  const ipAddress = getClientIp(request);
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
    metadata: { biometric: true },
  });

  const response = Response.json({
    user: { id: user.id, email: user.email, name: user.name, twoFactorEnabled: user.twoFactorEnabled, passkeyEnabled: user.passkeyEnabled },
  });
  response.headers.append("Set-Cookie", clearChallengeCookie(WEBAUTHN_LOGIN_COOKIE, request));
  response.headers.append(
    "Set-Cookie",
    serializeSessionCookie(session.token, session.expiresAt, request),
  );
  return response;
}
