import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

/**
 * Profile watchlists listing with OPTIONAL auth. Guests reach the backend so
 * public profiles' lists are viewable signed-out; signed-in requests forward
 * their Bearer token (private-account follower access).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (clientIp) headers["X-Forwarded-For"] = clientIp;

  const res = await fetch(`${BACKEND_URL}/api/watchlists/user/${userId}`, {
    headers,
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: res.status === 403 ? "Private" : "Failed to load" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
