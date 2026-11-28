export type ViewingStatus = "want" | "watching" | "watched";
export type TrackingMediaType = "movie" | "tv";

export interface TitleTrackingDto {
  tmdbId: number;
  mediaType: TrackingMediaType;
  status: ViewingStatus;
  rating?: number | null;
  note?: string | null;
  lastSeason?: number | null;
  lastEpisode?: number | null;
  updatedAt?: number | null;
  title?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseYear?: number | null;
}

export interface TitleTrackingKey {
  tmdbId: number;
  mediaType: TrackingMediaType;
}

export interface TitleTrackingStatusPage {
  items: TitleTrackingDto[];
  hasMore: boolean;
  nextPage?: number | null;
  totalCount?: number;
}

export interface TitleTrackingRawDto {
  tmdbId?: number;
  tmdb_id?: number;
  mediaType?: string;
  media_type?: string;
  status?: string;
  rating?: number | null;
  userRating?: number | null;
  user_rating?: number | null;
  note?: string | null;
  lastSeason?: number | null;
  last_season?: number | null;
  lastEpisode?: number | null;
  last_episode?: number | null;
  updatedAt?: number | null;
  updated_at?: number | null;
  title?: string | null;
  posterPath?: string | null;
  poster_path?: string | null;
  backdropPath?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  releaseYear?: number | null;
  release_year?: number | null;
}

export interface TitleTrackingPageResponse {
  items?: TitleTrackingRawDto[];
  content?: TitleTrackingRawDto[];
  results?: TitleTrackingRawDto[];
  posts?: TitleTrackingRawDto[];
  hasMore?: boolean;
  has_more?: boolean;
  nextPage?: number | null;
  next_page?: number | null;
  totalCount?: number;
  total_count?: number;
  total?: number;
  count?: number;
}

export interface TrackCandidate {
  tmdbId: number;
  mediaType: string;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseYear?: number | null;
  postId?: number | null;
}

export interface TitleTrackingMutationInput extends TitleTrackingKey {
  status: ViewingStatus;
  rating?: number | null;
  note?: string | null;
  lastSeason?: number | null;
  lastEpisode?: number | null;
}
