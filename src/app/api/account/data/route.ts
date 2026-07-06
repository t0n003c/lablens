import type { NextRequest } from "next/server";
import { getClientIp, jsonError } from "@/lib/http";
import { ensureDefaultPerson } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";
import { deleteStoredUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const reports = await prisma.healthReport.findMany({
    where: { userId: user.id },
    select: { storedFilePath: true },
  });

  const deletedReports = await prisma.healthReport.deleteMany({
    where: { userId: user.id },
  });
  const deletedActionItems = await prisma.actionPlanItem.deleteMany({
    where: { userId: user.id },
  });
  const deletedPeople = await prisma.personProfile.deleteMany({
    where: { userId: user.id },
  });
  await ensureDefaultPerson(user);

  await Promise.all(reports.map((report) => deleteStoredUpload(report.storedFilePath)));

  await auditLog({
    userId: user.id,
    action: "DATA_DELETED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { deletedReports: deletedReports.count, deletedActionItems: deletedActionItems.count, deletedPeople: deletedPeople.count },
  });

  return Response.json({ ok: true, deletedReports: deletedReports.count, deletedActionItems: deletedActionItems.count, deletedPeople: deletedPeople.count });
}
