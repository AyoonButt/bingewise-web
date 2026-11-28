import { useOnboardingStore } from "@/stores/onboarding-store";
import type { PostDto } from "@/types/post";

export interface FetchOnboardingPostsInput {
  userId?: number;
  language: string;
  region: string;
  genres: number[];
  providers: number[];
  limit: number;
  avoidGenres?: number[];
  softAvoidGenreIds?: number[];
  excludedTmdbIds?: number[];
  contentLanguagePreference?: "ANY" | "PREFER_SELECTED" | "ONLY_SELECTED";
}

/** Shape accepted by the backend's UserPreferencesDto. */
export interface OnboardingPreferences {
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
  // preferredGenres/avoidedGenres already carry drag order; the legacy
  // ordered* genre fields are never written by a step and must not override
  // the current selection.
  const genreIds = uniqueNumbers([...state.preferredGenres, ...state.vibeLikedGenres]);
  // Vibe rejects are soft signals only; hard avoids come from the genre step.
  const avoidGenreIds = uniqueNumbers(state.avoidedGenres).filter(
    (id) => !genreIds.includes(id)
  );
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

/**
 * The vibe-slate endpoint is public and takes the full preference object in its
 * body. Signed-in users use it too so their hard avoids, soft vibe signals and
 * exact exclusions are identical to a guest's.
 */
export async function fetchVibeSlate(): Promise<PostDto[]> {
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

// Kept as an alias for callers/tests that use the old name.
export const fetchGuestVibeSlate = fetchVibeSlate;

export async function fetchOnboardingPosts({
  userId,
  language,
  region,
  genres,
  providers,
  limit,
  avoidGenres = [],
  softAvoidGenreIds,
  excludedTmdbIds = [],
  contentLanguagePreference = "ANY",
}: FetchOnboardingPostsInput): Promise<PostDto[]> {
  // Start from the complete stored preference DTO, then apply step-level
  // overrides. Never reduce it to a handful of query parameters: the backend
  // ranking needs every field (dates, runtimes, rating, soft/exact exclusions).
  const preferences = buildVibePreferences(userId ?? 0);

  if (userId) preferences.userId = userId;
  if (genres.length > 0) preferences.genreIds = uniqueNumbers(genres);
  if (providers.length > 0) preferences.subscriptions = uniqueNumbers(providers);
  preferences.avoidGenreIds = uniqueNumbers(avoidGenres).filter(
    (id) => !preferences.genreIds.includes(id)
  );
  preferences.softAvoidGenreIds = uniqueNumbers(
    softAvoidGenreIds ?? preferences.softAvoidGenreIds
  ).filter(
    (id) => !preferences.genreIds.includes(id) && !preferences.avoidGenreIds.includes(id)
  );
  if (excludedTmdbIds.length > 0) {
    preferences.excludedTmdbIds = uniqueNumbers(excludedTmdbIds);
  }
  preferences.language = language.split("-")[0] || "en";
  preferences.region = region || preferences.region;
  preferences.contentLanguagePreference = contentLanguagePreference;

  const url = userId
    ? `/api/recommendations/preview?limit=${limit}`
    : `/api/backend/api/posts/recommendations/preview?mediaType=movie&limit=${limit}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error("Failed to load recommendations");
  return excludePosts(normalizePosts(await res.json()), preferences.excludedTmdbIds);
}

export function parseGenreIds(value: string): number[] {
  return value
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}
