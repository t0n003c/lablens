import type { NextRequest } from "next/server";
import { z } from "zod";
import { buildShortNextStep } from "@/lib/action-plan/shorten";
import { getClientIp, jsonError } from "@/lib/http";
import { ensureDefaultPerson, findPersonForUser, resolvePersonForUser } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categorySchema = z.enum(["Food", "Movement", "Routine", "Sleep"]);

const createSchema = z.object({
  category: categorySchema,
  text: z.string().min(4).max(500),
  reportId: z.string().optional(),
  personId: z.string().optional(),
  personName: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";
  const personId = request.nextUrl.searchParams.get("personId");
  const selectedPerson = personId ? await findPersonForUser(user.id, personId) : await ensureDefaultPerson(user);
  if (!selectedPerson) return jsonError("Person was not found.", 404);

  const items = await prisma.actionPlanItem.findMany({
    where: { userId: user.id, personId: selectedPerson.id, ...(includeArchived ? {} : { status: { not: "ARCHIVED" as const } }) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const body = createSchema.safeParse(await request.json());
  if (!body.success) return jsonError("Action plan payload is invalid.", 422, body.error.flatten());

  let person;
  if (body.data.reportId) {
    const report = await prisma.healthReport.findFirst({
      where: { id: body.data.reportId, userId: user.id },
      include: { person: true },
    });
    if (!report) return jsonError("Report was not found.", 404);
    person = report.person;
  } else {
    person = await resolvePersonForUser(user, body.data.personId, body.data.personName);
  }

  const item = await prisma.actionPlanItem.create({
    data: {
      userId: user.id,
      personId: person.id,
      reportId: body.data.reportId,
      category: body.data.category,
      text: buildShortNextStep(body.data.text),
      notes: body.data.notes ?? body.data.text,
    },
  });

  await auditLog({
    userId: user.id,
    action: "ACTION_PLAN_CHANGED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { action: "created", itemId: item.id, personId: person.id, category: item.category },
  });

  return Response.json({ item }, { status: 201 });
}
