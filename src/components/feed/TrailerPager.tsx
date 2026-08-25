"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { TrailerCard } from "@/components/explore/TrailerCard";
import { CommentBottomSheet } from "@/components/comments/CommentBottomSheet";
import { ShareDialog } from "@/components/share/ShareDialog";
import { useInteractions } from "@/hooks/use-interactions";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
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
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const commentAnchorRef = useRef<HTMLElement | null>(null);
  const [sharePost, setSharePost] = useState<PostDto | null>(null);

  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractions(
    user?.userId
  );
  const {
    beginSession,
    endSession,
    recordReplay,
    updateMuted,
    updateLikeState,
    updateSaveState,
    updateCommentPressed,
  } = useTrailerInteractionTracker(user?.userId);

  useEffect(() => {
    loadFailedVideoKeys();
  }, []);

  const items = useMemo(
    () =>
      posts.filter((p) => p.videoKey && !isVideoKeyFailed(p.videoKey)),
    [posts]
  );

  // Locally remove failed videos (the posts prop stays immutable)
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setRemovedIds(new Set());
  }, [posts]);

  const visible = useMemo(
    () => items.filter((p) => !removedIds.has(p.postId ?? p.tmdbId)),
    [items, removedIds]
  );

  // Preserve reel position when navigating into a poster detail and back.
  useScrollRestoration(scrollRestorationKey ?? "", {
    containerRef: scrollRef,
    ready: visible.length > 0,
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const { scrollTop, clientHeight } = container;
        const snappedIndex = Math.round(scrollTop / clientHeight);
        if (
          snappedIndex !== activeIndex &&
          snappedIndex >= 0 &&
          snappedIndex < items.length
        ) {
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

  useEffect(() => {
    if (hasMore && !loadingMore && visible.length - activeIndex - 1 <= 5) {
      onNearEnd?.();
    }
  }, [visible.length, activeIndex, hasMore, loadingMore, onNearEnd]);

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

  const handleVideoError = useCallback(
    (post: PostDto, reason: string) => {
      const videoKey = post.videoKey;
      if (videoKey) {
        reportVideoKeyFailed(videoKey, reason);
      }
      const id = post.postId ?? post.tmdbId;
      const idx = visible.findIndex((p) => (p.postId ?? p.tmdbId) === id);
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      if (idx >= 0 && visible.length > 1) {
        const clamped = Math.min(idx, visible.length - 2);
        setActiveIndex(clamped);
        requestAnimationFrame(() => scrollToIndex(clamped));
      }
    },
    [visible, scrollToIndex]
  );

  if (visible.length === 0) {
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
          "w-full h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory snap-scroll"
        }
        style={{ scrollBehavior: "auto", overscrollBehavior: "contain" }}
      >
        {visible.map((post, index) => {
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
