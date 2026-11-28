import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/session";
import { hasAllowedOrigin } from "@/lib/request-guard";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

const socialSchema = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(1).max(8192),
  name: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  if (!hasAllowedOrigin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const parsed = socialSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provider and ID token are required" },
      { status: 400 }
    );
  }

  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  // The backend already verifies provider-issued identity tokens at dedicated
  // endpoints; keep our proxy path stable and map to the right one.
  const res = await fetch(`${BACKEND_URL}/api/auth/${parsed.data.provider}`, {
    method: "POST",
    headers,
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Social sign-in failed: ${res.status}`;
    try {
      const body = JSON.parse(text);
      message = body.message || body.error || message;
    } catch {
      // Non-JSON upstream error — keep the raw text.
    }
    return NextResponse.json({ message }, { status: res.status });
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
