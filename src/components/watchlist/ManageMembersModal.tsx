"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Search, Trash2, UserPlus, X } from "lucide-react";
import { tmdbImage } from "@/lib/tmdb";
import { addCollaborator, removeCollaborator } from "@/lib/watchlist";
import { useUserSearch } from "@/hooks/use-follow";
import type { WatchlistCollaborator } from "@/types/watchlist";

function MemberAvatar({
  url,
  name,
}: {
  url: string | null;
  name: string | null;
}) {
  return (
    <div className="h-9 w-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
      {url ? (
        <Image
          src={tmdbImage(url)}
          alt={name ?? "Member"}
          width={36}
          height={36}
          className="object-cover"
        />
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          {(name ?? "U").charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

interface ManageMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlistId: number;
  isOwner: boolean;
  ownerName: string | null;
  ownerAvatarUrl: string | null;
  collaborators: WatchlistCollaborator[];
  onChanged: () => void;
}

export function ManageMembersModal({
  open,
  onOpenChange,
  watchlistId,
  isOwner,
  ownerName,
  ownerAvatarUrl,
  collaborators,
  onChanged,
}: ManageMembersModalProps) {
  const [query, setQuery] = useState("");
  const [deferred, setDeferred] = useState("");
  const [removing, setRemoving] = useState<number | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search input so we don't hammer the endpoint on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDeferred(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isFetching } = useUserSearch(deferred);

  // Reset transient state whenever the modal is closed.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setDeferred("");
      setError(null);
      setRemoving(null);
      setAdding(null);
    }
  }, [open]);

  const existingIds = useMemo(
    () => new Set(collaborators.map((c) => c.userId)),
    [collaborators]
  );
  const filtered = (results ?? []).filter((u) => !existingIds.has(u.userId));

  if (!open) return null;

  const handleRemove = async (userId: number) => {
    setRemoving(userId);
    setError(null);
    try {
      await removeCollaborator(watchlistId, userId);
      onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove collaborator");
    } finally {
      setRemoving(null);
    }
  };

  const handleAdd = async (username: string) => {
    setAdding(username);
    setError(null);
    try {
      await addCollaborator(watchlistId, { username });
      setQuery("");
      setDeferred("");
      onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add collaborator");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={() => !removing && !adding && onOpenChange(false)}
      />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-background border border-border rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {isOwner ? "Manage members" : "Members"}
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Members list */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MemberAvatar url={ownerAvatarUrl} name={ownerName} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {ownerName ?? "Owner"}
              </p>
              <p className="text-xs text-muted-foreground">Owner</p>
            </div>
          </div>

          {collaborators.map((c) => (
            <div key={c.userId} className="flex items-center gap-3">
              <MemberAvatar url={c.avatarUrl} name={c.name ?? c.username} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {c.name ?? c.username}
                </p>
                {c.username && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{c.username}
                  </p>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemove(c.userId)}
                  disabled={removing === c.userId}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  aria-label="Remove collaborator"
                >
                  {removing === c.userId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Owner-only invite-by-search */}
        {isOwner && (
          <div className="space-y-3 pt-1">
            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold mb-2">Add people</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {isFetching && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            <div className="space-y-2">
              {filtered.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {u.name ?? u.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.username}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(u.username)}
                    disabled={adding === u.username}
                    className="btn-outline h-8 px-3 flex items-center gap-1 text-xs disabled:opacity-50"
                  >
                    {adding === u.username ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
