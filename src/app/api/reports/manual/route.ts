import type { NextRequest } from "next/server";
import { z } from "zod";
import { summarizeLabResults } from "@/lib/ai/summarizer";
import { getClientIp, jsonError } from "@/lib/http";
import { parseManualResult } from "@/lib/labs/parser";
import { resolvePersonForUser } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";
import { recommendationContextFromPerson } from "@/lib/settings/profile";

export const runtime = "nodejs";

const resultSchema = z.object({
  testName: z.string().min(2).max(120),
  value: z.coerce.number().optional(),
  stringValue: z.string().optional(),
  unit: z.string().optional(),
  referenceLow: z.coerce.number().optional(),
  referenceHigh: z.coerce.number().optional(),
  referenceRangeRaw: z.string().optional(),
  notes: z.string().optional(),
});

const schema = z.object({
  reportDate: z.coerce.date(),
  labName: z.string().optional(),
  notes: z.string().optional(),
  personId: z.string().optional(),
  personName: z.string().optional(),
  results: z.array(resultSchema).min(1),
});

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Manual report payload is invalid.", 422, body.error.flatten());

  const parsedResults = body.data.results.map(parseManualResult);
  const person = await resolvePersonForUser(user, body.data.personId, body.data.personName);
  const summary = await summarizeLabResults(parsedResults, recommendationContextFromPerson(person));

  const report = await prisma.healthReport.create({
    data: {
      userId: user.id,
      personId: person.id,
      source: "MANUAL",
      status: "FINALIZED",
      reportDate: body.data.reportDate,
      labName: body.data.labName,
      notes: body.data.notes,
      summaryJson: summary,
      recommendationsJson: summary.recommendations,
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
    },
    include: { person: true, labResults: true },
  });

  await auditLog({
    userId: user.id,
    action: "REPORT_CREATED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { reportId: report.id, personId: person.id, source: "MANUAL" },
  });

  return Response.json({ report, summary }, { status: 201 });
}
