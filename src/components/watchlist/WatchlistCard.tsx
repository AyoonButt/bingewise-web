"use client";

import Link from "next/link";
import { Globe, Lock, Users } from "lucide-react";
import { parseCoverColor } from "./palette";
import { userAvatarUrl } from "@/lib/avatar";
import type { Watchlist } from "@/types/watchlist";
import Image from "next/image";

export function WatchlistCard({
  watchlist,
  showSharedBy = true,
}: {
  watchlist: Watchlist;
  showSharedBy?: boolean;
}) {
  const color = parseCoverColor(watchlist.coverColor);
  return (
    <Link
      href={`/watchlist/${watchlist.id}`}
      className="card overflow-hidden hover:border-primary/40 transition-colors group block"
    >
      <div
        className="h-20 relative"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
        }}
      >
        {showSharedBy && !watchlist.isOwner && (watchlist.ownerName || watchlist.ownerUsername) ? (
          <span className="absolute top-2 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/45 text-white text-[11px] font-medium">
            <Users className="h-3 w-3" />
            Shared by {watchlist.ownerName ?? watchlist.ownerUsername}
          </span>
        ) : watchlist.collaboratorCount > 0 ? (
          <span className="absolute top-2 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/45 text-white text-[11px] font-medium">
            <Users className="h-3 w-3" />
            Group
          </span>
        ) : null}
      </div>
      <div className="p-4 space-y-1.5">
        <p className="font-semibold truncate group-hover:text-primary transition-colors">
          {watchlist.name}
        </p>
        {watchlist.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {watchlist.description}
          </p>
        )}
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span>
            {watchlist.itemCount}{" "}
            {watchlist.itemCount === 1 ? "item" : "items"}
          </span>
          <span className="inline-flex items-center gap-1">
            {watchlist.isPublic ? (
              <Globe className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {watchlist.isPublic ? "Public" : "Private"}
          </span>
          {!watchlist.isOwner && watchlist.ownerUsername && (
            <Link
              href={`/user/${watchlist.ownerUsername}`}
              className="ml-auto flex items-center gap-1.5 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {watchlist.ownerAvatarUrl || watchlist.ownerId ? (
                <Image
                  src={
                    watchlist.ownerAvatarUrl ??
                    userAvatarUrl(watchlist.ownerId, 40)
                  }
                  alt={watchlist.ownerName ?? watchlist.ownerUsername}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                  {(watchlist.ownerName ?? watchlist.ownerUsername)[0].toUpperCase()}
                </div>
              )}
              <span className="truncate">
                {watchlist.ownerName ?? watchlist.ownerUsername}
              </span>
            </Link>
          )}
        </div>
      </div>
    </Link>
  );
}
