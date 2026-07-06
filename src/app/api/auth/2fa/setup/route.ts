import type { NextRequest } from "next/server";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/security/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError("Authentication is required.", 401);

  const secret = generateSecret();
  const otpauth = generateURI({
    issuer: "LabLens",
    label: user.email,
    secret,
  });
  const qrCode = await QRCode.toDataURL(otpauth);

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  return Response.json({ otpauth, qrCode });
}
