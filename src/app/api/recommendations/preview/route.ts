import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId") ?? "0";
  const limit = searchParams.get("limit") ?? "10";

  const backendUrl = process.env.BACKEND_URL || "https://api-bingewise.com";
  const params = new URLSearchParams({
    userId,
    mediaType: "movie",
    limit,
  });

  const res = await fetch(`${backendUrl}/api/posts/recommendations/preview?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: parseInt(userId),
      language: searchParams.get("language") ?? "en",
      region: searchParams.get("region") ?? "US",
      subscriptions: (searchParams.get("subscriptions") ?? "").split(",").filter(Boolean).map(Number),
      genreIds: (searchParams.get("genres") ?? "").split(",").filter(Boolean).map(Number),
      avoidGenreIds: [] as number[],
      minMovie: parseInt(searchParams.get("minMovie") ?? "0") || null,
      maxMovie: parseInt(searchParams.get("maxMovie") ?? "0") || null,
      minTv: parseInt(searchParams.get("minTv") ?? "0") || null,
      maxTv: parseInt(searchParams.get("maxTv") ?? "0") || null,
      oldestDate: "1900-01-01",
      recentDate: "2099-12-31",
      isPrivate: false,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Failed to load recommendations" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
