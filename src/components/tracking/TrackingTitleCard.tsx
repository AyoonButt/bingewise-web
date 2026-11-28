"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, MoreHorizontal, Star } from "lucide-react";
import { tmdbImage } from "@/lib/tmdb";
import { formatTrackingProgress } from "@/lib/title-tracking";
import type { TitleTrackingDto } from "@/types/title-tracking";

interface TrackingTitleCardProps {
  entry: TitleTrackingDto;
  onTrack: () => void;
  onProgress: () => void;
}

export function TrackingTitleCard({
  entry,
  onTrack,
  onProgress,
}: TrackingTitleCardProps) {
  const progress = formatTrackingProgress(entry);
  const title = entry.title?.trim() || `Title ${entry.tmdbId}`;
  const href = `/post/${entry.tmdbId}?type=${entry.mediaType}`;

  return (
    <div className="card relative overflow-hidden">
      <Link href={href} className="block">
        <div className="relative aspect-[2/3] bg-muted">
          {entry.posterPath ? (
            <Image
              src={tmdbImage(entry.posterPath, "w342")}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Bookmark className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Link href={href} className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold line-clamp-2 hover:underline">
              {title}
            </h3>
          </Link>
          <button
            type="button"
            onClick={onTrack}
            className="p-1 rounded-lg hover:bg-accent transition-colors shrink-0"
            aria-label={`Track ${title}`}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge badge-default capitalize">{entry.status}</span>
          {entry.rating != null && (
            <span className="badge badge-outline inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-[var(--star-yellow)] text-[var(--star-yellow)]" />
              {entry.rating}/5
            </span>
          )}
          {progress && (
            <button
              type="button"
              onClick={onProgress}
              className="badge badge-secondary tabular-nums hover:opacity-80"
            >
              {progress}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
