import type { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return Response.json({ user: null }, { status: 401 });

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      passkeyEnabled: user.passkeyEnabled,
      settings: user.settings,
    },
  });
}
