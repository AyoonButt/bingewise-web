"use client";

import { useEffect, useState } from "react";
import { getPublicWatchlists } from "@/lib/watchlist";
import type { Watchlist } from "@/types/watchlist";

/** Discovery feed of public watchlists with debounced free-text search. */
export function usePublicWatchlists(query: string) {
  const [results, setResults] = useState<Watchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await getPublicWatchlists(
            query.trim() || undefined,
            50
          );
          if (!cancelled) setResults(data);
        } catch (e) {
          if (!cancelled) {
            setResults([]);
            setError(
              e instanceof Error ? e.message : "Failed to load watchlists"
            );
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      },
      query.trim() ? 300 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return { results, isLoading, error };
}
