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
    recordReplay,
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
        const data = await apiClient<PostDto[] | ContentResponse>(
          `/api/recommendations/${userId}/${language}?${params.toString()}`
        );
        if (Array.isArray(data)) {
          return {
            posts: data,
            totalCount: data.length,
            nextCursor: null,
            hasMore: false,
            success: true,
          } as ContentResponse;
        }
        return data;
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
        nextCursor: null,
        hasMore: false,
        success: true,
      } as ContentResponse;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
  });

  useEffect(() => {
    loadFailedVideoKeys();
  }, []);

  const items = useMemo(() => {
    void removedVersion;
    const seen = new Set<number>();
    const result: PostDto[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const post of page?.posts ?? []) {
        const id = post.postId ?? post.tmdbId;
        if (!post.videoKey || isVideoKeyFailed(post.videoKey)) continue;
        if (seen.has(id) || removedIdsRef.current.has(id)) continue;
        seen.add(id);
        result.push(post);
      }
    }
    return result;
  }, [query.data, removedVersion]);

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

  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage && items.length - activeIndex - 1 <= 5) {
      loadMore();
    }
  }, [items.length, activeIndex, query.hasNextPage, query.isFetchingNextPage, loadMore]);

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
      const id = post.postId ?? post.tmdbId;
      removedIdsRef.current.add(id);
      setRemovedVersion((v) => v + 1);
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
                onReplay={recordReplay}
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
