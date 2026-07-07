import { NextResponse, type NextRequest } from "next/server";

const mutatingMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);

function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  if (!mutatingMethods.has(request.method)) return NextResponse.next();
  if (hasValidOrigin(request)) return NextResponse.next();

  return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
}

export const config = {
  matcher: "/api/:path*",
};
