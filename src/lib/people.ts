import "server-only";

import { prisma } from "@/lib/prisma";
import { cleanProfileAge, cleanProfileText } from "@/lib/settings/profile";

type AccountUser = {
  id: string;
  name: string;
  settings?: {
    profileAge?: number | null;
    profileGender?: string | null;
    profileCountry?: string | null;
    profileEthnicity?: string | null;
    profileJob?: string | null;
    profileHobbies?: string | null;
    profileRoutine?: string | null;
  } | null;
};

export function cleanPersonName(value: unknown) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, 80) : undefined;
}

export async function ensureDefaultPerson(user: AccountUser) {
  const existing = await prisma.personProfile.findFirst({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  if (existing) return existing;

  return prisma.personProfile.create({
    data: {
      userId: user.id,
      name: cleanPersonName(user.name) ?? "Me",
      isDefault: true,
      profileAge: cleanProfileAge(user.settings?.profileAge),
      profileGender: cleanProfileText(user.settings?.profileGender),
      profileCountry: cleanProfileText(user.settings?.profileCountry),
      profileEthnicity: cleanProfileText(user.settings?.profileEthnicity),
      profileJob: cleanProfileText(user.settings?.profileJob),
      profileHobbies: cleanProfileText(user.settings?.profileHobbies),
      profileRoutine: cleanProfileText(user.settings?.profileRoutine),
    },
  });
}

export async function findPersonForUser(userId: string, personId?: string | null) {
  if (!personId) return null;
  return prisma.personProfile.findFirst({ where: { id: personId, userId } });
}

export async function findPersonByName(userId: string, name?: string | null) {
  const cleaned = cleanPersonName(name);
  if (!cleaned) return null;
  return prisma.personProfile.findFirst({
    where: { userId, name: { equals: cleaned, mode: "insensitive" } },
  });
}

export async function resolvePersonForUser(user: AccountUser, personId?: string | null, personName?: string | null) {
  const selected = await findPersonForUser(user.id, personId);
  if (selected) return selected;

  const cleanedName = cleanPersonName(personName);
  if (cleanedName) {
    const existingByName = await findPersonByName(user.id, cleanedName);
    if (existingByName) return existingByName;

    return prisma.personProfile.create({
      data: {
        userId: user.id,
        name: cleanedName,
      },
    });
  }

  return ensureDefaultPerson(user);
}

export async function setDefaultPerson(userId: string, personId: string) {
  return prisma.$transaction(async (tx) => {
    const person = await tx.personProfile.findFirst({ where: { id: personId, userId } });
    if (!person) return null;

    await tx.personProfile.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return tx.personProfile.update({
      where: { id: personId },
      data: { isDefault: true },
    });
  });
}
