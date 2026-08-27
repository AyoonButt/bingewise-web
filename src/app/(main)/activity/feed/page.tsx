"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Clapperboard, Film, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  useUserActivity,
  type ActivityContentType,
  type ActivityInteractionType,
} from "@/hooks/use-user-activity";
import { useInteractions } from "@/hooks/use-interactions";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { PostCard } from "@/components/feed/PostCard";
import { TrailerPager } from "@/components/feed/TrailerPager";

function feedTitle(
  interactionType: ActivityInteractionType,
  contentType: ActivityContentType
): string {
  const label =
    interactionType === "LIKED"
      ? "Liked"
      : interactionType === "SAVED"
        ? "Saved"
        : "";
  const content = contentType === "VIDEOS" ? "Trailers" : "Posts";
  return label ? `${label} ${content}` : content;
}

function InteractionsFeedInner() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const rawType = searchParams.get("type");
  const interactionType: ActivityInteractionType =
    rawType === "SAVED" ? "SAVED" : "LIKED";
  const contentType: ActivityContentType =
    searchParams.get("contentType") === "VIDEOS" ? "VIDEOS" : "POSTS";
  const focusPostId = Number(searchParams.get("postId")) || null;

  const {
    items,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    hasLoadedOnce,
    loadNextPage,
  } = useUserActivity(interactionType, contentType);

  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractions(
    user?.userId
  );

  // Preserve scroll when navigating into a poster detail and back. The VIDEOS
  // branch (TrailerPager) restores its own reel, so only cover the POSTS list
  // here using a key that is empty (→ no-op) for VIDEOS.
  useScrollRestoration(
    contentType === "VIDEOS" ? "" : `/activity/feed:${interactionType}:${contentType}`,
    { ready: items.length > 0 }
  );

  // Move the tapped item to the top, like the mobile interactions feed
  const displayItems = useMemo(() => {
    if (!focusPostId || items.length === 0) return items;
    const index = items.findIndex((p) => p.postId === focusPostId);
    if (index <= 0) return items;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    return next;
  }, [items, focusPostId]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNextPage();
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadNextPage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/activity"
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight brand-gradient-text flex-1">
          {feedTitle(interactionType, contentType)}
        </h2>
      </div>

      {!hasLoadedOnce && isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error && displayItems.length === 0 ? (
        <p className="text-center py-16 text-sm text-destructive">{error}</p>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            {contentType === "VIDEOS" ? (
              <Clapperboard className="h-6 w-6 text-primary" />
            ) : (
              <Film className="h-6 w-6 text-primary" />
            )}
          </div>
          <p className="text-muted-foreground">No items to display</p>
        </div>
      ) : contentType === "VIDEOS" ? (
        <TrailerPager
          posts={displayItems}
          loadingMore={isLoadingMore}
          hasMore={hasMore}
          onNearEnd={loadNextPage}
          scrollRestorationKey={
            contentType === "VIDEOS"
              ? `/activity/feed:${interactionType}:${contentType}`
              : ""
          }
          endMessage={
            hasMore
              ? ""
              : `You've reached the end of your ${feedTitle(interactionType, contentType).toLowerCase()}`
          }
          className="w-full h-[calc(100dvh-8rem-env(safe-area-inset-bottom,0px))] lg:h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory snap-scroll rounded-xl overflow-hidden"
        />
      ) : (
        <>
          <div className="max-w-md mx-auto space-y-6">
            {displayItems.map((post) => (
              <PostCard
                key={`${post.postId}_${post.tmdbId}`}
                post={post}
                isLiked={post.postId ? isLiked(post.postId) : false}
                isSaved={post.postId ? isSaved(post.postId) : false}
                onLike={() => post.postId && toggleLike(post.postId)}
                onSave={() => post.postId && toggleSave(post.postId)}
              />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {(isLoadingMore || isLoading) && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
          {!hasMore && displayItems.length > 0 && (
            <p className="text-center text-xs text-muted-foreground pb-4">
              {displayItems.length} item{displayItems.length === 1 ? "" : "s"}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function InteractionsFeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <InteractionsFeedInner />
    </Suspense>
  );
}
