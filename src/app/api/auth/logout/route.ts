import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { getClientIp } from "@/lib/http";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest, revokeSession } from "@/lib/security/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getUserFromRequest(request);
  await revokeSession(token);

  if (user) {
    await auditLog({
      userId: user.id,
      action: "LOGOUT",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  }

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}
