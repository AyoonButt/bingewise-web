"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  youtubePlayerPool,
  type VideoErrorReason,
} from "@/lib/youtube-player-pool";

interface UseYoutubePlayerParams {
  /** Stable unique key for this card (ownership token). */
  ownerKey: string;
  videoKey: string | null | undefined;
  targetRef: React.RefObject<HTMLElement | null>;
  /** The feed's scroll container; the sticky overlay host lives inside it. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Whether this card should own the pooled player. */
  active: boolean;
  /** Whether playback should be running (active card tap-to-pause). */
  playing: boolean;
  muted: boolean;
  onEnded?: () => void;
  onError?: (reason: VideoErrorReason) => void;
  onPlayingChange?: (playing: boolean) => void;
}

export function useYoutubePlayer({
  ownerKey,
  videoKey,
  targetRef,
  containerRef,
  active,
  playing,
  muted,
  onEnded,
  onError,
  onPlayingChange,
}: UseYoutubePlayerParams) {
  // Keep latest callbacks in refs so the acquire effect doesn't re-run.
  const cbRef = useRef({ onEnded, onError, onPlayingChange });
  cbRef.current = { onEnded, onError, onPlayingChange };
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    if (!active || !videoKey || !targetRef.current || !containerRef.current) return;
    const el = targetRef.current;
    youtubePlayerPool.acquire(ownerKey, {
      containerEl: containerRef.current,
      targetEl: el,
      videoKey,
      autoPlay: playing,
      shouldAutoPlay: () => playingRef.current && active,
      startMuted: muted,
      onEnded: () => cbRef.current.onEnded?.(),
      onError: (reason) => cbRef.current.onError?.(reason),
      onPlayingChange: (p) => cbRef.current.onPlayingChange?.(p),
    });
    return () => {
      youtubePlayerPool.release(ownerKey);
    };
    // playing/muted intentionally excluded: controlled by effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, videoKey, ownerKey]);

  useEffect(() => {
    if (!active) return;
    youtubePlayerPool.setMuted(muted, ownerKey);
  }, [muted, active, ownerKey]);

  useEffect(() => {
    if (!active) return;
    if (playing) youtubePlayerPool.play(ownerKey);
    else youtubePlayerPool.pause(ownerKey);
  }, [playing, active, ownerKey]);

  const replay = useCallback(() => {
    if (active) youtubePlayerPool.replay(ownerKey);
  }, [active, ownerKey]);

  return { replay };
}
