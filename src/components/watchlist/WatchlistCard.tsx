"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Lock, Users } from "lucide-react";
import { parseCoverColor } from "./palette";
import { userAvatarUrl } from "@/lib/avatar";
import { tmdbImage } from "@/lib/tmdb";
import { useWatchlistPreviewPosters } from "@/hooks/use-watchlist-preview-posters";
import type { Watchlist } from "@/types/watchlist";
import Image from "next/image";

// Fixed scatter region in px — matches the Android watchlist card. The card
// is h-44 (176px) and the region sits in m-2 (8px) margins: 176-16 = 160.
const REGION_W = 144;
const REGION_H = 160;

/**
 * Deterministic per-watchlist scatter so a given watchlist always renders the
 * same arrangement. Same seed math as the OG polaroid card and the Android
 * story card.
 */
function scatterPolaroid(watchlistId: number, index: number) {
  const mix = watchlistId * 31 + index;
  const r1 = (((mix * 37 + 11) % 997) % 100 + 100) % 100;
  const r2 = (((mix * 13 + 29) % 991) % 100 + 100) % 100;
  const r3 = (((mix * 23 + 47) % 983) % 100 + 100) % 100;
  const r4 = (((mix * 31 + 7) % 977) % 100 + 100) % 100;
  return { r1, r2, r3, r4 };
}

function cardPolaroidLayout(watchlistId: number, index: number, count: number) {
  const { r1, r2, r3, r4 } = scatterPolaroid(watchlistId, index);
  const baseW = count <= 2 ? 74 : count <= 4 ? 64 : 56;
  const w = baseW * (0.78 + r1 * 0.005);
  const cardH = 5 + (w - 5) / 0.66;
  const dxMax = Math.max(0, REGION_W / 2 - (w / 2 + 4));
  const dyMax = Math.max(0, REGION_H / 2 - (cardH / 2 + 4));
  const dx = ((r3 - 50) / 50) * Math.min(w * 1.2, dxMax);
  const dy = ((r4 - 50) / 50) * Math.min(w * 1.5, dyMax);
  return {
    left: REGION_W / 2 + dx - w / 2,
    top: REGION_H / 2 + dy - cardH / 2,
    width: w,
    height: cardH,
    rotation: -25 + r2 * 0.5,
  };
}

function PreviewPolaroids({
  watchlistId,
  posters,
}: {
  watchlistId: number;
  posters: string[] | null;
}) {
  // Loaded but empty → no scatter at all (the left panel takes the width).
  if (posters !== null && posters.length === 0) return null;
  // Loading / failure → tilted ghost frames so the card still reads as a
  // photo pile rather than a blank rectangle.
  const frames = posters ?? [null, null, null];

  return (
    <div className="relative m-2 w-36 shrink-0 self-stretch">
      {frames.map((posterPath, i) => {
        const layout = cardPolaroidLayout(watchlistId, i, frames.length);
        return (
          <div
            key={i}
            className="absolute flex flex-col rounded-md bg-white"
            style={{
              left: layout.left,
              top: layout.top,
              width: layout.width,
              height: layout.height,
              padding: 2.5,
              transform: `rotate(${layout.rotation}deg)`,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
            }}
          >
            {posterPath ? (
              <Image
                src={tmdbImage(posterPath, "w185")}
                alt=""
                width={185}
                height={278}
                className="h-auto w-full rounded-sm object-cover"
                style={{ aspectRatio: "0.66" }}
              />
            ) : (
              <div
                className="w-full rounded-sm bg-[#E9E9F0]"
                style={{ aspectRatio: "0.66" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WatchlistCard({
  watchlist,
  showSharedBy = true,
}: {
  watchlist: Watchlist;
  showSharedBy?: boolean;
}) {
  const router = useRouter();
  const color = parseCoverColor(watchlist.coverColor);
  const posters = useWatchlistPreviewPosters(watchlist.id);
  const handleCardClick = () => {
    router.push(`/watchlist/${watchlist.id}`);
  };

  const ownerName = watchlist.ownerName ?? watchlist.ownerUsername;
  const showOwnerChip = !watchlist.isOwner && !!ownerName;
  const showGroupChip = watchlist.collaboratorCount > 0;

  return (
    <div
      onClick={handleCardClick}
      className="card watchlist-polaroid-card group block cursor-pointer overflow-hidden transition-colors hover:border-primary/40"
      style={{
        backgroundImage: `linear-gradient(to bottom, ${color}59, var(--wlp-surface), var(--wlp-surface), ${color}73)`,
      }}
    >
      <div className="flex h-44">
        <div className="flex min-w-0 flex-1 flex-col p-4">
          {(showOwnerChip || showGroupChip) && (
            <div className="flex items-center gap-1.5">
              {showOwnerChip && (
                <Link
                  href={`/user/${watchlist.ownerUsername ?? ""}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-900 transition-colors hover:text-primary dark:bg-black/45 dark:text-white"
                >
                  {watchlist.ownerAvatarUrl || watchlist.ownerId ? (
                    <Image
                      src={
                        watchlist.ownerAvatarUrl ??
                        userAvatarUrl(watchlist.ownerId, 40)
                      }
                      alt={ownerName ?? ""}
                      width={16}
                      height={16}
                      className="h-4 w-4 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/10 text-[9px] font-bold dark:bg-white/20">
                      {ownerName![0].toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">
                    {showSharedBy ? `Shared by ${ownerName}` : ownerName}
                  </span>
                </Link>
              )}
              {showGroupChip && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-900 dark:bg-black/45 dark:text-white">
                  <Users className="h-3 w-3" />
                  Group
                </span>
              )}
            </div>
          )}

          <div className="mt-auto space-y-1.5">
            <p className="line-clamp-2 text-[17px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-primary dark:text-white">
              {watchlist.name}
            </p>
            {watchlist.description && (
              <p className="line-clamp-1 text-sm text-zinc-900/65 dark:text-white/65">
                {watchlist.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-white"
                style={{ backgroundColor: `${color}D9` }}
              >
                {watchlist.itemCount}{" "}
                {watchlist.itemCount === 1 ? "TITLE" : "TITLES"}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-900/70 dark:text-white/70">
                {watchlist.isPublic ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {watchlist.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>

        <PreviewPolaroids watchlistId={watchlist.id} posters={posters} />
      </div>
    </div>
  );
}
