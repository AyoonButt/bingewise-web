"use client";

import { Loader2, MessageSquareText, Pencil, Plus, Star } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  openTrackSheet,
  useTrackingSheetStore,
} from "@/stores/tracking-sheet-store";
import {
  useTitleTrackingMutations,
  useTrackingForTitle,
} from "@/hooks/use-title-tracking";
import { analytics } from "@/lib/analytics";
import { formatTrackingProgress, toTrackingKey } from "@/lib/title-tracking";
import { cn } from "@/lib/utils";
import type { TrackCandidate } from "@/types/title-tracking";

export function TrackingStatusRow({
  candidate,
  showEmptyState = true,
}: {
  candidate: TrackCandidate;
  showEmptyState?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const key = toTrackingKey(candidate);
  const openSubdialog = useTrackingSheetStore((s) => s.openSubdialog);
  const entryQuery = useTrackingForTitle(user?.userId, key);
  const { upsert, isSaving, error } = useTitleTrackingMutations(user?.userId);
  const entry = entryQuery.data ?? null;
  const progress = formatTrackingProgress(entry);

  if (!showEmptyState && (!user || entryQuery.isLoading || !entry)) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openTrackSheet(candidate)}
        className="btn-outline w-full h-10 flex items-center justify-center gap-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        Track this title
      </button>
    );
  }

  if (entryQuery.isLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!entry) {
    return (
      <button
        type="button"
        onClick={() => openTrackSheet(candidate)}
        className="btn-outline w-full h-10 flex items-center justify-center gap-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        Track this title
      </button>
    );
  }

  const increment = async () => {
    if (!entry.lastSeason || !entry.lastEpisode || isSaving) return;
    const nextEpisode = entry.lastEpisode + 1;
    try {
      await upsert({
        ...key,
        status: "watching",
        rating: null,
        note: entry.note ?? null,
        lastSeason: entry.lastSeason,
        lastEpisode: nextEpisode,
      });
    } catch {
      return;
    }
    analytics.logTvProgressSaved(
      { tmdbId: key.tmdbId, mediaType: key.mediaType, postId: candidate.postId },
      entry.lastSeason,
      nextEpisode
    );
  };

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Your tracking</p>
        <button
          type="button"
          onClick={() => openTrackSheet(candidate)}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-default capitalize">{entry.status}</span>
        {entry.rating != null && (
          <span className="badge badge-outline inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-[var(--star-yellow)] text-[var(--star-yellow)]" />
            {entry.rating}/5
          </span>
        )}
        {entry.note && (
          <span className="badge badge-outline inline-flex items-center gap-1">
            <MessageSquareText className="h-3 w-3" />
            Private note
          </span>
        )}
        {progress && (
          <button
            type="button"
            onClick={() => openSubdialog("progress")}
            className="badge badge-secondary tabular-nums hover:opacity-80"
          >
            {progress}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {entry.status === "watched" && (
          <button
            type="button"
            onClick={() => openSubdialog("rating")}
            className="btn-outline h-8 px-3 text-xs inline-flex items-center gap-1"
          >
            <Star className="h-3 w-3" />
            Edit rating / note
          </button>
        )}
        {progress && (
          <button
            type="button"
            onClick={() => void increment()}
            disabled={isSaving}
            className={cn(
              "btn-ghost h-8 px-3 text-xs inline-flex items-center gap-1",
              isSaving && "opacity-60"
            )}
          >
            <Plus className="h-3 w-3" />
            +1
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
