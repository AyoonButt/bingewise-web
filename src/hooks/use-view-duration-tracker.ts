"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Tracks view duration on movie, TV, or person detail screens.
 * Posts to POST /api/info/save when the component unmounts or media changes.
 * Matches the Android app's InfoDto tracking mechanism.
 */
export function useViewDurationTracker(
  tmdbId: number | undefined | null,
  type: "movie" | "tv" | "person" | string | null
) {
  const startTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!tmdbId || !type) return;
    startTimestampRef.current = Date.now();

    return () => {
      const user = useAuthStore.getState().user;
      const startTimestamp = startTimestampRef.current;
      if (!user || !startTimestamp || !tmdbId || !type) return;

      const endTimestamp = Date.now();
      // Ignore ultra-short accidental clicks (< 300ms)
      if (endTimestamp - startTimestamp < 300) return;

      apiClient("/api/info/save", {
        method: "POST",
        body: JSON.stringify({
          tmdbId,
          type,
          startTimestamp,
          endTimestamp,
          userId: user.userId,
        }),
      }).catch(() => {
        // tracking is best-effort
      });
    };
  }, [tmdbId, type]);
}
