import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

/**
 * Watchlist detail proxy with OPTIONAL auth. Guests (no token) still reach
 * the backend so public watchlists are viewable signed-out; signed-in
 * requests forward their Bearer token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // Secret share-link token — grants private-list access to link recipients.
  const shareToken = request.nextUrl.searchParams.get("st");

  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  const qs = shareToken ? `?st=${encodeURIComponent(shareToken)}` : "";
  const res = await fetch(`${BACKEND_URL}/api/watchlists/${id}${qs}`, {
    headers,
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to load watchlist" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
