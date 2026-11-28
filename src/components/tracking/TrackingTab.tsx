"use client";

import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { openTrackSheet, useTrackingSheetStore } from "@/stores/tracking-sheet-store";
import { useTrackingQuery } from "@/hooks/use-title-tracking";
import { analytics } from "@/lib/analytics";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackingTitleCard } from "@/components/tracking/TrackingTitleCard";
import { cn } from "@/lib/utils";
import type { TitleTrackingDto, TrackCandidate, ViewingStatus } from "@/types/title-tracking";

const STATUSES: ViewingStatus[] = ["want", "watching", "watched"];

const EMPTY_COPY: Record<ViewingStatus, string> = {
  want: "Tap the bookmark on any title to add it here.",
  watching: "Nothing in progress. Pick something from Want to watch.",
  watched: "Finished titles will show up here.",
};

function candidateFromEntry(entry: TitleTrackingDto): TrackCandidate {
  return {
    tmdbId: entry.tmdbId,
    mediaType: entry.mediaType,
    title: entry.title?.trim() || `Title ${entry.tmdbId}`,
    posterPath: entry.posterPath,
    backdropPath: entry.backdropPath,
    overview: entry.overview,
    releaseYear: entry.releaseYear,
  };
}

export function TrackingTab({ userId }: { userId: number | undefined }) {
  const [status, setStatus] = useState<ViewingStatus>("watching");
  const [page, setPage] = useState(0);
  const openSubdialog = useTrackingSheetStore((s) => s.openSubdialog);
  const query = useTrackingQuery(userId, status, page, 20);

  useEffect(() => {
    analytics.logTrackingTabViewed(status);
  }, [status]);

  const entries = useMemo(() => {
    const items = [...(query.data?.items ?? [])];
    items.sort((a, b) => {
      const byUpdated = (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      if (status === "watched" && (b.rating ?? 0) !== (a.rating ?? 0)) {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      return byUpdated;
    });
    return items;
  }, [query.data?.items, status]);

  const handleStatusChange = (next: ViewingStatus) => {
    if (next === status) return;
    setStatus(next);
    setPage(0);
  };

  const openEntry = (entry: TitleTrackingDto, progress = false) => {
    const candidate = candidateFromEntry(entry);
    if (openTrackSheet(candidate) && progress) openSubdialog("progress");
  };

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((value) => (
          <StatusChip
            key={value}
            userId={userId}
            status={value}
            active={status === value}
            onClick={() => handleStatusChange(value)}
          />
        ))}
      </div>

      {query.error ? (
        <p className="text-sm text-destructive text-center py-10">
          {query.error.message}
        </p>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="Nothing here yet"
          description={EMPTY_COPY[status]}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <TrackingTitleCard
                key={`${entry.mediaType}:${entry.tmdbId}`}
                entry={entry}
                onTrack={() => openEntry(entry)}
                onProgress={() => openEntry(entry, true)}
              />
            ))}
          </div>
          {query.data?.hasMore && (
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={query.isFetching}
              className="btn-outline w-full h-10 flex items-center justify-center gap-2 text-sm"
            >
              {query.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}

function StatusChip({
  userId,
  status,
  active,
  onClick,
}: {
  userId: number | undefined;
  status: ViewingStatus;
  active: boolean;
  onClick: () => void;
}) {
  const countQuery = useTrackingQuery(userId, status, 0, 1);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "badge h-8 px-3 capitalize",
        active
          ? "badge-default"
          : "badge-outline text-muted-foreground hover:text-foreground"
      )}
    >
      {status} ({countQuery.data?.totalCount ?? 0})
    </button>
  );
}
