import type { NextRequest } from "next/server";
import { z } from "zod";
import { getClientIp, jsonError } from "@/lib/http";
import { cleanPersonName, ensureDefaultPerson, findPersonByName, setDefaultPerson } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";
import { cleanProfileAge, cleanProfileText } from "@/lib/settings/profile";

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

const createSchema = z.object({
  name: z.preprocess((value) => cleanPersonName(value) ?? value, z.string().min(1).max(80)),
  isDefault: z.boolean().optional(),
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

  await ensureDefaultPerson(user);
  const people = await prisma.personProfile.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: { reports: true },
      },
    },
  });

  return Response.json({ people, defaultPersonId: people.find((person) => person.isDefault)?.id ?? people[0]?.id });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const body = createSchema.safeParse(await request.json());
  if (!body.success) return jsonError("Person payload is invalid.", 422, body.error.flatten());

  await ensureDefaultPerson(user);
  const existing = await findPersonByName(user.id, body.data.name);
  if (existing) return jsonError("That person already exists.", 409);

  const person = await prisma.personProfile.create({
    data: {
      userId: user.id,
      name: body.data.name,
      profileAge: body.data.profileAge,
      profileGender: body.data.profileGender,
      profileCountry: body.data.profileCountry,
      profileEthnicity: body.data.profileEthnicity,
      profileJob: body.data.profileJob,
      profileHobbies: body.data.profileHobbies,
      profileRoutine: body.data.profileRoutine,
    },
  });

  const savedPerson = body.data.isDefault ? await setDefaultPerson(user.id, person.id) : person;

  await auditLog({
    userId: user.id,
    action: "SETTINGS_CHANGED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { personId: person.id, action: "person_created" },
  });

  return Response.json({ person: savedPerson }, { status: 201 });
}
