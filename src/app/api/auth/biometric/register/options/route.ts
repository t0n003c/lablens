import type { NextRequest } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { buildChallengeCookie, createChallengePayload, getWebAuthnRequestContext, WEBAUTHN_REGISTER_COOKIE } from "@/lib/security/webauthn";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const passkeys = await prisma.passkey.findMany({ where: { userId: user.id } });
  const context = getWebAuthnRequestContext(request);
  const options = await generateRegistrationOptions({
    rpName: context.rpName,
    rpID: context.rpID,
    userID: Buffer.from(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
    preferredAuthenticatorType: "localDevice",
  });

  const response = Response.json({ options });
  response.headers.append(
    "Set-Cookie",
    buildChallengeCookie(
      WEBAUTHN_REGISTER_COOKIE,
      createChallengePayload({
        type: "registration",
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
