import type { NextRequest } from "next/server";
import { z } from "zod";
import { summarizeLabResults } from "@/lib/ai/summarizer";
import { getClientIp, jsonError } from "@/lib/http";
import { parseManualResult } from "@/lib/labs/parser";
import type { ParsedLabResult } from "@/lib/labs/types";
import { resolvePersonForUser } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";
import { recommendationContextFromPerson } from "@/lib/settings/profile";
import { deleteStoredUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().finite().optional());

const optionalText = (max = 160) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const cleaned = value.replace(/\s+/g, " ").trim();
    return cleaned || undefined;
  }, z.string().max(max).optional());

const reviewResultSchema = z.object({
  id: z.string().optional(),
  keep: z.boolean().default(true),
  testName: optionalText(120),
  value: optionalNumber,
  stringValue: optionalText(120),
  unit: optionalText(40),
  referenceLow: optionalNumber,
  referenceHigh: optionalNumber,
  referenceRangeRaw: optionalText(120),
  notes: optionalText(400),
});

const patchSchema = z.object({
  reportDate: z.coerce.date().optional(),
  labName: optionalText(120),
  notes: optionalText(1000),
  personId: z.string().optional(),
  personName: optionalText(80),
  status: z.enum(["DRAFT", "REVIEWED", "FINALIZED"]).optional(),
  results: z.array(reviewResultSchema).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const { id } = await context.params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return jsonError("Report review payload is invalid.", 422, body.error.flatten());

  const existingReport = await prisma.healthReport.findFirst({
    where: { id, userId: user.id },
    include: { labResults: { orderBy: { displayOrder: "asc" } }, person: true },
  });

  if (!existingReport) return jsonError("Report was not found.", 404);

  const keptRows = body.data.results?.filter((result) => result.keep) ?? [];
  const parsedResults = keptRows
    .filter((result) => result.testName)
    .map((result) =>
      parseManualResult({
        testName: result.testName ?? "",
        value: result.value,
        stringValue: result.stringValue,
        unit: result.unit,
        referenceLow: result.referenceLow,
        referenceHigh: result.referenceHigh,
        referenceRangeRaw: result.referenceRangeRaw,
        notes: result.notes,
      }),
    );

  const nextStatus = body.data.status ?? existingReport.status;
  if (nextStatus !== "DRAFT" && body.data.results && parsedResults.length === 0) {
    return jsonError("Keep at least one lab value before finalizing this report.", 422);
  }

  const nextPerson =
    body.data.personId || body.data.personName
      ? await resolvePersonForUser(user, body.data.personId, body.data.personName)
      : existingReport.person;
  const shouldRefreshSummary = Boolean(body.data.results) || nextPerson.id !== existingReport.personId;
  const summaryResults = body.data.results ? parsedResults : (existingReport.labResults as unknown as ParsedLabResult[]);
  const summary = shouldRefreshSummary
    ? await summarizeLabResults(summaryResults, recommendationContextFromPerson(nextPerson))
    : undefined;

  const report = await prisma.$transaction(async (tx) => {
    if (body.data.results) {
      await tx.labResult.deleteMany({ where: { reportId: id } });
    }

    return tx.healthReport.update({
      where: { id },
      data: {
        reportDate: body.data.reportDate,
        labName: body.data.labName,
        notes: body.data.notes,
        personId: nextPerson.id,
        status: nextStatus,
        summaryJson: summary,
        recommendationsJson: summary?.recommendations,
        ...(body.data.results
          ? {
              labResults: {
                create: parsedResults.map((result, index) => ({
                  testName: result.testName,
                  category: result.category,
                  value: result.value,
                  stringValue: result.stringValue,
                  unit: result.unit,
                  referenceLow: result.referenceLow,
                  referenceHigh: result.referenceHigh,
                  referenceRangeRaw: result.referenceRangeRaw,
                  flag: result.flag,
                  notes: result.notes,
                  displayOrder: index,
                })),
              },
            }
          : {}),
      },
      include: { person: true, labResults: { orderBy: { displayOrder: "asc" } } },
    });
  });

  await auditLog({
    userId: user.id,
    action: "REPORT_UPDATED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { reportId: report.id, personId: report.personId, status: report.status, resultCount: report.labResults.length },
  });

  return Response.json({ report, summary });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const { id } = await context.params;
  const report = await prisma.healthReport.findFirst({
    where: { id, userId: user.id },
    select: { id: true, storedFilePath: true, labResults: { select: { id: true } } },
  });

  if (!report) return jsonError("Report was not found.", 404);

  await prisma.healthReport.delete({ where: { id: report.id } });
  await deleteStoredUpload(report.storedFilePath);

  await auditLog({
    userId: user.id,
    action: "REPORT_DELETED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { reportId: report.id, deletedResults: report.labResults.length },
  });

  return Response.json({ ok: true, deletedReport: report.id, deletedResults: report.labResults.length });
}
