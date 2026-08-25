import type {
  TmdbSearchResponse,
  TmdbMovieDetail,
  TmdbTvDetail,
  TmdbPersonDetail,
} from "@/types/tmdb";

const TMDB_BASE = "/api/tmdb";

async function tmdbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export async function searchMulti(
  query: string,
  page = 1,
  language = "en"
): Promise<TmdbSearchResponse> {
  return tmdbFetch("/search/multi", {
    query,
    page: String(page),
    language,
    search_type: "phrase",
  });
}

export async function getMovieDetail(
  id: number,
  language = "en-US"
): Promise<TmdbMovieDetail> {
  const [detail, watchProviders] = await Promise.all([
    tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, {
      append_to_response: "videos,credits,recommendations",
      language,
    }),
    tmdbFetch<{ results?: Record<string, unknown> }>(
      `/movie/${id}/watch/providers`,
      { language }
    ).catch(() => null),
  ]);
  return { ...detail, "watch/providers": watchProviders } as TmdbMovieDetail;
}

export async function getTvDetail(
  id: number,
  language = "en-US"
): Promise<TmdbTvDetail> {
  const [detail, watchProviders] = await Promise.all([
    tmdbFetch<TmdbTvDetail>(`/tv/${id}`, {
      append_to_response: "videos,credits,recommendations",
      language,
    }),
    tmdbFetch<{ results?: Record<string, unknown> }>(
      `/tv/${id}/watch/providers`,
      { language }
    ).catch(() => null),
  ]);
  return { ...detail, "watch/providers": watchProviders } as TmdbTvDetail;
}

export async function getPersonDetail(
  id: number,
  language = "en-US"
): Promise<TmdbPersonDetail> {
  return tmdbFetch<TmdbPersonDetail>(`/person/${id}`, {
    append_to_response: "combined_credits,images,external_ids",
    language,
  });
}

export async function discoverMovies(
  page = 1,
  sort = "popularity.desc"
): Promise<TmdbSearchResponse> {
  return tmdbFetch("/discover/movie", { page: String(page), sort_by: sort });
}

/** Trending movies & TV (people filtered out by callers). */
export async function getTrending(page = 1): Promise<TmdbSearchResponse> {
  return tmdbFetch("/trending/all/day", { page: String(page) });
}

export async function discoverTv(
  page = 1,
  sort = "popularity.desc"
): Promise<TmdbSearchResponse> {
  return tmdbFetch("/discover/tv", { page: String(page), sort_by: sort });
}

export function tmdbImage(
  path: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500"
): string {
  if (!path) return "/images/placeholder.png";
  return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/${size}${path}`;
}
