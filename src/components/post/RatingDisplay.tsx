"use client";

import { Star } from "lucide-react";

function getRatingColor(voteAverage: number): string {
  if (voteAverage >= 7.0) return "#4CAF50";
  if (voteAverage >= 5.0) return "#FFB800";
  if (voteAverage >= 3.0) return "#FF9800";
  return "#F44336";
}

function formatVoteCount(count: number): string {
  if (count >= 1_000_000) {
    const m = Math.round((count / 1_000_000) * 10) / 10;
    return `${m}M votes`;
  }
  if (count >= 1_000) {
    const k = Math.round((count / 1_000) * 10) / 10;
    return `${k}K votes`;
  }
  return `${count} votes`;
}

interface RatingDisplayProps {
  voteAverage: number;
  voteCount?: number;
}

export function RatingDisplay({ voteAverage, voteCount }: RatingDisplayProps) {
  if (!voteAverage || voteAverage <= 0) return null;

  const ratingColor = getRatingColor(voteAverage);
  const displayScore = ((voteAverage * 10) | 0) / 10.0;

  return (
    <div className="flex items-center justify-center gap-2 bg-muted/70 rounded-xl px-4 py-2">
      <Star
        className="h-7 w-7 shrink-0"
        fill={ratingColor}
        style={{ color: ratingColor }}
      />
      <span
        className="text-2xl font-bold"
        style={{ color: ratingColor }}
      >
        {displayScore}
      </span>
      <span className="text-sm text-muted-foreground">/10</span>
      {voteCount != null && voteCount > 0 && (
        <span className="text-sm text-muted-foreground/80 ml-2">
          {formatVoteCount(voteCount)}
        </span>
      )}
    </div>
  );
}
