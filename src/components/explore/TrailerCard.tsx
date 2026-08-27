"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Heart,
  MessageCircle,
  Bookmark,
  Info,
  Share2,
  ThumbsDown,
  Youtube,
} from "lucide-react";
import { decodeHtmlEntities } from "@/lib/utils";
import { useYoutubePlayer } from "@/hooks/use-youtube-player";
import { youtubePlayerPool } from "@/lib/youtube-player-pool";
import type { PostDto } from "@/types/post";

interface TrailerCardProps {
  post: PostDto;
  active: boolean;
  muted: boolean;
  isLiked: boolean;
  isSaved: boolean;
  playerContainerRef: React.RefObject<HTMLDivElement | null>;
  onToggleMute: () => void;
  onStarted?: (postId: number) => void;
  onMutedChange?: (muted: boolean) => void;
  onLikeClick?: () => void;
  onSaveClick?: () => void;
  onCommentClick?: (anchor: HTMLElement | null) => void;
  onInfoClick?: () => void;
  onShareClick?: () => void;
  onNotInterested?: () => void;
  onError?: (reason: string) => void;
}

export function TrailerCard({
  post,
  active,
  muted,
  isLiked,
  isSaved,
  playerContainerRef,
  onToggleMute,
  onStarted,
  onMutedChange,
  onLikeClick,
  onSaveClick,
  onCommentClick,
  onInfoClick,
  onShareClick,
  onNotInterested,
  onError,
}: TrailerCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerAreaRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const ownerKey = `trailer_${post.postId ?? post.tmdbId}`;
  const canPlay = !!post.videoKey && !videoFailed;

  useEffect(() => {
    if (active) {
      setPlaying(true);
    }
  }, [active]);

  const handleEnded = useCallback(() => {
    // Auto-loop: seek back to start and play again (matches mobile app behavior).
    // Do NOT set ended=true or stop playing — the video loops seamlessly.
    youtubePlayerPool.replay(ownerKey);
  }, [ownerKey]);

  const handleError = useCallback(
    (reason: string) => {
      setVideoFailed(true);
      onError?.(reason);
    },
    [onError]
  );

  const handlePlayingChange = useCallback(
    (isPlaying: boolean) => {
      if (isPlaying && active) onStarted?.(post.postId ?? post.tmdbId);
    },
    [active, onStarted, post.postId, post.tmdbId]
  );

  useYoutubePlayer({
    ownerKey,
    videoKey: post.videoKey,
    targetRef: playerAreaRef,
    containerRef: playerContainerRef,
    active: active && canPlay,
    playing: active && playing,
    muted,
    onEnded: handleEnded,
    onError: handleError,
    onPlayingChange: handlePlayingChange,
  });

  const handleTogglePlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const handleToggleMute = useCallback(() => {
    onToggleMute();
    onMutedChange?.(!muted);
  }, [onToggleMute, onMutedChange, muted]);

  const title = decodeHtmlEntities(post.title);
  const overview = decodeHtmlEntities(post.overview);
  const year = post.releaseDate?.split("-")[0];

  return (
    <div
      ref={containerRef}
      data-trailer-card
      className="relative w-full h-full overflow-hidden bg-black md:h-auto md:rounded-2xl md:shadow-2xl md:aspect-[16/10] md:max-w-4xl md:max-h-[85vh]"
    >
      <div ref={playerAreaRef} className="absolute inset-0 rounded-none md:rounded-2xl" />

      {active && canPlay && (
        <button
          onClick={handleTogglePlay}
          className="absolute inset-0 z-40 flex items-center justify-center"
          aria-label={playing ? "Pause" : "Play"}
        >
          {!playing && (
            <span className="h-16 w-16 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="h-7 w-7 text-white translate-x-0.5" />
            </span>
          )}
        </button>
      )}

      <button
        onClick={handleToggleMute}
        className="absolute top-3 left-3 z-40 h-10 w-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      <div className="absolute bottom-0 inset-x-0 z-40 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
        <h3 className="text-white font-semibold text-lg line-clamp-1">{title}</h3>
        <div className="flex items-center gap-2">
          <p className="text-white/70 text-sm">
            {year ? `${year} · ` : ""}
            {post.type === "movie" ? "Movie" : "TV"}
          </p>
          {/* YouTube ToS: users must be able to watch the video on YouTube. */}
          {canPlay && (
            <a
              href={`https://www.youtube.com/watch?v=${post.videoKey}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto ml-auto p-1 text-white/70 hover:text-white transition-colors"
              aria-label="Watch on YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>
          )}
        </div>
        {overview && (
          <p
            onClick={() => overview.length > 100 && setExpanded((e) => !e)}
            className={`text-white/60 text-xs mt-1 pointer-events-auto ${
              expanded ? "" : "line-clamp-2"
            } ${overview.length > 100 ? "cursor-pointer" : ""}`}
          >
            {overview}
            {overview.length > 100 &&
              (expanded ? (
                <span className="text-white/80"> less</span>
              ) : (
                <span className="text-white/80"> more</span>
              ))}
          </p>
        )}
      </div>

      <div className="absolute right-2 bottom-24 z-40 flex flex-col items-center gap-4">
        <button
          onClick={onLikeClick}
          className="flex flex-col items-center gap-0.5"
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <span
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
              isLiked
                ? "bg-red-500/20 text-red-500"
                : "bg-black/40 backdrop-blur text-white hover:bg-black/60"
            }`}
          >
            <Heart
              className="h-5 w-5"
              fill={isLiked ? "currentColor" : "none"}
            />
          </span>
        </button>

        <button
          onClick={() => onCommentClick?.(containerRef.current ?? null)}
          className="flex flex-col items-center gap-0.5"
          aria-label="Comment"
        >
          <span className="h-10 w-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <MessageCircle className="h-5 w-5" />
          </span>
        </button>

        <button
          onClick={onSaveClick}
          className="flex flex-col items-center gap-0.5"
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <span
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
              isSaved
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-black/40 backdrop-blur text-white hover:bg-black/60"
            }`}
          >
            <Bookmark
              className="h-5 w-5"
              fill={isSaved ? "currentColor" : "none"}
            />
          </span>
        </button>

        <button
          onClick={onInfoClick}
          className="flex flex-col items-center gap-0.5"
          aria-label="Info"
        >
          <span className="h-10 w-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <Info className="h-5 w-5" />
          </span>
        </button>

        {onNotInterested && (
          <button
            onClick={onNotInterested}
            className="flex flex-col items-center gap-0.5"
            aria-label="Not interested"
          >
            <span className="h-10 w-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              <ThumbsDown className="h-5 w-5" />
            </span>
          </button>
        )}

        <button
          onClick={onShareClick}
          className="flex flex-col items-center gap-0.5"
          aria-label="Share"
        >
          <span className="h-10 w-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <Share2 className="h-5 w-5" />
          </span>
        </button>
      </div>
    </div>
  );
}
