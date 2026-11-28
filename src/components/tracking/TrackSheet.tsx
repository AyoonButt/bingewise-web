"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  Check,
  Heart,
  Loader2,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTrackingSheetStore } from "@/stores/tracking-sheet-store";
import { useWatchlists } from "@/hooks/use-watchlists";
import { useInteractions } from "@/hooks/use-interactions";
import {
  useTitleTrackingMutations,
  useTrackingForTitle,
} from "@/hooks/use-title-tracking";
import { analytics } from "@/lib/analytics";
import { toTrackingKey } from "@/lib/title-tracking";
import { WATCHLIST_PALETTE, parseCoverColor } from "@/components/watchlist/palette";
import { TvProgressEditor } from "@/components/tracking/TvProgressEditor";
import { cn } from "@/lib/utils";
import type { AddWatchlistItemRequest } from "@/types/watchlist";
import type { TrackCandidate, ViewingStatus } from "@/types/title-tracking";

interface TrackSheetProps {
  candidate: TrackCandidate;
  onClose: () => void;
  onManageLists: () => void;
}

const STATUS_OPTIONS: { status: ViewingStatus; label: string; icon: typeof Heart }[] = [
  { status: "want", label: "Want to watch", icon: Bookmark },
  { status: "watching", label: "Watching", icon: Heart },
  { status: "watched", label: "Watched", icon: Check },
];

export function TrackSheet({ candidate, onClose, onManageLists }: TrackSheetProps) {
  const user = useAuthStore((s) => s.user);
  const key = toTrackingKey(candidate);
  const openSubdialog = useTrackingSheetStore((s) => s.openSubdialog);
  const {
    watchlists,
    isLoading: isLoadingLists,
    isCreating,
    isAddingTo,
    error: listError,
    createList,
    addItemToList,
  } = useWatchlists(user?.userId);
  const { isSaved, toggleSave } = useInteractions(user?.userId);
  const entryQuery = useTrackingForTitle(user?.userId, key);
  const { upsert, clear, isSaving, error } = useTitleTrackingMutations(
    user?.userId
  );
  const entry = entryQuery.data ?? null;

  const [newName, setNewName] = useState("");
  const [color, setColor] = useState(WATCHLIST_PALETTE[0]);
  const [addedToIds, setAddedToIds] = useState<Set<number>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSaving]);

  const mediaRef = {
    tmdbId: key.tmdbId,
    mediaType: key.mediaType,
    postId: candidate.postId,
  };

  const setStatus = async (status: ViewingStatus) => {
    if (isSaving) return;
    try {
      await upsert({
        ...key,
        status,
        rating: status === "watched" ? entry?.rating ?? null : null,
        note: entry?.note ?? null,
        lastSeason: entry?.lastSeason ?? null,
        lastEpisode: entry?.lastEpisode ?? null,
      });
      analytics.logTitleStatusSet(mediaRef, status);
      setNotice(`Marked ${status}`);
      if (
        status === "want" &&
        candidate.postId != null &&
        !isSaved(candidate.postId)
      ) {
        toggleSave(candidate.postId);
      }
      if (status === "watched") openSubdialog("rating");
    } catch {
      setNotice("");
    }
  };

  const handleClear = async () => {
    if (isSaving) return;
    try {
      await clear(key);
      setConfirmClear(false);
      setNotice("Status cleared");
    } catch {
      setNotice("");
    }
  };

  const listCandidate: AddWatchlistItemRequest = {
    tmdbId: candidate.tmdbId,
    mediaType: candidate.mediaType,
    title: candidate.title,
    posterPath: candidate.posterPath,
    backdropPath: candidate.backdropPath,
    overview: candidate.overview,
    releaseYear: candidate.releaseYear,
  };

  const handleAdd = async (watchlistId: number) => {
    try {
      await addItemToList(watchlistId, listCandidate);
      setAddedToIds((prev) => new Set(prev).add(watchlistId));
      if (!entry) {
        await upsert({ ...key, status: "want", note: null });
        analytics.logTitleStatusSet(mediaRef, "want");
      }
    } catch {
      setNotice("Could not add to list");
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim() || isCreating) return;
    try {
      const created = await createList(
        newName.trim(),
        null,
        color,
        listCandidate
      );
      if (created?.id) {
        setAddedToIds((prev) => new Set(prev).add(created.id));
      }
      setNewName("");
      if (!entry) {
        await upsert({ ...key, status: "want", note: null });
        analytics.logTitleStatusSet(mediaRef, "want");
      }
    } catch {
      setNotice("Could not create list");
    }
  };

  const showProgress =
    key.mediaType === "tv" && entry?.status === "watching";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">Track title</p>
              <p className="text-xs text-muted-foreground truncate">
                {candidate.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <div className="space-y-2">
            {STATUS_OPTIONS.map(({ status, label, icon: Icon }) => {
              const active = entry?.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => void setStatus(status)}
                  disabled={isSaving}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors disabled:opacity-60 text-left",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {showProgress && (
            <TvProgressEditor candidate={candidate} entry={entry} />
          )}

          {entry && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => openSubdialog("rating")}
                className="btn-outline h-9 px-3 text-sm flex items-center gap-2"
              >
                <Star className="h-3.5 w-3.5" />
                {entry.rating ? `Rate ${entry.rating}/5` : "Add rating / note"}
              </button>
              {confirmClear ? (
                <div className="flex-1 min-w-[220px] space-y-2 rounded-xl border border-destructive/40 p-2">
                  <p className="text-xs text-muted-foreground">
                    This removes the status, your private note, and TV progress.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="btn-outline h-8 flex-1 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleClear()}
                      disabled={isSaving}
                      className="btn-primary h-8 flex-1 text-xs flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="btn-ghost h-9 px-3 text-sm flex items-center gap-2 text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear status
                </button>
              )}
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium">Add to a list</p>
            {isLoadingLists ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : watchlists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No watchlists yet — create one below.
              </p>
            ) : (
              <div className="space-y-1">
                {watchlists.map((w) => {
                  const busy = isAddingTo === w.id;
                  const done = addedToIds.has(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => void handleAdd(w.id)}
                      disabled={busy || done || isAddingTo !== null}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors disabled:opacity-60 text-left"
                    >
                      <span
                        className="h-8 w-8 rounded-lg shrink-0"
                        style={{ backgroundColor: parseCoverColor(w.coverColor) }}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {w.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {w.itemCount} {w.itemCount === 1 ? "item" : "items"}
                        </span>
                      </span>
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      ) : done ? (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {WATCHLIST_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Use color ${c}`}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-105"
                  style={{
                    backgroundColor: c,
                    transform: color === c ? "scale(1.15)" : undefined,
                    boxShadow: color === c ? `0 0 0 3px ${c}66` : undefined,
                  }}
                />
              ))}
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New list name"
              className="input-base"
              maxLength={60}
            />
            <button
              type="button"
              onClick={() => void handleCreateAndAdd()}
              disabled={!newName.trim() || isCreating}
              className="btn-primary w-full h-10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create &amp; Add
            </button>
          </div>

          {(error || listError) && (
            <p className="text-sm text-destructive text-center">
              {error?.message ?? listError}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-primary text-center">
              {notice}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-primary flex-1 h-10 text-sm font-medium"
            >
              Done
            </button>
            <button
              type="button"
              onClick={onManageLists}
              className="btn-outline flex-1 h-10 text-sm font-medium"
            >
              Manage Lists
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
