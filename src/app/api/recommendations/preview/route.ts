import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function numberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function nullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

/**
 * Maps the onboarding preference DTO to exactly the fields the backend accepts.
 * Kept pure so the field contract can be tested without a running server.
 */
export function buildBackendPreferences(input: Record<string, unknown>) {
  // Exactly the fields in the backend's UserPreferencesDto. The backend uses a
  // strict ObjectMapper, so unknown or mis-cased keys (e.g. minTv) cause a 400.
  return {
    userId: Number(input.userId) || 0,
    language: stringValue(input.language, "en"),
    region: stringValue(input.region, "US"),
    minMovie: nullableInt(input.minMovie),
    maxMovie: nullableInt(input.maxMovie),
    minTV: nullableInt(input.minTV),
    maxTV: nullableInt(input.maxTV),
    oldestDate: stringValue(input.oldestDate, "1900-01-01"),
    recentDate: stringValue(input.recentDate, "2099-12-31"),
    isPrivate: Boolean(input.isPrivate),
    contentRatingAge: Number(input.contentRatingAge) || 99,
    contentLanguagePreference: stringValue(input.contentLanguagePreference, "ANY"),
    subscriptions: numberArray(input.subscriptions),
    genreIds: numberArray(input.genreIds),
    avoidGenreIds: numberArray(input.avoidGenreIds),
    softAvoidGenreIds: numberArray(input.softAvoidGenreIds),
    excludedTmdbIds: numberArray(input.excludedTmdbIds),
  };
}

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
