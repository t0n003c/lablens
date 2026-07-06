import type { NextRequest } from "next/server";
import { z } from "zod";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { hashPassword } from "@/lib/security/password";
import { hashToken } from "@/lib/security/session";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(12).max(128),
});

export async function POST(request: NextRequest) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Reset details are invalid.", 422, body.error.flatten());

  const user = await prisma.user.findFirst({
    where: {
      recoveryTokenHash: hashToken(body.data.token),
      recoveryTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) return jsonError("Recovery token is invalid or expired.", 401);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(body.data.password),
        recoveryTokenHash: null,
        recoveryTokenExpiry: null,
      },
    }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await auditLog({
    userId: user.id,
    action: "PASSWORD_RESET_COMPLETE",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return Response.json({ ok: true });
}
