"use client";

import { Eye, Play, ListPlus, Loader2 } from "lucide-react";

interface PosterActionsProps {
  isLoading: boolean;
  hasVideo: boolean;
  onViewAsPost: () => void;
  onWatchTrailer: () => void;
  onAddToWatchlist: () => void;
}

export function PosterActions({
  isLoading,
  hasVideo,
  onViewAsPost,
  onWatchTrailer,
  onAddToWatchlist,
}: PosterActionsProps) {
  return (
    <div className="space-y-3">
      {hasVideo && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onViewAsPost}
            disabled={isLoading}
            className="btn-outline flex items-center justify-center gap-2 h-11"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            View as Post
          </button>
          <button
            onClick={onWatchTrailer}
            disabled={isLoading}
            className="btn-primary flex items-center justify-center gap-2 h-11"
          >
            {isLoading ? (
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
        disabled={isLoading}
        className="btn-outline w-full flex items-center justify-center gap-2 h-11"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ListPlus className="h-4 w-4" />
        )}
        Add to Watchlist
      </button>
    </div>
  );
}
