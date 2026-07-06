import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { hashToken } from "@/lib/security/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.email().trim().toLowerCase(),
});

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request);
  const limited = rateLimit(`recover:${ipAddress}`, 5, 15 * 60 * 1000);
  if (!limited.allowed) return jsonError("Too many recovery attempts.", 429);

  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Recovery details are invalid.", 422, body.error.flatten());

  const user = await prisma.user.findUnique({ where: { email: body.data.email } });
  const token = randomBytes(32).toString("base64url");

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        recoveryTokenHash: hashToken(token),
        recoveryTokenExpiry: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await auditLog({
      userId: user.id,
      action: "PASSWORD_RESET_REQUEST",
      ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  }

  return Response.json({
    ok: true,
    message: "If the account exists, a recovery token has been created.",
    recoveryToken: process.env.NODE_ENV !== "production" && user ? token : undefined,
  });
}
