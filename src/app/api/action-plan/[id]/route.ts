import type { NextRequest } from "next/server";
import { z } from "zod";
import { buildShortNextStep } from "@/lib/action-plan/shorten";
import { getClientIp, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security/audit";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "DONE", "ARCHIVED"]).optional(),
  text: z.string().min(4).max(500).optional(),
  notes: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const { id } = await context.params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return jsonError("Action plan payload is invalid.", 422, body.error.flatten());

  const existing = await prisma.actionPlanItem.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Action plan item was not found.", 404);

  const item = await prisma.actionPlanItem.update({
    where: { id },
    data: {
      status: body.data.status,
      text: body.data.text ? buildShortNextStep(body.data.text) : undefined,
      notes: body.data.notes,
      completedAt: body.data.status === "DONE" ? new Date() : body.data.status === "ACTIVE" ? null : undefined,
    },
  });

  await auditLog({
    userId: user.id,
    action: "ACTION_PLAN_CHANGED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { action: "updated", itemId: item.id, status: item.status },
  });

  return Response.json({ item });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const { id } = await context.params;
  const existing = await prisma.actionPlanItem.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Action plan item was not found.", 404);

  const item = await prisma.actionPlanItem.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await auditLog({
    userId: user.id,
    action: "ACTION_PLAN_CHANGED",
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    metadata: { action: "archived", itemId: item.id },
  });

  return Response.json({ ok: true, item });
}
