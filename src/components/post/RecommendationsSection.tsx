"use client";

import Image from "next/image";
import { tmdbImage } from "@/lib/tmdb";
import { SectionHeader } from "@/components/ui/section-header";
import type { TmdbMovie, TmdbTv } from "@/types/tmdb";

type RecommendationItem = TmdbMovie | TmdbTv;

function getRecTitle(item: RecommendationItem): string {
  if ("title" in item) return item.title;
  if ("name" in item) return item.name;
  return "Untitled";
}

interface RecommendationsSectionProps {
  recommendations: RecommendationItem[];
  onRecommendationClick: (id: number, isMovie: boolean) => void;
}

export function RecommendationsSection({
  recommendations,
  onRecommendationClick,
}: RecommendationsSectionProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader title="You Might Like" />
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recommendations.slice(0, 10).map((item) => {
          const title = getRecTitle(item);
          const isMovie = "title" in item;
          return (
            <button
              key={item.id}
              onClick={() => onRecommendationClick(item.id, isMovie)}
              className="flex-shrink-0 w-[100px] text-center group"
            >
              <div className="relative w-[100px] h-[150px] rounded-lg overflow-hidden bg-muted border border-border group-hover:border-primary/50 transition-colors">
                {item.poster_path ? (
                  <Image
                    src={tmdbImage(item.poster_path, "w185")}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs font-medium truncate group-hover:text-primary transition-colors">
                {title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
