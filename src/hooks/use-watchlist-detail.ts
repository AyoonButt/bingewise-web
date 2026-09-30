"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteWatchlist,
  getWatchlistDetail,
  removeWatchlistItem,
  reorderWatchlistItems,
  updateWatchlist,
} from "@/lib/watchlist";
import { onWatchlistChanged } from "@/lib/watchlist-events";
import type {
  UpdateWatchlistRequest,
  Watchlist,
  WatchlistDetailResponse,
  WatchlistItem,
} from "@/types/watchlist";

/** Reorder `items` to follow `orderedIds`; unlisted items keep their order. */
function applyItemOrder(
  items: WatchlistItem[],
  orderedIds: number[]
): WatchlistItem[] {
  const remaining = new Map(items.map((i) => [i.id, i]));
  const next: WatchlistItem[] = [];
  for (const id of orderedIds) {
    const item = remaining.get(id);
    if (item) {
      next.push(item);
      remaining.delete(id);
    }
  }
  for (const item of items) {
    if (remaining.has(item.id)) next.push(item);
  }
  return next;
}

export function useWatchlistDetail(
  watchlistId: number,
  shareToken?: string | null,
  initialData?: WatchlistDetailResponse | null
) {
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<WatchlistDetailResponse | null>(
    initialData ?? null
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!watchlistId) return;
    // Server-rendered data is already in hand — skip the client refetch and let
    // PullToRefresh / watchlist events drive any fresh reads. Guests fetching a
    // failure fall back to the client fetch below.
    if (initialData) {
      setIsLoading(false);
      return;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [reorderError, setReorderError] = useState<string | null>(null);

  // Reorder mutations are serialized so responses can never interleave.
  // Each public call applies its optimistic update immediately, then queues its
  // API request. When the queue drains, the last server response is adopted as
  // truth (or a refetch reconciles after a failure) — intermediate responses
  // are dropped because adopting them would revert newer optimistic updates.
  const reorderChain = useRef<Promise<unknown>>(Promise.resolve());
  const pendingReorders = useRef(0);

  const enqueueReorder = useCallback(
    (request: () => Promise<WatchlistItem[]>): Promise<void> => {
      pendingReorders.current += 1;
      const run = reorderChain.current.then(async () => {
        try {
          const items = await request();
          pendingReorders.current -= 1;
          if (pendingReorders.current === 0) {
            setDetail((prev) => (prev ? { ...prev, items } : prev));
            setReorderError(null);
          }
        } catch (e) {
          pendingReorders.current -= 1;
          setReorderError(
            e instanceof Error ? e.message : "Couldn't save the new order"
          );
          if (pendingReorders.current === 0) {
            try {
              const fresh = await getWatchlistDetail(watchlistId, shareToken);
              setDetail(fresh);
            } catch {
              // keep optimistic state
            }
          }
          throw e;
        }
      });
      reorderChain.current = run.then(
        () => undefined,
        () => undefined
      );
      return run;
    },
    [watchlistId, shareToken]
  );

  /**
   * Optimistically apply a full new ordering, then persist it. Rejects on
   * failure — surfaces happen via `reorderError`, so UI callers can ignore it.
   */
  const reorderItems = useCallback(
    async (orderedItemIds: number[]): Promise<void> => {
      setReorderError(null);
      setDetail((prev) =>
        prev
          ? { ...prev, items: applyItemOrder(prev.items, orderedItemIds) }
          : prev
      );
      await enqueueReorder(() =>
        reorderWatchlistItems(watchlistId, orderedItemIds)
      );
    },
    [watchlistId, enqueueReorder]
  );

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
    reorderError,
    metaSaving,
    removeItem,
    reorderItems,
    togglePublic,
    updateMeta,
    deleteList,
    refresh,
  };
}
