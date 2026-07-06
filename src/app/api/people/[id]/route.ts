import type { NextRequest } from "next/server";
import { z } from "zod";
import { createLocalSummary } from "@/lib/ai/summarizer";
import { getClientIp, jsonError } from "@/lib/http";
import type { ParsedLabResult } from "@/lib/labs/types";
import { cleanPersonName, setDefaultPerson } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";
import { cleanProfileAge, cleanProfileText, recommendationContextFromPerson } from "@/lib/settings/profile";
import { deleteStoredUpload } from "@/lib/uploads";

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

const patchSchema = z.object({
  name: z.preprocess((value) => (value === undefined ? undefined : cleanPersonName(value) ?? value), z.string().min(1).max(80).optional()),
  isDefault: z.boolean().optional(),
  profileAge: profileAgeField,
  profileGender: profileField,
  profileCountry: profileField,
  profileEthnicity: profileField,
  profileJob: profileField,
  profileHobbies: profileField,
  profileRoutine: profileField,
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const { id } = await context.params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return jsonError("Person payload is invalid.", 422, body.error.flatten());

  const existing = await prisma.personProfile.findFirst({ where: { id, userId: user.id } });
  if (!existing) return jsonError("Person was not found.", 404);

  if (body.data.name && body.data.name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await prisma.personProfile.findFirst({
      where: { userId: user.id, name: { equals: body.data.name, mode: "insensitive" }, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) return jsonError("That person already exists.", 409);
  }

  const { isDefault, ...profileData } = body.data;
  const updatedPerson = await prisma.personProfile.update({
    where: { id },
    data: profileData,
  });
  const person = isDefault ? await setDefaultPerson(user.id, id) : updatedPerson;

  const changedProfile = ["profileAge", "profileGender", "profileCountry", "profileEthnicity", "profileJob", "profileHobbies", "profileRoutine"].some((key) =>
    Object.prototype.hasOwnProperty.call(profileData, key),
  );
  let refreshedReports = 0;

  if (changedProfile) {
    const contextForPerson = recommendationContextFromPerson(person ?? updatedPerson);
    const reports = await prisma.healthReport.findMany({
      where: { userId: user.id, personId: id },
      include: { labResults: { orderBy: { displayOrder: "asc" } } },
    });

    for (const report of reports) {
      const summary = createLocalSummary(report.labResults as unknown as ParsedLabResult[], contextForPerson);
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
    metadata: { personId: id, action: "person_updated", refreshedReports },
  });

  return Response.json({ person: person ?? updatedPerson, refreshedReports });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const { id } = await context.params;
  const person = await prisma.personProfile.findFirst({
    where: { id, userId: user.id },
    include: { reports: { select: { storedFilePath: true } } },
  });
  if (!person) return jsonError("Person was not found.", 404);

  const peopleCount = await prisma.personProfile.count({ where: { userId: user.id } });
  if (peopleCount <= 1) return jsonError("Keep at least one person in this account.", 422);

  await prisma.personProfile.delete({ where: { id } });
  await Promise.all(person.reports.map((report) => deleteStoredUpload(report.storedFilePath)));

  if (person.isDefault) {
    const nextPerson = await prisma.personProfile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (nextPerson) await setDefaultPerson(user.id, nextPerson.id);
  }

  await auditLog({
    userId: user.id,
    action: "DATA_DELETED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { personId: id, action: "person_deleted", deletedReports: person.reports.length },
  });

  return Response.json({ ok: true, deletedPerson: id, deletedReports: person.reports.length });
}
