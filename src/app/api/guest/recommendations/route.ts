import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

/**
 * Unauthenticated proxy for guest browsing. Mirrors the mobile app's
 * GET /api/recommendations/guest (no Bearer token required).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  for (const key of ["language", "region", "contentType", "limit"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  const headers: Record<string, string> = {};
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  const res = await fetch(`${BACKEND_URL}/api/recommendations/guest?${params}`, {
    headers,
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to load guest recommendations" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
