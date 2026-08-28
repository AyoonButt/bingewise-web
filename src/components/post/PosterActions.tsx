"use client";

import { Eye, Play, ListPlus, Loader2 } from "lucide-react";

interface PosterActionsProps {
  creatingAction: "post" | "trailer" | null;
  hasVideo: boolean;
  onViewAsPost: () => void;
  onWatchTrailer: () => void;
  onAddToWatchlist: () => void;
}

export function PosterActions({
  creatingAction,
  hasVideo,
  onViewAsPost,
  onWatchTrailer,
  onAddToWatchlist,
}: PosterActionsProps) {
  const isPostLoading = creatingAction === "post";
  const isTrailerLoading = creatingAction === "trailer";
  const isAnyLoading = creatingAction !== null;

  return (
    <div className="space-y-3">
      {hasVideo && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onViewAsPost}
            disabled={isAnyLoading}
            className="btn-outline flex items-center justify-center gap-2 h-11"
          >
            {isPostLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            View as Post
          </button>
          <button
            onClick={onWatchTrailer}
            disabled={isAnyLoading}
            className="btn-primary flex items-center justify-center gap-2 h-11"
          >
            {isTrailerLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Watch Trailer
          </button>
        </div>
      )}
      <button
        onClick={onAddToWatchlist}
        disabled={isAnyLoading}
        className="btn-outline w-full flex items-center justify-center gap-2 h-11"
      >
        <ListPlus className="h-4 w-4" />
        Add to Watchlist
      </button>
    </div>
  );
}
