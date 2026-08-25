"use client";

import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWatchlistItem,
  createWatchlist,
  getWatchlists,
} from "@/lib/watchlist";
import { onWatchlistsInvalidated } from "@/lib/watchlist-events";
import {
  invalidateCurrentUserWatchlists,
  invalidateUserWatchlists,
} from "@/lib/watchlist";
import type { AddWatchlistItemRequest, Watchlist } from "@/types/watchlist";

export function useWatchlists(userId?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlists", userId],
    queryFn: () => getWatchlists(userId!),
    enabled: !!userId,
  });

  // Clones/deletes can happen outside this hook (detail page, profile page) —
  // refresh the collection the moment they occur.
  useEffect(() => {
    return onWatchlistsInvalidated(() => {
      if (userId) queryClient.invalidateQueries({ queryKey: ["watchlists", userId] });
    });
  }, [userId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      coverColor,
      firstItem,
    }: {
      name: string;
      description?: string | null;
      coverColor?: string | null;
      firstItem?: AddWatchlistItemRequest | null;
    }) => {
      const created = await createWatchlist({
        name,
        description: description || null,
        coverColor: coverColor ?? null,
        isPublic: false,
      });
      if (firstItem) {
        await addWatchlistItem(created.id, firstItem);
      }
      return created;
    },
    onSuccess: (created, { firstItem }) => {
      queryClient.setQueryData<Watchlist[]>(["watchlists", userId], (prev) => [
        { ...created, itemCount: created.itemCount + (firstItem ? 1 : 0) },
        ...(prev ?? []),
      ]);
      // Keep profile Lists tab + any other views in sync.
      if (userId) invalidateUserWatchlists(userId);
      invalidateCurrentUserWatchlists();
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({
      watchlistId,
      item,
    }: {
      watchlistId: number;
      item: AddWatchlistItemRequest;
    }) => addWatchlistItem(watchlistId, item),
    onSuccess: (_, { watchlistId }) => {
      queryClient.setQueryData<Watchlist[]>(["watchlists", userId], (prev) =>
        (prev ?? []).map((w) =>
          w.id === watchlistId ? { ...w, itemCount: w.itemCount + 1 } : w
        )
      );
      // Item counts appear on the profile Lists tab too.
      if (userId) invalidateUserWatchlists(userId);
    },
  });

  const createList = useCallback(
    async (
      name: string,
      description?: string | null,
      coverColor?: string | null,
      firstItem?: AddWatchlistItemRequest | null
    ): Promise<Watchlist> => {
      return createMutation.mutateAsync({
        name,
        description,
        coverColor,
        firstItem,
      });
    },
    [createMutation]
  );

  const addItemToList = useCallback(
    async (watchlistId: number, item: AddWatchlistItemRequest) => {
      await addItemMutation.mutateAsync({ watchlistId, item });
    },
    [addItemMutation]
  );

  const clearError = useCallback(() => {
    createMutation.reset();
    addItemMutation.reset();
  }, [createMutation, addItemMutation]);

  return {
    watchlists: query.data ?? [],
    isLoading: query.isLoading,
    isCreating: createMutation.isPending,
    isAddingTo: addItemMutation.isPending ? addItemMutation.variables?.watchlistId ?? null : null,
    error:
      query.error?.message ??
      createMutation.error?.message ??
      addItemMutation.error?.message ??
      null,
    createList,
    addItemToList,
    clearError,
  };
}
