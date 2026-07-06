import { getEnvWarnings } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const warnings = getEnvWarnings();
  let database = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "unavailable";
    warnings.push("Database check failed.");
  }

  return Response.json({
    status: database === "ok" ? "ok" : "degraded",
    service: "lablens",
    database,
    warnings,
    latencyMs: Date.now() - started,
  });
}
