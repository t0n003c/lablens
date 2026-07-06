import type { NextRequest } from "next/server";
import { z } from "zod";
import { createLocalSummary } from "@/lib/ai/summarizer";
import { getClientIp, jsonError } from "@/lib/http";
import type { ParsedLabResult } from "@/lib/labs/types";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";
import { cleanProfileAge, cleanProfileText, recommendationContextFromSettings } from "@/lib/settings/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileField = z.preprocess((value) => {
  if (value === undefined) return undefined;
  return cleanProfileText(value) ?? null;
}, z.string().max(160).nullable().optional());

const profileAgeField = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return cleanProfileAge(value) ?? value;
}, z.number().int().min(0).max(120).nullable().optional());

const schema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  storeRawPdfs: z.boolean().optional(),
  turnstileEnabled: z.boolean().optional(),
  localAiPreferred: z.boolean().optional(),
  profileAge: profileAgeField,
  profileGender: profileField,
  profileCountry: profileField,
  profileEthnicity: profileField,
  profileJob: profileField,
  profileHobbies: profileField,
  profileRoutine: profileField,
});

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);
  return Response.json({ settings: user.settings });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const body = schema.safeParse(await request.json());
  if (!body.success) return jsonError("Settings payload is invalid.", 422, body.error.flatten());

  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body.data },
    update: body.data,
  });
  let refreshedReports = 0;
  const changedProfile = ["profileAge", "profileGender", "profileCountry", "profileEthnicity", "profileJob", "profileHobbies", "profileRoutine"].some((key) =>
    Object.prototype.hasOwnProperty.call(body.data, key),
  );

  if (changedProfile) {
    const context = recommendationContextFromSettings(settings);
    const reports = await prisma.healthReport.findMany({
      where: { userId: user.id },
      include: { labResults: { orderBy: { displayOrder: "asc" } } },
    });

    for (const report of reports) {
      const summary = createLocalSummary(report.labResults as unknown as ParsedLabResult[], context);
      await prisma.healthReport.update({
        where: { id: report.id },
        data: {
          summaryJson: summary,
          recommendationsJson: summary.recommendations,
        },
      });
      refreshedReports += 1;
    }
  }

  await auditLog({
    userId: user.id,
    action: "SETTINGS_CHANGED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { ...body.data, refreshedReports },
  });

  return Response.json({ settings, refreshedReports });
}
