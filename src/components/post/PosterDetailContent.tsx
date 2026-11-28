"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { getMovieDetail, getTvDetail, tmdbImage } from "@/lib/tmdb";
import { getLanguageRegion } from "@/lib/locale";
import { decodeHtmlEntities } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { userAvatarUrl } from "@/lib/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useComments } from "@/hooks/use-comments";
import { useInteractions } from "@/hooks/use-interactions";
import { useViewDurationTracker } from "@/hooks/use-view-duration-tracker";
import { RatingDisplay } from "@/components/post/RatingDisplay";
import { PosterActions } from "@/components/post/PosterActions";
import { InfoCard } from "@/components/post/InfoCard";
import { WatchProviders } from "@/components/post/WatchProviders";
import { OverviewCard } from "@/components/post/OverviewCard";
import { CastList } from "@/components/post/CastList";
import { RecommendationsSection } from "@/components/post/RecommendationsSection";
import { CommentBottomSheet } from "@/components/comments/CommentBottomSheet";
import { ShareDialog } from "@/components/share/ShareDialog";
import { openTrackSheet } from "@/stores/tracking-sheet-store";
import { TrackingStatusRow } from "@/components/tracking/TrackingStatusRow";
import type { AddWatchlistItemRequest } from "@/types/watchlist";
import type { PostDto } from "@/types/post";
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
    name?: string;
    air_date?: string;
  } | null;
  last_episode_to_air?: {
    season_number: number;
    episode_number: number;
    name?: string;
    air_date?: string;
  } | null;
  seasons?: { season_number: number; episode_count: number; air_date?: string }[];
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
  const [showShare, setShowShare] = useState(false);
  const [creatingAction, setCreatingAction] = useState<"post" | "trailer" | null>(null);
  const [resolvedPostId, setResolvedPostId] = useState<number | null>(null);
  const [isInteractionLoading, setIsInteractionLoading] = useState(false);
  const createdPostIdRef = useRef<number | null>(null);

  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractions(
    user?.userId
  );

  const commentPostId = resolvedPostId ?? id;

  const {
    comments,
    isLoading: commentsLoading,
    postComment,
    deleteComment,
  } = useComments(commentPostId);

  // Track viewing duration for this poster detail screen (matches Android InfoDto / POST /api/info/save)
  useViewDurationTracker(id, isMovie ? "movie" : "tv");

  useEffect(() => {
    if (highlightCommentIds.length > 0) setShowComments(true);
  }, [highlightCommentIds]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setResolvedPostId(null);
      createdPostIdRef.current = null;
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

  useEffect(() => {
    if (!id || loading || !media) return;
    let cancelled = false;
    const type = isMovie ? "movie" : "tv";
    apiClient<PostDto[]>(`/api/posts/by-tmdb/${languageRegion}`, {
      method: "POST",
      body: JSON.stringify([{ tmdbId: id, type }]),
    })
      .then((posts) => {
        if (cancelled) return;
        const match = (posts ?? []).find(
          (post) =>
            post?.tmdbId === id &&
            post.type?.toLowerCase() === type &&
            typeof post.postId === "number"
        );
        if (match?.postId != null) setResolvedPostId(match.postId);
      })
      .catch(() => {
        if (!cancelled) setResolvedPostId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isMovie, languageRegion, loading, media]);

  // Creates a post/trailer for this media once (reused for both "View as Post"
  // and "Watch Trailer"), returning its id so the caller can open it.
  const ensurePost = useCallback(async (): Promise<number | null> => {
    if (createdPostIdRef.current != null) return createdPostIdRef.current;
    if (resolvedPostId != null) {
      createdPostIdRef.current = resolvedPostId;
      return resolvedPostId;
    }
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
        setResolvedPostId(postId);
        return postId;
      }
      return null;
    } catch {
      return null;
    }
  }, [media, id, isMovie, languageRegion, language, region, resolvedPostId]);

  const handleViewAsPost = useCallback(async () => {
    // Guest mode: prompt sign-up instead of creating a post
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    setCreatingAction("post");
    try {
      const postId = await ensurePost();
      if (postId != null) router.push(`/activity/item/${postId}`);
    } finally {
      setCreatingAction(null);
    }
  }, [ensurePost, router]);

  const handleWatchTrailer = useCallback(async () => {
    // Guest mode: prompt sign-up instead of creating a post
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    setCreatingAction("trailer");
    try {
      const postId = await ensurePost();
      if (postId != null) router.push(`/activity/item/${postId}?video=1`);
    } finally {
      setCreatingAction(null);
    }
  }, [ensurePost, router]);

  const resolveInteractionPostId = useCallback(async () => {
    if (resolvedPostId != null) return resolvedPostId;
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
      return null;
    }
    const postId = await ensurePost();
    if (postId != null) setResolvedPostId(postId);
    return postId;
  }, [ensurePost, resolvedPostId]);

  const handleLike = useCallback(async () => {
    setIsInteractionLoading(true);
    try {
      const postId = await resolveInteractionPostId();
      if (postId != null) toggleLike(postId);
    } catch {
      return;
    } finally {
      setIsInteractionLoading(false);
    }
  }, [resolveInteractionPostId, toggleLike]);

  const handleShare = useCallback(async () => {
    setIsInteractionLoading(true);
    try {
      const postId = await resolveInteractionPostId();
      if (postId != null) setShowShare(true);
    } catch {
      return;
    } finally {
      setIsInteractionLoading(false);
    }
  }, [resolveInteractionPostId]);

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

  const handleAddToWatchlist = useCallback(() => {
    if (!watchlistCandidate) return;
    openTrackSheet(watchlistCandidate);
  }, [watchlistCandidate]);

  const handleTrackClick = useCallback(() => {
    if (resolvedPostId != null && isSaved(resolvedPostId)) {
      toggleSave(resolvedPostId);
      return;
    }
    handleAddToWatchlist();
    if (resolvedPostId != null) {
      toggleSave(resolvedPostId);
      return;
    }
    if (user) {
      void resolveInteractionPostId()
        .then((postId) => {
          if (postId != null && !isSaved(postId)) toggleSave(postId);
        })
        .catch(() => {});
    }
  }, [
    handleAddToWatchlist,
    isSaved,
    resolveInteractionPostId,
    resolvedPostId,
    toggleSave,
    user,
  ]);

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
  // TMDB's number_of_episodes counts aired + announced episodes (and mishandles specials),
  // so for an in-progress show it overstates reality. Derive the aired count from
  // last_episode_to_air + the prior seasons' episode counts instead.
  const tvMedia = media as MediaDetail | null;
  const airedEpisodes = (() => {
    if (isMovie || !tvMedia?.last_episode_to_air) return null;
    const last = tvMedia.last_episode_to_air;
    const prior = (tvMedia.seasons ?? [])
      .filter((s) => s.season_number >= 1 && s.season_number < last.season_number)
      .reduce((sum, s) => sum + (s.episode_count ?? 0), 0);
    return prior + last.episode_number;
  })();
  const airedSeasons = isMovie
    ? null
    : (tvMedia?.seasons ?? []).filter(
        (s) => s.season_number >= 1 && !!s.air_date && new Date(s.air_date) <= new Date()
      ).length;
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
            creatingAction={creatingAction}
            hasVideo={hasVideo}
            isLiked={resolvedPostId != null && isLiked(resolvedPostId)}
            isSaved={resolvedPostId != null && isSaved(resolvedPostId)}
            isLikeLoading={isInteractionLoading}
            onViewAsPost={handleViewAsPost}
            onWatchTrailer={handleWatchTrailer}
            onLike={handleLike}
            onAddToWatchlist={handleTrackClick}
            onShare={handleShare}
          />

          {watchlistCandidate && !creatingAction && (
            <TrackingStatusRow
              candidate={watchlistCandidate}
              showEmptyState={false}
            />
          )}

          <InfoCard
            rows={[
              ...(releaseDate
                ? [{ label: "Release Date:", value: releaseDate }]
                : []),
              ...(runtime
                ? [{ label: "Runtime:", value: formatRuntime(runtime) }]
                : []),
               ...(!isMovie && airedSeasons
                 ? [
                     {
                       label: "Seasons:",
                       value: airedSeasons === (media as MediaDetail).number_of_seasons
                         ? String(airedSeasons)
                         : `${airedSeasons} aired (${(media as MediaDetail).number_of_seasons} total)`,
                     },
                   ]
                 : !isMovie && (media as MediaDetail).number_of_seasons
                   ? [
                       {
                         label: "Seasons:",
                         value: String((media as MediaDetail).number_of_seasons),
                       },
                     ]
                   : []),
               ...(!isMovie && (airedEpisodes ?? (media as MediaDetail).number_of_episodes)
                 ? [
                     {
                       label: "Episodes:",
                       value:
                         airedEpisodes != null
                           ? `${airedEpisodes} aired${(media as MediaDetail).number_of_episodes && (media as MediaDetail).number_of_episodes! > airedEpisodes ? ` (${(media as MediaDetail).number_of_episodes} total)` : ""}`
                           : String((media as MediaDetail).number_of_episodes),
                     },
                   ]
                 : []),
               ...(!isMovie && (media as MediaDetail).status
                 ? [
                     {
                       label: "Status:",
                       value: (media as MediaDetail).in_production
                         ? "Returning Series"
                         : (media as MediaDetail).last_air_date
                           ? "Ended"
                           : (media as MediaDetail).status!,
                     },
                   ]
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
                  <Image
                    src={userAvatarUrl(comment.userId, 64)}
                    alt={comment.username}
                    width={32}
                    height={32}
                    className="rounded-full"
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
          postId={commentPostId}
          onClose={() => setShowComments(false)}
          highlightCommentIds={highlightCommentIds}
        />
      )}

      {showShare && resolvedPostId != null && (
        <ShareDialog
          postId={resolvedPostId}
          postTitle={title}
          postMediaType={isMovie ? "movie" : "tv"}
          onClose={() => setShowShare(false)}
        />
      )}

    </div>
  );
}
