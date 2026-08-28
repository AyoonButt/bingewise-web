"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Trash2, X } from "lucide-react";
import { tmdbImage } from "@/lib/tmdb";
import type { WatchlistItem } from "@/types/watchlist";

interface WatchlistItemCardProps {
  item: WatchlistItem;
  isOwner?: boolean;
  canRemove?: boolean;
  onRemove: (itemId: number) => Promise<void> | void;
  feedHref?: string;
}

export function WatchlistItemCard({
  item,
  isOwner,
  canRemove,
  onRemove,
  feedHref,
}: WatchlistItemCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const allowRemove = canRemove ?? isOwner ?? false;

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <div className="relative group">
        <Link
          href={feedHref ?? `/post/${item.tmdbId}?type=${item.mediaType}`}
          className="block"
        >
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-muted">
            {item.posterPath ? (
              <Image
                src={tmdbImage(item.posterPath, "w342")}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm p-2 text-center">
                {item.title}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.releaseYear ?? ""}
          </p>
        </Link>
        {allowRemove && (
          <button
            onClick={() => setConfirming(true)}
            aria-label={`Remove ${item.title}`}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => !removing && setConfirming(false)}
          />
          <div className="relative w-full max-w-sm bg-background border border-border rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="font-semibold">Remove from watchlist?</h3>
            <p className="text-sm text-muted-foreground">
              &ldquo;{item.title}&rdquo; will be removed from this list.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={removing}
                className="btn-outline flex-1 h-10"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
