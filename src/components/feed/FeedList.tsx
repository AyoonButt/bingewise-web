"use client";

import { useEffect, useRef, useCallback, Fragment } from "react";
import { PostCard } from "./PostCard";
import { FeedSkeleton } from "./FeedSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Film } from "lucide-react";
import { AdUnit } from "@/components/ads/AdUnit";
import { AD_INTERVALS, isPlacementEnabled } from "@/lib/ads";
import type { PostDto } from "@/types/post";

const FEED_ADS = isPlacementEnabled("feed");

interface FeedListProps {
  posts: PostDto[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onNotInterested?: (postId: number) => void;
  isLiked: (postId: number) => boolean;
  isSaved: (postId: number) => boolean;
}

export function FeedList({
  posts,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  loadMore,
  onLike,
  onSave,
  onNotInterested,
  isLiked,
  isSaved,
}: FeedListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            loadMore();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, loadMore]
  );

  if (isLoading) return <FeedSkeleton />;

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Film}
        title="No posts yet"
        description="Follow some users or explore movies to see posts here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts
        .filter((p) => p?.postId != null)
        .map((post, index) => {
          const pid = post.postId as number;
          return (
            <Fragment key={pid}>
              <PostCard
                post={post}
                isLiked={isLiked(pid)}
                isSaved={isSaved(pid)}
                onLike={() => onLike(pid)}
                onSave={() => onSave(pid)}
                onNotInterested={
                  onNotInterested ? () => onNotInterested(pid) : undefined
                }
                enablePosterDoubleTap
              />
              {FEED_ADS && index > 0 && index % AD_INTERVALS.feed === AD_INTERVALS.feed - 1 && (
                <AdUnit placement="feed" className="my-4" />
              )}
            </Fragment>
          );
        })}
      <div ref={sentinelCallback} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
