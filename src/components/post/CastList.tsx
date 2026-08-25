"use client";

import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/tmdb";
import { SectionHeader } from "@/components/ui/section-header";
import type { TmdbCastMember } from "@/types/tmdb";

interface CastListProps {
  cast: TmdbCastMember[];
}

export function CastList({ cast }: CastListProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Cast" />
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {cast.slice(0, 15).map((member) => (
          <Link
            key={member.id}
            href={`/person/${member.id}`}
            className="flex-shrink-0 w-20 text-center hover:opacity-80 transition-opacity"
          >
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border">
              {member.profile_path && (
                <Image
                  src={tmdbImage(member.profile_path, "w185")}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </div>
            <p className="mt-1 text-xs font-medium truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {member.character}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
