import type { AuditAction } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function auditLog({
  userId,
  action,
  ipAddress,
  userAgent,
  metadata,
}: {
  userId?: string;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      ipAddress,
      userAgent,
      metadata,
    },
  });
}
