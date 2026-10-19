"use client";

import { useQuery } from "@tanstack/react-query";
import { getWatchlistDetail } from "@/lib/watchlist";

const PREVIEW_POSTER_COUNT = 6;

/**
 * First N poster paths of a watchlist, used by the list-card polaroid
 * previews on /watchlists. The list DTO carries no posters, so each visible
 * card lazily pulls the detail response once; results are cached per
 * watchlist. Returns null while loading or on failure (the card renders
 * ghost frames instead).
 */
export function useWatchlistPreviewPosters(watchlistId: number) {
  const { data, isError } = useQuery({
    queryKey: ["watchlistPreviewPosters", watchlistId],
    queryFn: () =>
      getWatchlistDetail(watchlistId).then((detail) =>
        detail.items
          .slice(0, PREVIEW_POSTER_COUNT)
          .map((item) => item.posterPath)
          .filter((path): path is string => path !== null)
      ),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  return isError ? null : (data ?? null);
}
