"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  X,
  Loader2,
  Share2,
  Heart,
  Bookmark,
} from "lucide-react";
import { getMovieDetail, getTvDetail, tmdbImage } from "@/lib/tmdb";
import { getLanguageRegion } from "@/lib/locale";
import { decodeHtmlEntities } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { userAvatarUrl } from "@/lib/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useComments } from "@/hooks/use-comments";
import { RatingDisplay } from "@/components/post/RatingDisplay";
import { PosterActions } from "@/components/post/PosterActions";
import { InfoCard } from "@/components/post/InfoCard";
import { WatchProviders } from "@/components/post/WatchProviders";
import { OverviewCard } from "@/components/post/OverviewCard";
import { CastList } from "@/components/post/CastList";
import { RecommendationsSection } from "@/components/post/RecommendationsSection";
import { CommentBottomSheet } from "@/components/comments/CommentBottomSheet";
import { AddToListSheet } from "@/components/watchlist/AddToListSheet";
import type { AddWatchlistItemRequest } from "@/types/watchlist";
import type { TmdbMovieDetail, TmdbTvDetail } from "@/types/tmdb";

type MediaDetail = TmdbMovieDetail & {
  name?: string;
  first_air_date?: string;
  episode_run_time?: number[];
  last_air_date?: string;
  status?: string;
  in_production?: boolean;
  next_episode_to_air?: {
    season_number: number;
    episode_number: number;
    name: string;
  } | null;
  number_of_episodes?: number;
  number_of_seasons?: number;
  origin_country?: string[];
  production_companies?: { name: string }[];
  original_language?: string;
  vote_count?: number;
};

function selectBestVideoKey(
  videos?: { results: { key: string; site: string; type: string; is_official?: boolean }[] }
): string | null {
  if (!videos?.results?.length) return null;
  const typePriority: Record<string, number> = {
    Trailer: 1,
    Teaser: 2,
    Clip: 3,
    Featurette: 4,
    "Behind the Scenes": 5,
  };
  const youtube = videos.results.filter((v) => v.site === "YouTube");
  const sorted = youtube.sort((a, b) => {
    const pa = typePriority[a.type] ?? 99;
    const pb = typePriority[b.type] ?? 99;
    if (pa !== pb) return pa - pb;
    return 0;
  });
  return sorted[0]?.key ?? null;
}

