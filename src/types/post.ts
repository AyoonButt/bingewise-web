export interface PostDto {
  postId: number | null;
  tmdbId: number;
  type: string;
  title: string;
  releaseDate: string | null;
  overview: string | null;
  posterPath: string | null;
  voteAverage: number;
  voteCount: number;
  originalLanguage: string | null;
  originalTitle: string | null;
  popularity: number;
  genreIds: string;
  postLikeCount: number;
  trailerLikeCount: number;
  videoKey: string;
  providerIds: number[] | null;
  runtime: number | null;
  contentRating: string | null;
}

export interface ContentResponse {
  posts: PostDto[];
  totalCount: number;
  recentCount: number;
  qualityCount: number;
  hasQualityFallback: boolean;
  contentType: string;
  nextCursor: string | null;
  hasMore: boolean;
  success: boolean;
  message: string | null;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface ProviderInfoResponse {
  providerId: number | null;
  providerName: string | null;
  logoPath: string | null;
  success: boolean;
  message: string | null;
}
