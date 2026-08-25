"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Bookmark,
  ChevronLeft,
  Clapperboard,
  Film,
  Heart,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  useUserActivity,
  type ActivityContentType,
  type ActivityInteractionType,
} from "@/hooks/use-user-activity";
import { tmdbImage } from "@/lib/tmdb";
import { cn, decodeHtmlEntities } from "@/lib/utils";
import type { PostDto } from "@/types/post";
import type { CommentDto } from "@/types/comment";

const INTERACTION_OPTIONS: { value: ActivityInteractionType; label: string }[] = [
  { value: "LIKED", label: "Liked" },
  { value: "SAVED", label: "Saved" },
  { value: "COMMENTED", label: "Comments" },
];

const CONTENT_OPTIONS: { value: ActivityContentType; label: string }[] = [
  { value: "POSTS", label: "Posts" },
  { value: "VIDEOS", label: "Trailers" },
];

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="card p-1 flex gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PosterGridItem({
  post,
  interactionType,
  contentType,
}: {
  post: PostDto;
  interactionType: ActivityInteractionType;
  contentType: ActivityContentType;
}) {
  return (
    <Link
      href={`/activity/feed?type=${interactionType}&contentType=${contentType}&postId=${post.postId}`}
      className="group relative aspect-square rounded-lg overflow-hidden bg-muted shadow-sm"
      title={decodeHtmlEntities(post.title)}
    >
      {post.posterPath ? (
        <Image
          src={tmdbImage(post.posterPath, "w342")}
          alt={decodeHtmlEntities(post.title)}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Film className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
    </Link>
  );
}

interface PostWithComments {
  post: PostDto;
  comments: CommentDto[];
}

function CommentedListItem({
  group,
  contentType,
}: {
  group: PostWithComments;
  contentType: ActivityContentType;
}) {
  const post = group.post;
  const allCommentIds = group.comments
    .map((c) => c.commentId)
    .filter((id): id is number => id !== null)
    .join(",");
  const itemHref = (commentIds: string) =>
    `/activity/item/${post.postId}?commentIds=${commentIds}${contentType === "VIDEOS" ? "&video=1" : ""}`;
  return (
    <div className="card overflow-hidden">
      <Link
        href={itemHref(allCommentIds)}
        className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
      >
        <div className="relative h-[60px] w-[60px] rounded-lg overflow-hidden bg-muted shrink-0">
          {post.posterPath ? (
            <Image
              src={tmdbImage(post.posterPath, "w185")}
              alt={decodeHtmlEntities(post.title)}
              fill
              className="object-cover"
              sizes="60px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-6 w-6 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <p className="font-semibold text-sm leading-snug line-clamp-2">
          {decodeHtmlEntities(post.title)}
        </p>
      </Link>
      <div className="divide-y divide-border border-t border-border">
        {group.comments.map((comment) =>
          comment.commentId !== null ? (
            <Link
              key={comment.commentId}
              href={itemHref(String(comment.commentId))}
              className="block px-3 py-2.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary">You</span>
                <span className="text-xs text-muted-foreground">
                  {comment.timestamp
                    ? formatDistanceToNow(new Date(comment.timestamp), {
                        addSuffix: true,
                      })
                    : ""}
                </span>
              </div>
              <p className="text-sm mt-0.5 line-clamp-3">
                {decodeHtmlEntities(comment.content)}
              </p>
            </Link>
          ) : null
        )}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const user = useAuthStore((s) => s.user);
  const [interactionType, setInteractionType] =
    useState<ActivityInteractionType>("LIKED");
  const [contentType, setContentType] = useState<ActivityContentType>("POSTS");

  const {
    items,
    comments,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    hasLoadedOnce,
    loadNextPage,
  } = useUserActivity(interactionType, contentType);

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
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadNextPage]);

  const groupedComments = useMemo<PostWithComments[]>(() => {
    if (interactionType !== "COMMENTED") return [];
    const postMap = new Map(items.map((p) => [p.postId, p]));
    const order: number[] = [];
    const byPost = new Map<number, CommentDto[]>();
    comments.forEach((comment) => {
      if (!byPost.has(comment.postId)) {
        byPost.set(comment.postId, []);
        order.push(comment.postId);
      }
      byPost.get(comment.postId)!.push(comment);
    });
    return order.flatMap((postId) => {
      const post = postMap.get(postId);
      const postComments = byPost.get(postId);
      return post && postComments ? [{ post, comments: postComments }] : [];
    });
  }, [interactionType, comments, items]);

  const showLoading =
    !hasLoadedOnce || (isLoading && items.length === 0 && comments.length === 0);

  const emptyMessage = (() => {
    const interactionLabel =
      interactionType === "LIKED"
        ? "liked"
        : interactionType === "SAVED"
          ? "saved"
          : "commented on";
    const contentLabel = contentType === "POSTS" ? "posts" : "trailers";
    return `No ${interactionLabel} ${contentLabel} yet`;
  })();

  const EmptyIcon =
    interactionType === "LIKED"
      ? Heart
      : interactionType === "SAVED"
        ? Bookmark
        : MessageSquare;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight brand-gradient-text flex-1">
          Your Activity
        </h2>
      </div>

      <SegmentedToggle
        options={INTERACTION_OPTIONS}
        value={interactionType}
        onChange={setInteractionType}
      />
      <SegmentedToggle
        options={CONTENT_OPTIONS}
        value={contentType}
        onChange={setContentType}
      />

      {showLoading ? (
        interactionType === "COMMENTED" ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-[60px] w-[60px] rounded-lg skeleton shrink-0" />
                  <div className="h-4 skeleton w-2/3" />
                </div>
                <div className="space-y-2 pl-1">
                  <div className="h-3 skeleton w-1/4" />
                  <div className="h-3 skeleton w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg skeleton" />
            ))}
          </div>
        )
      ) : error && items.length === 0 && comments.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <EmptyIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : interactionType === "COMMENTED" ? (
        groupedComments.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
              <EmptyIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedComments.map((group) => (
              <CommentedListItem
                key={group.post.postId}
                group={group}
                contentType={contentType}
              />
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <EmptyIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
            {items.map((post, index) => (
              <PosterGridItem
                key={`${post.postId}_${index}`}
                post={post}
                interactionType={interactionType}
                contentType={contentType}
              />
            ))}
          </div>

          {!hasMore && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          )}
        </>
      )}

      {hasMore && !showLoading && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {(isLoadingMore || isLoading) && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {contentType === "VIDEOS" && !showLoading && items.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Clapperboard className="h-3.5 w-3.5" />
          Showing trailers you interacted with
        </div>
      )}
    </div>
  );
}
