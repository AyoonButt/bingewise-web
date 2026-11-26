import { useOnboardingStore } from "@/stores/onboarding-store";
import type { PostDto } from "@/types/post";

interface FetchOnboardingPostsInput {
  userId?: number;
  language: string;
  region: string;
  genres: number[];
  providers: number[];
  limit: number;
  avoidGenres?: number[];
  excludedTmdbIds?: number[];
  contentLanguagePreference?: "ANY" | "PREFER_SELECTED" | "ONLY_SELECTED";
}

interface OnboardingPreferences {
  userId: number;
  language: string;
  region: string;
  minMovie: number | null;
  maxMovie: number | null;
  minTV: number | null;
  maxTV: number | null;
  oldestDate: string;
  recentDate: string;
  isPrivate: boolean;
  contentRatingAge: number;
  contentLanguagePreference: "ANY" | "PREFER_SELECTED" | "ONLY_SELECTED";
  subscriptions: number[];
  genreIds: number[];
  avoidGenreIds: number[];
  softAvoidGenreIds: number[];
  excludedTmdbIds: number[];
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values));
}

function excludePosts(posts: PostDto[], tmdbIds: number[]): PostDto[] {
  if (tmdbIds.length === 0) return posts;
  const blocked = new Set(tmdbIds);
  return posts.filter((post) => !blocked.has(post.tmdbId));
}

function normalizePosts(data: unknown): PostDto[] {
  if (Array.isArray(data)) return data as PostDto[];
  if (Array.isArray((data as { posts?: unknown })?.posts)) {
    return (data as { posts: PostDto[] }).posts;
  }
  if (Array.isArray((data as { results?: unknown })?.results)) {
    return (data as { results: PostDto[] }).results;
  }
  return [];
}

function normalizedDate(value: string, fallback: string): string {
  if (value === "CURRENT") return new Date().toISOString().split("T")[0];
  return value || fallback;
}

export function buildVibePreferences(userId: number): OnboardingPreferences {
  const state = useOnboardingStore.getState();
  const genreIds = uniqueNumbers([
    ...state.orderedSelectedGenres,
    ...state.preferredGenres,
    ...state.vibeLikedGenres,
  ]);
  const avoidGenreIds = uniqueNumbers([
    ...state.orderedAvoidedGenres,
    ...state.avoidedGenres,
  ]).filter((id) => !genreIds.includes(id));
  const softAvoidGenreIds = uniqueNumbers(state.vibeSoftAvoidedGenres).filter(
    (id) => !genreIds.includes(id) && !avoidGenreIds.includes(id)
  );

  return {
    userId,
    language: state.language.split("-")[0] || "en",
    region: state.region || "US",
    minMovie: state.minMovieDuration > 0 ? state.minMovieDuration : null,
    maxMovie: state.maxMovieDuration < 300 ? state.maxMovieDuration : null,
    minTV: state.minTvDuration > 0 ? state.minTvDuration : null,
    maxTV: state.maxTvDuration < 90 ? state.maxTvDuration : null,
    oldestDate: state.oldestDate || "1900-01-01",
    recentDate: normalizedDate(state.recentDate, "2099-12-31"),
    isPrivate: state.isPrivateAccount,
    contentRatingAge: state.contentRating,
    contentLanguagePreference: state.contentLanguagePreference,
    subscriptions:
      state.orderedSelectedProviders.length > 0
        ? state.orderedSelectedProviders
        : state.selectedProviders,
    genreIds,
    avoidGenreIds,
    softAvoidGenreIds,
    excludedTmdbIds: uniqueNumbers(state.vibeExcludedTmdbIds),
  };
}

export async function fetchGuestVibeSlate(): Promise<PostDto[]> {
  const preferences = buildVibePreferences(0);
  const res = await fetch("/api/backend/api/posts/vibe-slate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preferences,
      excludedTmdbIds: preferences.excludedTmdbIds,
      limit: 48,
    }),
  });
  if (!res.ok) throw new Error("Failed to load vibe slate");
  return normalizePosts(await res.json());
}

export async function fetchOnboardingPosts({
  userId,
  language,
  region,
  genres,
  providers,
  limit,
  avoidGenres = [],
  excludedTmdbIds = [],
  contentLanguagePreference = "ANY",
}: FetchOnboardingPostsInput): Promise<PostDto[]> {
  if (userId) {
    const params = new URLSearchParams({
      userId: String(userId),
      language: language.split("-")[0] || "en",
      region,
      genres: genres.join(","),
      avoidGenres: avoidGenres.join(","),
      subscriptions: providers.join(","),
      contentLanguagePreference,
      limit: String(limit),
    });
    const res = await fetch(`/api/recommendations/preview?${params}`);
    if (!res.ok) throw new Error("Failed to load recommendations");
    return excludePosts(normalizePosts(await res.json()), excludedTmdbIds);
  }

  const preferences = buildVibePreferences(0);
  const params = new URLSearchParams({
    mediaType: "movie",
    limit: String(limit),
  });
  const res = await fetch(`/api/backend/api/posts/recommendations/preview?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error("Failed to load recommendations");
  return excludePosts(
    normalizePosts(await res.json()),
    excludedTmdbIds.length > 0 ? excludedTmdbIds : preferences.excludedTmdbIds
  );
}

export function parseGenreIds(value: string): number[] {
  return value
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}
