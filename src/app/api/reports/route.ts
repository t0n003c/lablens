import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/http";
import { ensureDefaultPerson, findPersonForUser } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const personId = url.searchParams.get("personId");
  const selectedPerson = personId && personId !== "all" ? await findPersonForUser(user.id, personId) : null;
  if (personId && personId !== "all" && !selectedPerson) return jsonError("Person was not found.", 404);
  if (!personId) await ensureDefaultPerson(user);

  const reports = await prisma.healthReport.findMany({
    where: {
      userId: user.id,
      ...(selectedPerson ? { personId: selectedPerson.id } : {}),
      ...(query
        ? {
            OR: [
              { labName: { contains: query, mode: "insensitive" } },
              { labResults: { some: { testName: { contains: query, mode: "insensitive" } } } },
              { person: { name: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { person: true, labResults: { orderBy: { displayOrder: "asc" } } },
    orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return Response.json({ reports });
}
