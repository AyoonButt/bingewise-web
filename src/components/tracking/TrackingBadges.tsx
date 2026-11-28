"use client";

import { Bookmark, MessageSquareText, Star } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { isTitleTrackingEnabled } from "@/lib/session";
import { formatTrackingProgress } from "@/lib/title-tracking";
import { cn } from "@/lib/utils";
import type { PostDto } from "@/types/post";
import type { TitleTrackingDto, ViewingStatus } from "@/types/title-tracking";

interface TrackingStatusBadgesProps {
  status?: ViewingStatus | null;
  rating?: number | null;
  progress?: string | null;
  hasNote?: boolean;
  className?: string;
}

export function TrackingStatusBadges({
  status,
  rating,
  progress,
  hasNote,
  className,
}: TrackingStatusBadgesProps) {
  const user = useAuthStore((s) => s.user);
  if (
    !user ||
    !isTitleTrackingEnabled() ||
    (!status && rating == null && !progress && !hasNote)
  ) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {status && (
        <span className="badge badge-default capitalize inline-flex items-center gap-1">
          <Bookmark className="h-3 w-3" />
          {status}
        </span>
      )}
      {rating != null && (
        <span className="badge badge-outline inline-flex items-center gap-1">
          <Star className="h-3 w-3 fill-[var(--star-yellow)] text-[var(--star-yellow)]" />
          {rating}/5
        </span>
      )}
      {progress && <span className="badge badge-secondary tabular-nums">{progress}</span>}
      {hasNote && (
        <span className="badge badge-outline inline-flex items-center gap-1">
          <MessageSquareText className="h-3 w-3" />
          Note
        </span>
      )}
    </div>
  );
}

export function TrackingPostBadges({
  post,
  className,
}: {
  post: PostDto;
  className?: string;
}) {
  return (
    <TrackingStatusBadges
      status={post.trackingStatus}
      rating={post.userRating}
      progress={post.trackingProgress ?? null}
      hasNote={post.hasNote}
      className={className}
    />
  );
}

export function TrackingEntryBadges({
  entry,
  className,
}: {
  entry: TitleTrackingDto | null | undefined;
  className?: string;
}) {
  return (
    <TrackingStatusBadges
      status={entry?.status}
      rating={entry?.rating}
      progress={formatTrackingProgress(entry)}
      hasNote={!!entry?.note}
      className={className}
    />
  );
}
