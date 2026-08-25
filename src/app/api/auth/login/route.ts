import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/session";
import { hasAllowedOrigin } from "@/lib/request-guard";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(72),
});

export async function POST(request: NextRequest) {
  if (!hasAllowedOrigin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Username and password are required" },
      { status: 400 }
    );
  }
  const body = parsed.data;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ message: error }, { status: res.status });
  }

  const data = await res.json();

  // SECURITY: tokens go to httpOnly cookies ONLY — never reflected in the
  // response body, where XSS could read them.
  const { accessToken: _a, refreshToken: _r, ...safe } = data ?? {};
  const response = NextResponse.json(safe);
  response.cookies.set("accessToken", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });
  response.cookies.set("refreshToken", data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
  });

  return response;
}
