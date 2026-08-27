"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { TrailerCard } from "@/components/explore/TrailerCard";
import { CommentBottomSheet } from "@/components/comments/CommentBottomSheet";
import { ShareDialog } from "@/components/share/ShareDialog";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useReelHeight } from "@/hooks/use-reel-height";
import { useTrailerInteractionTracker } from "@/hooks/use-trailer-interactions";
import {
  isVideoKeyFailed,
  loadFailedVideoKeys,
  reportVideoKeyFailed,
} from "@/lib/youtube-player-pool";
import type { PostDto } from "@/types/post";

interface TrailerPagerProps {
  posts: PostDto[];
  loadingMore?: boolean;
  hasMore?: boolean;
  endMessage?: string;
  emptyMessage?: string;
  className?: string;
  onNearEnd?: () => void;
  /** When set, preserves reel position across navigation into a poster detail. */
  scrollRestorationKey?: string;
}

export function TrailerPager({
  posts,
  loadingMore = false,
  hasMore = false,
  endMessage = "You're all caught up",
  emptyMessage = "No trailers to show.",
  className,
  onNearEnd,
  scrollRestorationKey,
}: TrailerPagerProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const reelHeight = useReelHeight(scrollRef);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const commentAnchorRef = useRef<HTMLElement | null>(null);
  const [sharePost, setSharePost] = useState<PostDto | null>(null);

  const [likedTrailerIds, setLikedTrailerIds] = useState<Set<number>>(new Set());
  const [savedTrailerIds, setSavedTrailerIds] = useState<Set<number>>(new Set());

  // Populate initial liked/saved trailer states for this user
  const userId = user?.userId;
  const { data: userLikedIds } = useQuery({
    queryKey: ["likedPosts", userId],
    queryFn: () => apiClient<number[]>(`/api/interactions/liked/user/${userId}`),
    enabled: !!userId,
  });

  const { data: userSavedIds } = useQuery({
    queryKey: ["savedPosts", userId],
    queryFn: () => apiClient<number[]>(`/api/interactions/saved/user/${userId}`),
    enabled: !!userId,
  });

  useEffect(() => {
    if (userLikedIds) {
      setLikedTrailerIds((prev) => {
        const next = new Set(prev);
        for (const id of userLikedIds) next.add(id);
        return next;
      });
    }
  }, [userLikedIds]);

  useEffect(() => {
    if (userSavedIds) {
      setSavedTrailerIds((prev) => {
        const next = new Set(prev);
        for (const id of userSavedIds) next.add(id);
        return next;
      });
    }
  }, [userSavedIds]);

  const {
    beginSession,
    endSession,
    updateMuted,
    updateLikeState,
    updateSaveState,
    updateCommentPressed,
  } = useTrailerInteractionTracker(userId);

  useEffect(() => {
    loadFailedVideoKeys();
  }, []);

  const items = useMemo(
    () =>
      posts.filter((p) => p.videoKey && !isVideoKeyFailed(p.videoKey)),
    [posts]
  );

  const visibleRef = useRef(items);
  visibleRef.current = items;

  // Preserve reel position when navigating into a poster detail and back.
  useScrollRestoration(scrollRestorationKey ?? "", {
    containerRef: scrollRef,
    ready: items.length > 0,
  });

  // Settled page gate: only the exact settled page is active.
  // settledPage only updates 150ms after scrolling stops, preventing
  // snap-animation jitter from flipping activeIndex (matching the
  // Android app's allowVideoPlayer = !isScrolling && page == settledPage).
  const [settledIndex, setSettledIndex] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const { scrollTop, clientHeight } = container;
        const raw = scrollTop / clientHeight;
        const snappedIndex = Math.round(raw);

        // Debounce: only commit after scrolling has stopped for 150ms.
        // This prevents snap-animation oscillation from rapidly flipping
        // activeIndex and causing acquire/release cascades on the pool.
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          if (
            snappedIndex >= 0 &&
            snappedIndex < items.length &&
            Math.abs(raw - snappedIndex) < 0.25
          ) {
            setSettledIndex(snappedIndex);
            setActiveIndex(snappedIndex);
          }
        }, 150);
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [items.length]);

  const activeId = useMemo(() => {
    const post = items[activeIndex];
    return post ? (post.postId ?? post.tmdbId) : null;
  }, [items, activeIndex]);

  useEffect(() => {
    if (activeId == null) endSession();
  }, [activeId, endSession]);

  useEffect(() => {
    if (hasMore && !loadingMore && items.length - activeIndex - 1 <= 5) {
      onNearEnd?.();
    }
  }, [items.length, activeIndex, hasMore, loadingMore, onNearEnd]);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: index * container.clientHeight,
      behavior: "smooth",
    });
  }, []);

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
      setLikedTrailerIds((ids) => {
        const next = new Set(ids);
        const liked = !next.has(postId);
        if (liked) next.add(postId);
        else next.delete(postId);
        updateLikeState(liked);
        return next;
      });
    },
    [user, updateLikeState]
  );

  const handleSaveClick = useCallback(
    (post: PostDto) => {
      const postId = post.postId;
      if (!postId || !user) return;
      setSavedTrailerIds((ids) => {
        const next = new Set(ids);
        const saved = !next.has(postId);
        if (saved) next.add(postId);
        else next.delete(postId);
        updateSaveState(saved);
        return next;
      });
    },
    [user, updateSaveState]
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

  // Match mobile app: report the failed key but do NOT remove the video
  // or advance to the next one. The card sets videoFailed=true which
  // makes canPlay=false, so the player won't be acquired. The video
  // stays visible as a poster — the user scrolls manually. This
  // completely eliminates the error→remove→recompose→error cascade.
  const handleVideoError = useCallback(
    (post: PostDto, reason: string) => {
      const videoKey = post.videoKey;
      if (videoKey) {
        reportVideoKeyFailed(videoKey, reason);
      }
    },
    []
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={
          className ??
          "w-full h-[calc(100dvh-8rem-env(safe-area-inset-bottom,0px))] lg:h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory snap-scroll"
        }
        style={{
          scrollBehavior: "auto",
          overscrollBehavior: "contain",
          height: reelHeight ?? undefined,
        }}
      >
        {items.map((post, index) => {
          const id = post.postId ?? post.tmdbId;
          const isActive = index === activeIndex;
          return (
            <div
              key={id}
              className="snap-start snap-always snap-stop-always w-full h-full flex items-center justify-center"
            >
              <TrailerCard
                post={post}
                active={isActive}
                muted={muted}
                playerContainerRef={scrollRef}
                isLiked={post.postId ? likedTrailerIds.has(post.postId) : false}
                isSaved={post.postId ? savedTrailerIds.has(post.postId) : false}
                onToggleMute={handleToggleMute}
                onStarted={handleStarted}
                onMutedChange={updateMuted}
                onLikeClick={() => handleLikeClick(post)}
                onSaveClick={() => handleSaveClick(post)}
                onCommentClick={(anchor) => handleCommentClick(post, anchor)}
                onInfoClick={() => handleInfoClick(post)}
                onShareClick={() => setSharePost(post)}
                onError={(reason) => handleVideoError(post, reason)}
              />
            </div>
          );
        })}
        {loadingMore && (
          <div className="snap-start snap-always snap-stop-always w-full h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasMore && !loadingMore && (
          <div className="snap-start snap-always snap-stop-always w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            {endMessage}
          </div>
        )}
      </div>

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
    </>
  );
}
