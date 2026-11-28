"use client";

import { Bookmark, Eye, Play, Loader2, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterActionsProps {
  creatingAction: "post" | "trailer" | null;
  hasVideo: boolean;
  isLiked: boolean;
  isSaved: boolean;
  isLikeLoading: boolean;
  onViewAsPost: () => void;
  onWatchTrailer: () => void;
  onLike: () => void;
  onAddToWatchlist: () => void;
  onShare: () => void;
}

export function PosterActions({
  creatingAction,
  hasVideo,
  isLiked,
  isSaved,
  isLikeLoading,
  onViewAsPost,
  onWatchTrailer,
  onLike,
  onAddToWatchlist,
  onShare,
}: PosterActionsProps) {
  const isPostLoading = creatingAction === "post";
  const isTrailerLoading = creatingAction === "trailer";
  const isAnyLoading = creatingAction !== null || isLikeLoading;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onLike}
          disabled={isAnyLoading}
          aria-label={isLiked ? "Unlike" : "Like"}
          title={isLiked ? "Unlike" : "Like"}
          className={cn(
            "btn-outline h-11 w-full p-0 flex items-center justify-center transition-colors",
            isLiked && "text-[var(--heart-red)]"
          )}
        >
          {isLikeLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isLiked &&
                  "fill-[var(--heart-red)] text-[var(--heart-red)]"
              )}
            />
          )}
        </button>
        <button
          onClick={onAddToWatchlist}
          disabled={isAnyLoading}
          aria-label="Track title"
          title={isSaved ? "Edit tracking" : "Track title"}
          className={cn(
            "btn-outline h-11 w-full p-0 flex items-center justify-center transition-colors",
            isSaved && "text-[var(--saved-bookmark)]"
          )}
        >
          <Bookmark
            className={cn(
              "h-5 w-5 transition-colors",
              isSaved &&
                "fill-[var(--saved-bookmark)] text-[var(--saved-bookmark)]"
            )}
          />
        </button>
        <button
          onClick={onShare}
          disabled={isAnyLoading}
          aria-label="Share"
          title="Share"
          className="btn-outline h-11 w-full p-0 flex items-center justify-center"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

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
            className="btn-outline flex items-center justify-center gap-2 h-11"
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
    </div>
  );
}
