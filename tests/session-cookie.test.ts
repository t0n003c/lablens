import { describe, expect, it } from "vitest";
import { requestUsesHttps, serializeExpiredSessionCookie, serializeSessionCookie } from "@/lib/security/cookies";

function request(url: string, headers: Record<string, string> = {}) {
  return { url, headers: new Headers(headers) };
}

describe("session cookie security", () => {
  const expiresAt = new Date("2026-07-07T12:00:00.000Z");

  it("allows a session cookie on plain HTTP LAN deployments", () => {
    const cookie = serializeSessionCookie("session-token", expiresAt, request("http://10.0.10.125:3449/api/auth/login"));

    expect(cookie).toContain("lablens_session=session-token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain("Secure");
  });

  it("marks cookies secure when the request reaches the app over HTTPS", () => {
    expect(serializeSessionCookie("session-token", expiresAt, request("https://labs.example.com/api/auth/login"))).toContain("Secure");
    expect(serializeExpiredSessionCookie(request("https://labs.example.com/api/auth/logout"))).toContain("Secure");
  });

  it("trusts common reverse-proxy HTTPS headers", () => {
    const proxied = request("http://lablens-app:3000/api/auth/login", { "x-forwarded-proto": "https" });

    expect(requestUsesHttps(proxied)).toBe(true);
    expect(serializeSessionCookie("session-token", expiresAt, proxied)).toContain("Secure");
  });

  it("uses HTTPS origin as a browser-facing signal", () => {
    const proxied = request("http://lablens-app:3000/api/auth/login", { origin: "https://labs.example.com" });

    expect(requestUsesHttps(proxied)).toBe(true);
    expect(serializeSessionCookie("session-token", expiresAt, proxied)).toContain("Secure");
  });
});
