"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteWatchlist,
  getWatchlistDetail,
  removeWatchlistItem,
  updateWatchlist,
} from "@/lib/watchlist";
import { onWatchlistChanged } from "@/lib/watchlist-events";
import type {
  UpdateWatchlistRequest,
  Watchlist,
  WatchlistDetailResponse,
} from "@/types/watchlist";

export function useWatchlistDetail(
  watchlistId: number,
  shareToken?: string | null
) {
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<WatchlistDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!watchlistId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getWatchlistDetail(watchlistId, shareToken)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e?.message ?? "Failed to load watchlist");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [watchlistId, shareToken]);

  useEffect(() => {
    if (!watchlistId) return;
    return onWatchlistChanged((id) => {
      if (id !== watchlistId) return;
      getWatchlistDetail(watchlistId, shareToken)
        .then(setDetail)
        .catch(() => {});
    });
  }, [watchlistId, shareToken]);

  const syncListCache = useCallback(
    (updater: (w: Watchlist) => Watchlist) => {
      queryClient.setQueriesData<Watchlist[]>(
        { queryKey: ["watchlists"] },
        (prev) => prev?.map((w) => (w.id === watchlistId ? updater(w) : w))
      );
    },
    [queryClient, watchlistId]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          watchlist: {
            ...prev.watchlist,
            itemCount: Math.max(0, prev.watchlist.itemCount - 1),
          },
          items: prev.items.filter((i) => i.id !== itemId),
          collaborators: prev.collaborators,
        };
      });
      try {
        await removeWatchlistItem(watchlistId, itemId);
        syncListCache((w) => ({
          ...w,
          itemCount: Math.max(0, w.itemCount - 1),
        }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove item");
        try {
          const fresh = await getWatchlistDetail(watchlistId, shareToken);
          setDetail(fresh);
        } catch {
          // keep optimistic state
        }
      }
    },
    [watchlistId, shareToken, syncListCache]
  );

  const [metaSaving, setMetaSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  /**
   * Persist a metadata change (name/coverColor/isPublic) and adopt the server's
   * response as the source of truth so the UI can never drift from the backend.
   */
  const updateMeta = useCallback(
    async (patch: UpdateWatchlistRequest) => {
      setUpdateError(null);
      const prev = detail;
      if (prev) {
        setDetail({
          ...prev,
          watchlist: { ...prev.watchlist, ...patch },
        });
      }
      try {
        setMetaSaving(true);
        const updated = await updateWatchlist(watchlistId, patch);
        setDetail((cur) =>
          cur ? { ...cur, watchlist: updated } : cur
        );
        syncListCache(() => updated);
      } catch (e) {
        setUpdateError(
          e instanceof Error ? e.message : "Failed to update watchlist"
        );
        if (prev) setDetail(prev);
        throw e;
      } finally {
        setMetaSaving(false);
      }
    },
    [detail, watchlistId, syncListCache]
  );

  const togglePublic = useCallback(async () => {
    if (!detail) return;
    await updateMeta({ isPublic: !detail.watchlist.isPublic }).catch(() => {});
  }, [detail, updateMeta]);

  const deleteList = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteWatchlist(watchlistId);
      queryClient.setQueriesData<Watchlist[]>(
        { queryKey: ["watchlists"] },
        (prev) => prev?.filter((w) => w.id !== watchlistId)
      );
    } finally {
      setIsDeleting(false);
    }
  }, [watchlistId, queryClient]);

  const refresh = useCallback(async () => {
    try {
      const fresh = await getWatchlistDetail(watchlistId, shareToken);
      setDetail(fresh);
    } catch {
      // keep current state on failure
    }
  }, [watchlistId, shareToken]);

  return {
    detail,
    isLoading,
    isDeleting,
    error,
    updateError,
    metaSaving,
    removeItem,
    togglePublic,
    updateMeta,
    deleteList,
    refresh,
  };
}
