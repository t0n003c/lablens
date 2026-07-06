import type { NextRequest } from "next/server";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const [settings, people, reports, actionPlanItems, auditLogs] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    prisma.personProfile.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.healthReport.findMany({
      where: { userId: user.id },
      include: { person: true, labResults: { orderBy: { displayOrder: "asc" } } },
      orderBy: { reportDate: "desc" },
    }),
    prisma.actionPlanItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);

  await auditLog({
    userId: user.id,
    action: "EXPORT_CREATED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { reportCount: reports.length },
  });

  const exportBody = {
    exportedAt: new Date().toISOString(),
    app: "LabLens",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    settings,
    people,
    reports,
    actionPlanItems,
    auditLogs,
  };

  return new Response(JSON.stringify(exportBody, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lablens-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
