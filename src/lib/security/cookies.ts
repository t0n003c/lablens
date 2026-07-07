import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

type CookieRequest = Pick<NextRequest, "headers" | "url">;

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim().toLowerCase() ?? "";
}

function protocolFromUrl(value: string | null) {
  if (!value) return "";

  try {
    return new URL(value).protocol.toLowerCase();
  } catch {
    return "";
  }
}

export function requestUsesHttps(request: CookieRequest) {
  const forwardedProtocol = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const forwardedScheme = firstHeaderValue(request.headers.get("x-forwarded-scheme"));
  const forwardedSsl = firstHeaderValue(request.headers.get("x-forwarded-ssl"));
  const frontendHttps = firstHeaderValue(request.headers.get("front-end-https"));

  return (
    forwardedProtocol === "https" ||
    forwardedScheme === "https" ||
    forwardedSsl === "on" ||
    frontendHttps === "on" ||
    protocolFromUrl(request.url) === "https:" ||
    protocolFromUrl(request.headers.get("origin")) === "https:"
  );
}

export function serializeSessionCookie(token: string, expiresAt: Date, request: CookieRequest) {
  return [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
    requestUsesHttps(request) ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function serializeExpiredSessionCookie(request: CookieRequest) {
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    requestUsesHttps(request) ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