function formatRuntime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes} min`;
}

function getRegionProviders(detail: MediaDetail, region: string) {
  const watchProviders = detail["watch/providers"]?.results?.[region];
  return watchProviders || undefined;
}

/**
 * Shared poster-detail body used by both the full page (`/post/[id]`) and the
 * intercepting modal (`@modal/(.)post/[id]`). It owns its own data loading and
 * renders the poster grid, info, cast, recommendations and comments — but NOT
 * the surrounding chrome (top bar / modal close), which each surface supplies.
 */
export function PosterDetailContent() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const id = Number(params.id);
  const languageRegion = getLanguageRegion(user);
  const [language, region] = languageRegion.split("-");
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type");
  const explicitIsMovie: boolean | null =
    urlType === "tv" ? false : urlType === "movie" ? true : null;
  const commentIdParam = searchParams.get("commentId");
  const highlightCommentIds = useMemo(() => {
    if (!commentIdParam) return [];
    return commentIdParam
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v) && v > 0);
  }, [commentIdParam]);

  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [isMovie, setIsMovie] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);

  const {
    comments,
    isLoading: commentsLoading,
    postComment,
    deleteComment,
  } = useComments(id);

  useEffect(() => {
    if (highlightCommentIds.length > 0) setShowComments(true);
  }, [highlightCommentIds]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const wantMovie = explicitIsMovie ?? true;
        let data: MediaDetail;
        let isMovieFlag: boolean;
        try {
          if (wantMovie) {
            data = await getMovieDetail(id, languageRegion);
          } else {
            data = (await getTvDetail(id, languageRegion)) as unknown as MediaDetail;
          }
          isMovieFlag = wantMovie;
        } catch {
          if (explicitIsMovie === null) throw new Error("not found");
          if (wantMovie) {
            data = (await getTvDetail(id, languageRegion)) as unknown as MediaDetail;
          } else {
            data = await getMovieDetail(id, languageRegion);
          }
          isMovieFlag = !wantMovie;
        }
        setMedia(data);
        setIsMovie(isMovieFlag);
      } catch {
        setError("Failed to load details");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, explicitIsMovie, languageRegion]);

  const createdPostIdRef = useRef<number | null>(null);

  // Creates a post/trailer for this media once (reused for both "View as Post"
  // and "Watch Trailer"), returning its id so the caller can open it.
  const ensurePost = useCallback(async (): Promise<number | null> => {
    if (createdPostIdRef.current != null) return createdPostIdRef.current;
    const videoKey = selectBestVideoKey(media?.videos);
    if (!videoKey || !media) return null;
    const title = isMovie
      ? (media as TmdbMovieDetail)?.title
      : (media as unknown as TmdbTvDetail)?.name || "";

    // Provider IDs for this region come from the TMDB watch/providers we already
    // fetched (flatrate / rent / buy). Falls back to "" when none are available,
    // matching the mobile app's behaviour.
    type WatchProviderEntry = { provider_id: number };
    const regionProviders = media["watch/providers"]?.results?.[region] as
      | { flatrate?: WatchProviderEntry[]; rent?: WatchProviderEntry[]; buy?: WatchProviderEntry[] }
      | undefined;
    const providerIds = regionProviders
      ? [
          ...(regionProviders.flatrate ?? []),
          ...(regionProviders.rent ?? []),
          ...(regionProviders.buy ?? []),
        ]
          .map((p) => p.provider_id)
          .join(",")
      : "";

    setIsCreatingPost(true);
    try {
      const res = await apiClient<{ postId?: number; id?: number }>(
        `/api/posts/${isMovie ? "movie" : "tv"}/${languageRegion}/${providerIds}/${language}`,
        {
          method: "POST",
          body: JSON.stringify({
            postId: null,
            tmdbId: id,
            type: isMovie ? "movie" : "tv",
            title,
            releaseDate:
              (media as TmdbMovieDetail).release_date ??
              (media as unknown as TmdbTvDetail).first_air_date ??
              null,
            overview: media.overview ?? null,
            posterPath: media.poster_path ?? null,
            voteAverage: media.vote_average ?? 0,
            voteCount: media.vote_count ?? 0,
            originalLanguage: media.original_language ?? null,
            originalTitle:
              (media as TmdbMovieDetail).original_title ??
              (media as unknown as TmdbTvDetail).original_name ??
              null,
            popularity: media.popularity ?? 0,
            genreIds: (media.genres ?? []).map((g) => g.id).join(","),
            postLikeCount: 0,
            trailerLikeCount: 0,
            videoKey,
            providerIds: [],
            runtime:
              (media as TmdbMovieDetail).runtime ??
              (media as unknown as TmdbTvDetail).episode_run_time?.[0] ??
              null,
            contentRating: null,
          }),
        }
      );
      const postId = res?.postId ?? (res as { id?: number })?.id;
      if (typeof postId === "number") {
        createdPostIdRef.current = postId;
        return postId;
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsCreatingPost(false);
    }
  }, [media, id, isMovie, languageRegion, region]);

  const handleViewAsPost = useCallback(async () => {
    // Guest mode: prompt sign-up instead of creating a post
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    const postId = await ensurePost();
    if (postId != null) router.push(`/activity/item/${postId}`);
  }, [ensurePost, router]);

  const handleWatchTrailer = useCallback(async () => {
    // Guest mode: prompt sign-up instead of creating a post
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    const postId = await ensurePost();
    if (postId != null) router.push(`/activity/item/${postId}?video=1`);
  }, [ensurePost, router]);

  const handleAddToWatchlist = useCallback(() => {
    // Guest mode: prompt sign-up instead of opening the list picker
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    setShowAddToList(true);
  }, []);

  // Guest-only gate: prompts sign-up; signed-in users pass through untouched
  const handleGuestAction = useCallback(() => {
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
    }
  }, []);

  const watchlistCandidate = useMemo<AddWatchlistItemRequest | null>(() => {
    if (!media) return null;
    const title = isMovie
      ? (media as TmdbMovieDetail)?.title
      : (media as unknown as TmdbTvDetail)?.name || "";
    const dateStr = isMovie
      ? (media as TmdbMovieDetail)?.release_date
      : (media as unknown as TmdbTvDetail)?.first_air_date;
    const parsedYear = dateStr ? parseInt(dateStr.split("-")[0], 10) : NaN;
    return {
      tmdbId: id,
      mediaType: isMovie ? "movie" : "tv",
      title,
      posterPath: media.poster_path ?? null,
      backdropPath: media.backdrop_path ?? null,
      overview: media.overview ?? null,
      releaseYear: Number.isNaN(parsedYear) ? null : parsedYear,
    };
  }, [media, id, isMovie]);

  const videoKey = selectBestVideoKey(media?.videos);
  const hasVideo = !!videoKey;

  const title = decodeHtmlEntities(
    isMovie
      ? (media as TmdbMovieDetail)?.title
      : (media as unknown as TmdbTvDetail)?.name || ""
  );

  const releaseDate = isMovie
    ? (media as TmdbMovieDetail)?.release_date
    : (media as unknown as TmdbTvDetail)?.first_air_date;

  const runtime = isMovie
    ? (media as TmdbMovieDetail)?.runtime
    : media?.episode_run_time?.[0];

  const genres = media?.genres?.map((g) => g.name) || [];
  const cast = isMovie
    ? (media as TmdbMovieDetail)?.credits?.cast
    : (media as unknown as TmdbTvDetail)?.credits?.cast;
  const recommendations = isMovie
    ? (media as TmdbMovieDetail)?.recommendations?.results
    : (media as unknown as TmdbTvDetail)?.recommendations?.results;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="aspect-video rounded-xl bg-muted animate-pulse" />
        <div className="h-8 bg-muted rounded w-2/3 mx-auto animate-pulse" />
        <div className="h-10 bg-muted rounded w-48 mx-auto animate-pulse" />
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">{error || "Post not found"}</p>
        <button onClick={() => router.back()} className="btn-primary inline-flex">
          Go Back
        </button>
      </div>
    );
  }

  const regionProviders = getRegionProviders(media, region);

  return (
    <div className="space-y-10">
      {/* Product layout: photo left, info right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: photo (poster) */}
        <div className="order-1">
          {media.poster_path && (
            <div className="w-full lg:sticky lg:top-4">
              <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden">
                <Image
                  src={tmdbImage(media.poster_path, "w500")}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: info */}
        <div className="space-y-6 order-2">
          <h1 className="text-2xl sm:text-3xl font-bold px-1">{title}</h1>

          <RatingDisplay
            voteAverage={media.vote_average}
            voteCount={media.vote_count}
          />

          <PosterActions
            isLoading={isCreatingPost}
            hasVideo={hasVideo}
            onViewAsPost={handleViewAsPost}
            onWatchTrailer={handleWatchTrailer}
            onAddToWatchlist={handleAddToWatchlist}
          />

          <InfoCard
            rows={[
              ...(releaseDate
                ? [{ label: "Release Date:", value: releaseDate }]
                : []),
              ...(runtime
                ? [{ label: "Runtime:", value: formatRuntime(runtime) }]
                : []),
              ...(genres.length > 0
                ? [{ label: "Genres:", value: genres.join(", ") }]
                : []),
              ...((media as MediaDetail).origin_country?.length
                ? [
                    {
                      label: "Countries:",
                      value: (media as MediaDetail).origin_country!.join(", "),
                    },
                  ]
                : []),
              ...((media as MediaDetail).production_companies?.length
                ? [
                    {
                      label: "Production:",
                      value: (media as MediaDetail)
                        .production_companies!.map((c) => c.name)
                        .join(", "),
                    },
                  ]
                : []),
            ]}
          />

          <WatchProviders regionProviders={regionProviders} />

          <OverviewCard overview={media.overview} />

          {/* Share / Like / Save row */}
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <button onClick={handleGuestAction} className="btn-outline flex-1 h-10 gap-2">
              <Heart className="h-4 w-4" />
              Like
            </button>
            <button onClick={handleGuestAction} className="btn-outline flex-1 h-10 gap-2">
              <Bookmark className="h-4 w-4" />
              Save
            </button>
            <button onClick={handleGuestAction} className="btn-outline h-10 w-10 p-0">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cast */}
      {cast && cast.length > 0 && <CastList cast={cast.slice(0, 15)} />}

      {/* Recommendations */}
      {recommendations && (
        <RecommendationsSection
          recommendations={recommendations.slice(0, 10)}
          onRecommendationClick={(recId) => {
            router.push(`/post/${recId}?type=${isMovie ? "movie" : "tv"}`);
          }}
        />
      )}

      {/* Comments */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Comments ({comments.length})</h3>
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-primary hover:underline"
          >
            View all
          </button>
        </div>
        {commentsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-3">
            {comments.slice(0, 3).map((comment) => (
              <div key={comment.commentId} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full shrink-0 overflow-hidden">
                  <img
                    src={userAvatarUrl(comment.userId, 64)}
                    alt={comment.username}
                    className="h-8 w-8 rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{comment.username}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            {comments.length > 3 && (
              <button
                onClick={() => setShowComments(true)}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                View all {comments.length} comments
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comment bottom sheet */}
      {showComments && (
        <CommentBottomSheet
          postId={id}
          onClose={() => setShowComments(false)}
          highlightCommentIds={highlightCommentIds}
        />
      )}

      {/* Add to watchlist bottom sheet */}
      {showAddToList && watchlistCandidate && (
        <AddToListSheet
          candidate={watchlistCandidate}
          onClose={() => setShowAddToList(false)}
          onManageLists={() => {
            setShowAddToList(false);
            router.push("/watchlists");
          }}
        />
      )}
    </div>
  );
}
