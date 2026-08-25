import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

/**
 * Unauthenticated proxy for the public watchlist discovery feed.
 * Public data — no Bearer token required (guest browsing).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  for (const key of ["q", "limit"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  const headers: Record<string, string> = {};
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  const res = await fetch(`${BACKEND_URL}/api/watchlists/public?${params}`, {
    headers,
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to load public watchlists" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
