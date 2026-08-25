"use client";

import Image from "next/image";
import { tmdbImage } from "@/lib/tmdb";
import type { TmdbMovieDetail } from "@/types/tmdb";
import { getGenreColor } from "@/lib/genre-colors";
import { SectionHeader } from "@/components/ui/section-header";

interface PosterInfoProps {
  movie: TmdbMovieDetail;
}

export function PosterInfo({ movie }: PosterInfoProps) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-[2/3] max-w-xs rounded-xl overflow-hidden shadow-lg">
        {movie.poster_path && (
          <Image
            src={tmdbImage(movie.poster_path, "w500")}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="300px"
          />
        )}
      </div>
      <div className="space-y-2">
        <SectionHeader title={movie.title} />
        <p className="text-muted-foreground">
          {movie.release_date?.split("-")[0]} &middot;{" "}
          {movie.runtime ? `${movie.runtime} min` : "N/A"}
        </p>
        <div className="flex items-center gap-1 text-sm">
          <span style={{ color: "var(--star-yellow)" }}>★</span>
          <span className="font-medium">{movie.vote_average?.toFixed(1)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {movie.genres.map((g) => (
            <span
              key={g.id}
              className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: getGenreColor(g.name) }}
            >
              {g.name}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{movie.overview}</p>
      </div>
    </div>
  );
}
