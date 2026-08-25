import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/session";
import { hasAllowedOrigin } from "@/lib/request-guard";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

export async function POST(request: NextRequest) {
  if (!hasAllowedOrigin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    headers: (() => {
      const h: Record<string, string> = { Authorization: `Bearer ${refreshToken}` };
      const clientIp =
        request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
      if (clientIp) h["X-Forwarded-For"] = clientIp;
      return h;
    })(),
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
  }

  const data = await res.json();

  // SECURITY: tokens go to httpOnly cookies ONLY — never reflected in the body.
  const { accessToken: _a, refreshToken: _r, ...safe } = data ?? {};
  const response = NextResponse.json(safe);
  response.cookies.set("accessToken", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });
  if (data.refreshToken) {
    response.cookies.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: "/",
    });
  }

  return response;
}
