import { apiClient } from "@/lib/api-client";
import type {
  TitleTrackingDto,
  TitleTrackingKey,
  TitleTrackingMutationInput,
  TitleTrackingPageResponse,
  TitleTrackingRawDto,
  TitleTrackingStatusPage,
  TrackCandidate,
  TrackingMediaType,
  ViewingStatus,
} from "@/types/title-tracking";
import type { PostDto } from "@/types/post";

const TRACKING_PATH = "/api/title-tracking";

function positiveInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

function normalizeMediaType(value: unknown): TrackingMediaType {
  return typeof value === "string" && value.toLowerCase() === "tv" ? "tv" : "movie";
}

function normalizeStatus(value: unknown): ViewingStatus {
  return value === "watching" || value === "watched" || value === "want"
    ? value
    : "want";
}

function normalizeRating(value: unknown): number | null {
  const parsed = positiveInt(value);
  return parsed !== null && parsed <= 5 ? parsed : null;
}

export function normalizeTitleTrackingDto(
  raw: TitleTrackingRawDto
): TitleTrackingDto | null {
  const tmdbId = positiveInt(raw.tmdbId ?? raw.tmdb_id);
  if (tmdbId === null) return null;
  const mediaType = normalizeMediaType(raw.mediaType ?? raw.media_type);
  const status = normalizeStatus(raw.status);
  const lastSeason = positiveInt(raw.lastSeason ?? raw.last_season);
  const lastEpisode = positiveInt(raw.lastEpisode ?? raw.last_episode);
  const validProgress =
    mediaType === "tv" && status === "watching" && !!lastSeason && !!lastEpisode;

  return {
    tmdbId,
    mediaType,
    status,
    rating: status === "watched" ? normalizeRating(raw.rating ?? raw.userRating ?? raw.user_rating) : null,
    note: typeof raw.note === "string" ? raw.note.slice(0, 500) : null,
    lastSeason: validProgress ? lastSeason : null,
    lastEpisode: validProgress ? lastEpisode : null,
    updatedAt: positiveInt(raw.updatedAt ?? raw.updated_at),
    title: typeof raw.title === "string" ? raw.title : null,
    posterPath: typeof (raw.posterPath ?? raw.poster_path) === "string" ? (raw.posterPath ?? raw.poster_path) as string : null,
    backdropPath: typeof (raw.backdropPath ?? raw.backdrop_path) === "string" ? (raw.backdropPath ?? raw.backdrop_path) as string : null,
    overview: typeof raw.overview === "string" ? raw.overview : null,
    releaseYear: positiveInt(raw.releaseYear ?? raw.release_year),
  };
}

export function normalizeTitleTrackingPage(
  raw: TitleTrackingPageResponse
): TitleTrackingStatusPage {
  const items = raw.items ?? raw.content ?? raw.results ?? raw.posts ?? [];
  const totalCount = positiveInt(
    raw.totalCount ?? raw.total_count ?? raw.total ?? raw.count
  );
  return {
    items: items
      .map(normalizeTitleTrackingDto)
      .filter((entry): entry is TitleTrackingDto => entry !== null),
    hasMore: raw.hasMore ?? raw.has_more ?? false,
    nextPage: positiveInt(raw.nextPage ?? raw.next_page),
    totalCount: totalCount ?? items.length,
  };
}

export function formatTrackingProgress(entry: TitleTrackingDto | null | undefined): string | null {
  if (!entry || entry.mediaType !== "tv" || entry.status !== "watching") return null;
  if (!entry.lastSeason || !entry.lastEpisode) return null;
  return `S${entry.lastSeason} E${entry.lastEpisode}`;
}

export function toTrackingKey(value: {
  tmdbId: number;
  mediaType: string;
}): TitleTrackingKey {
  return { tmdbId: value.tmdbId, mediaType: normalizeMediaType(value.mediaType) };
}

export function candidateFromPost(post: PostDto): TrackCandidate {
  const releaseYear = post.releaseDate ? Number(post.releaseDate.split("-")[0]) : NaN;
  return {
    tmdbId: post.tmdbId,
    mediaType: normalizeMediaType(post.type),
    title: post.title,
    posterPath: post.posterPath,
    overview: post.overview,
    releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
    postId: post.postId,
  };
}

export async function getTracking(
  userId: number | undefined,
  status: ViewingStatus,
  page = 0,
  pageSize = 20
): Promise<TitleTrackingStatusPage> {
  void userId;
  const params = new URLSearchParams({
    status,
    page: String(page),
    pageSize: String(pageSize),
  });
  const raw = await apiClient<TitleTrackingPageResponse>(
    `${TRACKING_PATH}?${params}`
  );
  return normalizeTitleTrackingPage(raw ?? {});
}

export async function batchGetTracking(
  keys: TitleTrackingKey[]
): Promise<TitleTrackingDto[]> {
  if (keys.length === 0) return [];
  const normalizedKeys = keys.map(toTrackingKey);
  const raw = await apiClient<unknown>(`${TRACKING_PATH}/batch`, {
    method: "POST",
    body: JSON.stringify({ keys: normalizedKeys }),
  });

  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeTitleTrackingDto(item as TitleTrackingRawDto))
      .filter((entry): entry is TitleTrackingDto => entry !== null);
  }
  if (raw && typeof raw === "object") {
    const record = raw as TitleTrackingPageResponse;
    const items = record.items ?? record.content ?? record.results ?? record.posts ?? [];
    return items
      .map(normalizeTitleTrackingDto)
      .filter((entry): entry is TitleTrackingDto => entry !== null);
  }
  return [];
}

export async function upsertTracking(
  input: TitleTrackingMutationInput
): Promise<TitleTrackingDto | null> {
  const key = toTrackingKey(input);
  const body = {
    tmdbId: key.tmdbId,
    mediaType: key.mediaType,
    status: normalizeStatus(input.status),
    rating: input.status === "watched" ? normalizeRating(input.rating) : null,
    note: typeof input.note === "string" ? input.note.slice(0, 500) : null,
    lastSeason:
      key.mediaType === "tv" && input.status === "watching"
        ? positiveInt(input.lastSeason)
        : null,
    lastEpisode:
      key.mediaType === "tv" && input.status === "watching"
        ? positiveInt(input.lastEpisode)
        : null,
  };
  const raw = await apiClient<TitleTrackingRawDto>(TRACKING_PATH, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return raw ? normalizeTitleTrackingDto(raw) : null;
}

export async function clearTracking(key: TitleTrackingKey): Promise<void> {
  const normalized = toTrackingKey(key);
  await apiClient(
    `${TRACKING_PATH}/${normalized.tmdbId}/${normalized.mediaType}`,
    { method: "DELETE" }
  );
}
