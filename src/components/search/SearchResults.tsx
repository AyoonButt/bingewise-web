"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useCallback, useState } from "react";
import { tmdbImage } from "@/lib/tmdb";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { PosterTile } from "@/components/search/PosterTile";
import { Loader2, Search, User as UserIcon } from "lucide-react";
import type { TmdbSearchResult } from "@/types/tmdb";

/** Person avatar with graceful fallback when the profile image fails. */
function PersonAvatar({ path, name }: { path: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border">
      {path && !failed ? (
        <Image
          src={tmdbImage(path, "w185")}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="80px"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
          <UserIcon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}

interface SearchResultsProps {
  results: TmdbSearchResult[];
  query: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function SearchResults({
  results,
  query,
  hasMore,
  loadingMore,
  onLoadMore,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (sentinelRef.current) sentinelRef.current = null;
      if (!node) return;
      sentinelRef.current = node;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            onLoadMore?.();
          }
        },
        { rootMargin: "300px" }
      );
      observer.observe(node);
    },
    [hasMore, loadingMore, onLoadMore]
  );

  if (results.length === 0 && query) {
    return (
      <EmptyState
        icon={Search}
        title="No results found"
        description={`No results for "${query}". Try a different search.`}
      />
    );
  }

  const people = results.filter((r) => r.media_type === "person");
  const media = results.filter((r) => r.media_type !== "person");

  return (
    <div className="space-y-6">
      {people.length > 0 && (
        <div className="space-y-3">
          <SectionHeader title="People" />
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {people.map((item) => {
              const person = item as Extract<TmdbSearchResult, { media_type: "person" }>;
              return (
                <Link
                  key={person.id}
                  href={`/person/${person.id}`}
                  className="flex-shrink-0 w-20 text-center group"
                >
                  <PersonAvatar path={person.profile_path} name={person.name} />
                  <p className="mt-1 text-xs font-medium truncate">{person.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {person.known_for_department}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {media.length > 0 && (
        <div className="space-y-3">
          {people.length > 0 && <SectionHeader title="Movies & TV" />}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => {
              const title = "title" in item ? item.title : "name" in item ? item.name : "";
              const posterPath = "poster_path" in item ? item.poster_path : null;
              const date = "release_date" in item ? item.release_date : "first_air_date" in item ? item.first_air_date : "";
              const mediaType = item.media_type;

              return (
                <PosterTile
                  key={item.id}
                  href={
                    mediaType === "movie" || mediaType === "tv"
                      ? `/post/${item.id}?type=${mediaType}`
                      : "#"
                  }
                  title={title}
                  subtitle={date?.split("-")[0]}
                  posterPath={posterPath}
                />
              );
            })}
          </div>
        </div>
      )}
      <div ref={sentinelCallback} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
