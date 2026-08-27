"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { TrailerCard } from "./TrailerCard";
import { AdUnit } from "@/components/ads/AdUnit";
import { AD_INTERVALS, isPlacementEnabled } from "@/lib/ads";
import { CommentBottomSheet } from "@/components/comments/CommentBottomSheet";
import { ShareDialog } from "@/components/share/ShareDialog";
import { useInteractions } from "@/hooks/use-interactions";
import { useTrailerInteractionTracker } from "@/hooks/use-trailer-interactions";
import {
  isVideoKeyFailed,
  loadFailedVideoKeys,
  reportVideoKeyFailed,
} from "@/lib/youtube-player-pool";
import { getLanguageRegion } from "@/lib/locale";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import type { ContentResponse, PostDto } from "@/types/post";

export function TrailerFeed() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const language = getLanguageRegion(user);
  const region = language.split("-")[1] ?? "US";
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const EXPLORE_ADS = isPlacementEnabled("explore");

  // Videos that failed to play are hidden for the rest of the session.
  const removedIdsRef = useRef<Set<number>>(new Set());
  const [removedVersion, setRemovedVersion] = useState(0);

  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const commentAnchorRef = useRef<HTMLElement | null>(null);
  const [sharePost, setSharePost] = useState<PostDto | null>(null);

  const {
    isLiked,
    isSaved,
    toggleLike,
    toggleSave,
  } = useInteractions(userId);

  const {
    beginSession,
    endSession,
    updateMuted,
    updateLikeState,
    updateSaveState,
    updateCommentPressed,
  } = useTrailerInteractionTracker(userId);

  const query = useInfiniteQuery({
    queryKey: ["trailers", userId, language],
    queryFn: async ({ pageParam }): Promise<ContentResponse> => {
      const cursor = pageParam as string | null;
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);

      if (userId) {
        return await apiClient<ContentResponse>(
          `/api/recommendations/${userId}/${language}?${params.toString()}`
        );
      }

      // Guest mode: same endpoint the mobile app uses (unauthenticated).
      const [lang] = language.split("-");
      const guestPosts = await fetch(
        `/api/guest/recommendations?language=${lang}&region=${region}&contentType=trailers&limit=15`
      ).then((r) => {
        if (!r.ok) throw new Error(`Guest trailers error: ${r.status}`);
        return r.json();
      });
      const posts: PostDto[] = Array.isArray(guestPosts) ? guestPosts : [];
      return {
        posts,
        totalCount: posts.length,
        recentCount: posts.length,
        qualityCount: 0,
        hasQualityFallback: false,
        contentType: "recommendations",
        nextCursor: null,
        hasMore: false,
      } as ContentResponse;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore && lastPage?.nextCursor ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
  });

  useEffect(() => {
    loadFailedVideoKeys();
  }, []);

  // Raw (failure-independent) list — drives pagination/load-more decisions so a
  // video failing can never shrink the count that triggers the next fetch.
  const rawPosts = useMemo(
    () => query.data?.pages.flatMap((p) => p?.posts ?? []) ?? [],
    [query.data]
  );

  // Clean dedup + filter: exclude failed videos + already-removed (not-interested) items.
  // When items runs low, the useEffect below loads more from the infinite query.
  const items = useMemo(() => {
    void removedVersion;
    const seen = new Set<number>();
    const result: PostDto[] = [];
    for (const post of rawPosts) {
      const id = post.postId ?? post.tmdbId;
      if (!post.videoKey || isVideoKeyFailed(post.videoKey)) continue;
      if (seen.has(id) || removedIdsRef.current.has(id)) continue;
      seen.add(id);
      result.push(post);
    }
    return result;
  }, [rawPosts, removedVersion]);

  // Preserve reel position when navigating into a poster detail and back.
  useScrollRestoration("/explore", {
    containerRef: scrollRef,
    ready: items.length > 0,
  });

  const loading = query.isLoading && items.length === 0;

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const refresh = useCallback(async () => {
    removedIdsRef.current = new Set();
    await query.refetch();
    setActiveIndex(0);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
  }, [query]);

  const ptr = usePullToRefresh({
    onRefresh: refresh,
    scrollRef,
    refreshing: query.isFetching && items.length > 0,
  });

  // Re-tapping the Explore nav icon while already here refreshes the deck.
  const contentRefreshSignal = useUiStore((s) => s.contentRefreshSignal);
  useEffect(() => {
    if (contentRefreshSignal === 0) return;
    refresh();
  }, [contentRefreshSignal, refresh]);

  // Index of the active item within the RAW list (not the filtered `items`),
  // so prefetch proximity is measured against content that actually loaded.
  const activeRawIndex = useMemo(() => {
    const post = items[activeIndex];
    const id = post ? (post.postId ?? post.tmdbId) : null;
    if (id == null) return -1;
    return rawPosts.findIndex((p) => (p.postId ?? p.tmdbId) === id);
  }, [items, activeIndex, rawPosts]);

  // Prefetch when the user is within 5 raw items of the loaded end. Keyed on the
  // RAW length (never shrinks on video failure), so a player error can't trigger
  // the refill and can't re-arm this effect. Each fetch only grows rawPosts, so
  // the threshold stops being satisfied after one pull — no run-away fetching.
  useEffect(() => {
    if (
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      rawPosts.length - activeRawIndex - 1 <= 5
    ) {
      loadMore();
    }
  }, [rawPosts.length, activeRawIndex, query.hasNextPage, query.isFetchingNextPage, loadMore]);

  // Bounded refill when an entire page yields no playable videos (e.g. a locale
  // where most keys are broken). Caps consecutive empty fetches so a fully
  // broken region can't drain the catalog or storm the recommendations endpoint.
  const emptyStreakRef = useRef(0);
  useEffect(() => {
    if (query.isLoading) return;
    if (items.length > 0) {
      emptyStreakRef.current = 0;
      return;
    }
    if (query.hasNextPage && !query.isFetchingNextPage) {
      emptyStreakRef.current += 1;
      if (emptyStreakRef.current <= 3) loadMore();
    }
  }, [items.length, query.hasNextPage, query.isFetchingNextPage, query.isLoading, loadMore]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;
    let lockedUntil = 0;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        // Cooldown after committing an index switch: while the snap animation
        // settles (and the player swaps videos), boundary jitter must not flip
        // activeIndex back and forth — each flip releases/acquires the pooled
        // player and restarts the video, producing a runaway "next video"
        // cascade.
        const now = performance.now();
        if (now < lockedUntil) return;
        const { scrollTop, clientHeight } = container;
        const raw = scrollTop / clientHeight;
        const snappedIndex = Math.round(raw);
        // Deadband: only commit once the scroll has genuinely settled into a
        // slide (not mid-flight between two).
        if (
          snappedIndex !== activeIndex &&
          snappedIndex >= 0 &&
          snappedIndex < items.length &&
          Math.abs(raw - snappedIndex) < 0.25
        ) {
          lockedUntil = now + 400;
          setActiveIndex(snappedIndex);
        }
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [activeIndex, items.length]);

  const activeId = useMemo(() => {
    const post = items[activeIndex];
    return post ? (post.postId ?? post.tmdbId) : null;
  }, [items, activeIndex]);

  useEffect(() => {
    if (activeId == null) endSession();
  }, [activeId, endSession]);

  const handleStarted = useCallback(
    (postId: number) => {
      if (postId) beginSession(postId, muted);
    },
    [beginSession, muted]
  );

  const handleToggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      updateMuted(next);
      return next;
    });
  }, [updateMuted]);

  const handleLikeClick = useCallback(
    (post: PostDto) => {
      const postId = post.postId;
      if (!postId || !user) return;
      toggleLike(postId);
      updateLikeState(!isLiked(postId));
    },
    [toggleLike, isLiked, user, updateLikeState]
  );

  const handleSaveClick = useCallback(
    (post: PostDto) => {
      const postId = post.postId;
      if (!postId || !user) return;
      toggleSave(postId);
      updateSaveState(!isSaved(postId));
    },
    [toggleSave, isSaved, user, updateSaveState]
  );

  const handleCommentClick = useCallback(
    (post: PostDto, anchor: HTMLElement | null) => {
      const postId = post.postId;
      if (!postId || !user) return;
      updateCommentPressed(true);
      commentAnchorRef.current = anchor;
      setCommentPostId(postId);
    },
    [user, updateCommentPressed]
  );

  const handleInfoClick = useCallback(
    (post: PostDto) => {
      router.push(`/post/${post.tmdbId}?type=${post.type}`);
    },
    [router]
  );

  const handleShareClick = useCallback(
    (post: PostDto) => {
      if (!user) return;
      setSharePost(post);
    },
    [user]
  );

  const handleVideoError = useCallback(
    (post: PostDto, reason: string) => {
      const videoKey = post.videoKey;
      if (videoKey) {
        reportVideoKeyFailed(videoKey, reason);
      }
      // Match mobile app: do NOT remove the video from the feed.
      // The card sets videoFailed=true which makes canPlay=false,
      // so the player won't be acquired. The video stays visible
      // as a poster — the user scrolls manually. Removing on error
      // causes: error → removal → recomposition → new video → error cascade.
    },
    []
  );

  // "Not interested": drop the slide immediately and persist the signal for the ML pipeline.
  const handleNotInterested = useCallback((post: PostDto) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    if (post.postId == null) return;
    removedIdsRef.current.add(post.postId);
    setRemovedVersion((v) => v + 1);
    apiClient("/api/not-interested", {
      method: "POST",
      body: JSON.stringify({ userId: user.userId, postId: post.postId }),
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No trailers to show right now.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="w-full h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory snap-scroll"
      style={{ scrollBehavior: "auto", overscrollBehavior: "contain" }}
    >
      <div
        style={{
          height: ptr.pull,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          transition: ptr.isRefreshing ? "height 200ms ease" : "none",
        }}
      >
        {ptr.isRefreshing && (
          <div className="pb-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {items.map((post, index) => {
        const id = post.postId ?? post.tmdbId;
        const isActive = index === activeIndex;
        return (
          <Fragment key={id}>
            <div
              className="snap-start snap-always snap-stop-always w-full h-full flex items-center justify-center"
            >
              <TrailerCard
                post={post}
                active={isActive}
                muted={muted}
                playerContainerRef={scrollRef}
                isLiked={post.postId ? isLiked(post.postId) : false}
                isSaved={post.postId ? isSaved(post.postId) : false}
                onToggleMute={handleToggleMute}
                onStarted={handleStarted}
                onMutedChange={updateMuted}
                onLikeClick={() => handleLikeClick(post)}
                onSaveClick={() => handleSaveClick(post)}
                onCommentClick={(anchor) => handleCommentClick(post, anchor)}
                onInfoClick={() => handleInfoClick(post)}
                onShareClick={() => handleShareClick(post)}
                onNotInterested={() => handleNotInterested(post)}
                onError={(reason) => handleVideoError(post, reason)}
              />
            </div>
            {EXPLORE_ADS &&
              index > 0 &&
              index % AD_INTERVALS.explore === AD_INTERVALS.explore - 1 && (
                <div className="snap-start snap-always snap-stop-always w-full h-full flex items-center justify-center px-4">
                  <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-2">
                    <AdUnit placement="explore" minHeight={280} />
                  </div>
                </div>
              )}
          </Fragment>
        );
      })}
      {query.isFetchingNextPage && (
        <div className="snap-start snap-always snap-stop-always w-full h-full flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {!query.hasNextPage && items.length > 0 && (
        <div className="snap-start snap-always snap-stop-always w-full h-full flex items-center justify-center text-sm text-muted-foreground">
          You&rsquo;re all caught up
        </div>
      )}

      {commentPostId && (
        <CommentBottomSheet
          postId={commentPostId}
          anchorRef={commentAnchorRef}
          onClose={() => setCommentPostId(null)}
        />
      )}

      {sharePost && user && (
        <ShareDialog
          postId={sharePost.postId ?? 0}
          postTitle={sharePost.title}
          onClose={() => setSharePost(null)}
        />
      )}
    </div>
  );
}
