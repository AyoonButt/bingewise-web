"use client";

import { useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { TrailerInteractionDto } from "@/types/interactions";

interface ActiveSession {
  postId: number;
  startedAt: number;
  replays: number;
  muted: boolean;
  liked: boolean;
  saved: boolean;
  commentButtonPressed: boolean;
}

/**
 * Tracks trailer view sessions and persists them via
 * POST /api/trailer-interactions/save when a session ends.
 *
 * Includes like/save/comment state from the trailer feed so the
 * interaction DTO accurately reflects user engagement.
 */
export function useTrailerInteractionTracker(userId: number | undefined) {
  const sessionRef = useRef<ActiveSession | null>(null);

  const endSession = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session || !userId) return;
    const dto: TrailerInteractionDto = {
      interactionId: null,
      userId,
      postId: session.postId,
      startTimestamp: session.startedAt,
      endTimestamp: Date.now(),
      replayCount: session.replays,
      isMuted: session.muted,
      likeState: session.liked,
      saveState: session.saved,
      commentButtonPressed: session.commentButtonPressed,
    };
    apiClient("/api/trailer-interactions/save", {
      method: "POST",
      body: JSON.stringify(dto),
    }).catch(() => {
      // tracking is best-effort
    });
  }, [userId]);

  const beginSession = useCallback(
    (postId: number, muted: boolean) => {
      if (sessionRef.current?.postId === postId) {
        sessionRef.current.muted = muted;
        return;
      }
      endSession();
      sessionRef.current = {
        postId,
        startedAt: Date.now(),
        replays: 0,
        muted,
        liked: false,
        saved: false,
        commentButtonPressed: false,
      };
    },
    [endSession]
  );

  const recordReplay = useCallback(() => {
    if (sessionRef.current) sessionRef.current.replays += 1;
  }, []);

  const updateMuted = useCallback((muted: boolean) => {
    if (sessionRef.current) sessionRef.current.muted = muted;
  }, []);

  const updateLikeState = useCallback((liked: boolean) => {
    if (sessionRef.current) sessionRef.current.liked = liked;
  }, []);

  const updateSaveState = useCallback((saved: boolean) => {
    if (sessionRef.current) sessionRef.current.saved = saved;
  }, []);

  const updateCommentPressed = useCallback((pressed: boolean) => {
    if (sessionRef.current) sessionRef.current.commentButtonPressed = pressed;
  }, []);

  useEffect(() => {
    return () => endSession();
  }, [endSession]);

  return {
    beginSession,
    endSession,
    recordReplay,
    updateMuted,
    updateLikeState,
    updateSaveState,
    updateCommentPressed,
  };
}
