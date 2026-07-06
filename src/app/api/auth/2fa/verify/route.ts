import type { NextRequest } from "next/server";
import { verify } from "otplib";
import { z } from "zod";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";

const schema = z.object({ code: z.string().min(6).max(8) });

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("2FA code is invalid.", 422);

  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!freshUser?.twoFactorSecret) return jsonError("2FA has not been set up.", 400);

  const result = await verify({ secret: freshUser.twoFactorSecret, token: body.data.code });
  if (!result.valid) return jsonError("2FA code did not match.", 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  await auditLog({
    userId: user.id,
    action: "TWO_FACTOR_ENABLED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return Response.json({ ok: true });
}
