export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type: "movie";
  popularity: number;
  original_language: string;
}

export interface TmdbTv {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type: "tv";
  popularity: number;
  original_language: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  media_type: "person";
  popularity: number;
}

export interface TmdbPersonCredit {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  character?: string;
  poster_path: string | null;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
}

export interface TmdbPersonDetail {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  biography: string;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  popularity?: number;
  also_known_as?: string[];
  combined_credits?: { cast: TmdbPersonCredit[]; crew: TmdbPersonCredit[] };
  external_ids?: Record<string, string | null>;
}

export type TmdbSearchResult = TmdbMovie | TmdbTv | TmdbPerson;

export interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: "YouTube";
  type: "Trailer" | "Teaser" | "Clip";
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  original_title?: string;
  original_language?: string;
  popularity?: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  runtime: number | null;
  genres: { id: number; name: string }[];
  videos: { results: TmdbVideo[] };
  credits: { cast: TmdbCastMember[] };
  recommendations: { results: TmdbMovie[] };
  "watch/providers"?: {
    results: Record<string, { flatrate?: { provider_id: number; provider_name: string; logo_path: string }[] }>;
  };
}

export interface TmdbTvDetail {
  id: number;
  name: string;
  original_name?: string;
  original_language?: string;
  popularity?: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count?: number;
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  videos: { results: TmdbVideo[] };
  credits: { cast: TmdbCastMember[] };
  recommendations: { results: TmdbTv[] };
  "watch/providers"?: {
    results: Record<string, { flatrate?: { provider_id: number; provider_name: string; logo_path: string }[] }>;
  };
}
