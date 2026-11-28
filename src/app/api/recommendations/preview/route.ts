import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildBackendPreferences } from "@/lib/backend-preferences";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ message: "Invalid preferences" }, { status: 400 });
  }

  const preferences = buildBackendPreferences(raw as Record<string, unknown>);
  const { searchParams } = request.nextUrl;
  const limit = searchParams.get("limit") ?? "10";
  const params = new URLSearchParams({
    userId: String(preferences.userId),
    mediaType: "movie",
    limit,
  });

  const backendUrl = process.env.BACKEND_URL || "https://api-bingewise.com";
  const res = await fetch(`${backendUrl}/api/posts/recommendations/preview?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Failed to load recommendations" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
