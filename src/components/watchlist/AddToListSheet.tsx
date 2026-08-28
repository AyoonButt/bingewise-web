"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Loader2, Plus, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useWatchlists } from "@/hooks/use-watchlists";
import { WATCHLIST_PALETTE, parseCoverColor } from "./palette";
import type { AddWatchlistItemRequest } from "@/types/watchlist";

interface AddToListSheetProps {
  candidate: AddWatchlistItemRequest;
  onClose: () => void;
  onManageLists: () => void;
}

export function AddToListSheet({
  candidate,
  onClose,
  onManageLists,
}: AddToListSheetProps) {
  const user = useAuthStore((s) => s.user);
  const {
    watchlists,
    isLoading,
    isCreating,
    isAddingTo,
    error,
    createList,
    addItemToList,
  } = useWatchlists(user?.userId);

  const [newName, setNewName] = useState("");
  const [color, setColor] = useState(WATCHLIST_PALETTE[0]);
  const [addedToIds, setAddedToIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleAdd = async (watchlistId: number) => {
    try {
      await addItemToList(watchlistId, candidate);
      setAddedToIds((prev) => new Set(prev).add(watchlistId));
    } catch {
      // error surfaced via hook state
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim() || isCreating) return;
    try {
      const res = await createList(newName.trim(), null, color, candidate);
      if (res?.watchlist?.id) {
        setAddedToIds((prev) => new Set(prev).add(res.watchlist.id));
      }
      setNewName("");
    } catch {
      // error surfaced via hook state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">Add to Watchlist</p>
              <p className="text-xs text-muted-foreground truncate">
                {candidate.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : watchlists.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
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
                    onClick={() => handleAdd(w.id)}
                    disabled={busy || done || isAddingTo !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors disabled:opacity-60 text-left"
                  >
                    <span
                      className="h-8 w-8 rounded-lg shrink-0"
                      style={{
                        backgroundColor: parseCoverColor(w.coverColor),
                      }}
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

          {/* Create new list */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium">Create a new list</p>
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
              onClick={handleCreateAndAdd}
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

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="btn-primary flex-1 h-10 text-sm font-medium"
            >
              Done
            </button>
            <button
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
