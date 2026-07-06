import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { AuthenticatorTransportFuture, WebAuthnCredential } from "@simplewebauthn/server";
import { APP_NAME } from "@/lib/constants";
import { getEnv } from "@/lib/env";

export const WEBAUTHN_REGISTER_COOKIE = "lablens_webauthn_register";
export const WEBAUTHN_LOGIN_COOKIE = "lablens_webauthn_login";

const CHALLENGE_SECONDS = 5 * 60;

export type WebAuthnChallengeType = "registration" | "authentication";

export type WebAuthnChallengePayload = {
  type: WebAuthnChallengeType;
  userId: string;
  challenge: string;
  origin: string;
  rpID: string;
  exp: number;
};

type StoredPasskey = {
  credentialId: string;
  publicKey: Uint8Array;
  counter: bigint | number;
  transports: string[];
};

function signSegment(segment: string) {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(segment).digest("base64url");
}

function secureCookie(request: NextRequest) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  return forwardedProtocol === "https" || new URL(request.url).protocol === "https:" || process.env.NODE_ENV === "production";
}

function serializeCookie(name: string, value: string, request: NextRequest, maxAge: number) {
  return [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    secureCookie(request) ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function hasChallengeShape(payload: Partial<WebAuthnChallengePayload>, type: WebAuthnChallengeType): payload is WebAuthnChallengePayload {
  return (
    payload.type === type &&
    typeof payload.userId === "string" &&
    typeof payload.challenge === "string" &&
    typeof payload.origin === "string" &&
    typeof payload.rpID === "string" &&
    typeof payload.exp === "number" &&
    payload.exp > Date.now()
  );
}

export function getWebAuthnRequestContext(request: NextRequest) {
  const requestOrigin = new URL(request.url).origin;
  const rawOrigin = request.headers.get("origin") ?? requestOrigin;

  try {
    const origin = new URL(rawOrigin).origin;
    return { rpName: APP_NAME, origin, rpID: new URL(origin).hostname };
  } catch {
    return { rpName: APP_NAME, origin: requestOrigin, rpID: new URL(requestOrigin).hostname };
  }
}

export function createChallengePayload({
  type,
  userId,
  challenge,
  origin,
  rpID,
}: Omit<WebAuthnChallengePayload, "exp">) {
  return {
    type,
    userId,
    challenge,
    origin,
    rpID,
    exp: Date.now() + CHALLENGE_SECONDS * 1000,
  };
}

export function buildChallengeCookie(name: string, payload: WebAuthnChallengePayload, request: NextRequest) {
  const segment = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return serializeCookie(name, `${segment}.${signSegment(segment)}`, request, CHALLENGE_SECONDS);
}

export function clearChallengeCookie(name: string, request: NextRequest) {
  return serializeCookie(name, "", request, 0);
}

export function readChallengeCookie(value: string | undefined, type: WebAuthnChallengeType) {
  if (!value) return null;
  const [segment, signature] = value.split(".");
  if (!segment || !signature) return null;

  const expected = signSegment(segment);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Partial<WebAuthnChallengePayload>;
    return hasChallengeShape(parsed, type) ? parsed : null;
  } catch {
    return null;
  }
}

export function toWebAuthnCredential(passkey: StoredPasskey): WebAuthnCredential {
  return {
    id: passkey.credentialId,
    publicKey: new Uint8Array(passkey.publicKey),
    counter: Number(passkey.counter),
    transports: passkey.transports as AuthenticatorTransportFuture[],
  };
}
