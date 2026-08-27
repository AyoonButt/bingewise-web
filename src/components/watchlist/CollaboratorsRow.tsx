"use client";

import Image from "next/image";
import { tmdbImage } from "@/lib/tmdb";
import type { WatchlistCollaborator } from "@/types/watchlist";

function MemberAvatar({
  url,
  name,
  onClick,
}: {
  url: string | null;
  name: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={name ?? undefined}
      className="h-8 w-8 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/40 transition"
    >
      {url ? (
        <Image
          src={tmdbImage(url)}
          alt={name ?? "Member"}
          width={32}
          height={32}
          className="object-cover"
        />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          {(name ?? "U").charAt(0).toUpperCase()}
        </span>
      )}
    </button>
  );
}

interface CollaboratorsRowProps {
  ownerName: string | null;
  ownerAvatarUrl: string | null;
  collaborators: WatchlistCollaborator[];
  onManageClick: () => void;
}

export function CollaboratorsRow({
  ownerName,
  ownerAvatarUrl,
  collaborators,
  onManageClick,
}: CollaboratorsRowProps) {
  const visible = collaborators.slice(0, 4);
  const overflow = collaborators.length - visible.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <MemberAvatar
          url={ownerAvatarUrl}
          name={ownerName}
          onClick={onManageClick}
        />
        {visible.map((c) => (
          <MemberAvatar
            key={c.userId}
            url={c.avatarUrl}
            name={c.name ?? c.username}
            onClick={onManageClick}
          />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={onManageClick}
            title="View all members"
            className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-muted-foreground hover:ring-2 hover:ring-primary/40 transition"
          >
            +{overflow}
          </button>
        )}
      </div>
    </div>
  );
}
