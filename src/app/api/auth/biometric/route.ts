import type { NextRequest } from "next/server";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  await prisma.passkey.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { passkeyEnabled: false } });
  await auditLog({
    userId: user.id,
    action: "SETTINGS_CHANGED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { passkeyEnabled: false },
  });

  return Response.json({ ok: true, passkeyEnabled: false });
}
