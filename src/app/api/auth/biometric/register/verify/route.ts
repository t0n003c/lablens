import type { NextRequest } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { z } from "zod";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";
import { clearChallengeCookie, readChallengeCookie, WEBAUTHN_REGISTER_COOKIE } from "@/lib/security/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ credential: z.unknown() });

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Biometric setup response is invalid.", 422);

  const challenge = readChallengeCookie(request.cookies.get(WEBAUTHN_REGISTER_COOKIE)?.value, "registration");
  if (!challenge || challenge.userId !== user.id) return jsonError("Biometric setup expired. Try again.", 401);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.data.credential as RegistrationResponseJSON,
      expectedChallenge: challenge.challenge,
      expectedOrigin: challenge.origin,
      expectedRPID: challenge.rpID,
      requireUserVerification: true,
    });
  } catch {
    return jsonError("Biometric setup was not accepted by this device.", 401);
  }

  if (!verification.verified || !verification.registrationInfo) {
    return jsonError("Biometric setup was not accepted by this device.", 401);
  }

  const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;
  const existing = await prisma.passkey.findUnique({ where: { credentialId: credential.id } });
  if (existing && existing.userId !== user.id) return jsonError("This biometric login is already attached to another account.", 409);

  if (existing) {
    await prisma.passkey.update({
      where: { id: existing.id },
      data: {
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports ?? [],
      },
    });
  } else {
    await prisma.passkey.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports ?? [],
      },
    });
  }

  await prisma.user.update({ where: { id: user.id }, data: { passkeyEnabled: true } });
  await auditLog({
    userId: user.id,
    action: "PASSKEY_REGISTERED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { deviceType: credentialDeviceType, backedUp: credentialBackedUp },
  });

  const response = Response.json({ ok: true, passkeyEnabled: true });
  response.headers.append("Set-Cookie", clearChallengeCookie(WEBAUTHN_REGISTER_COOKIE, request));
  return response;
}
