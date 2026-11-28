"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { isTitleTrackingEnabled } from "@/lib/session";
import {
  batchGetTracking,
  clearTracking,
  getTracking,
  toTrackingKey,
  upsertTracking,
} from "@/lib/title-tracking";
import { notifyTitleTrackingChanged } from "@/lib/title-tracking-events";
import type {
  TitleTrackingDto,
  TitleTrackingKey,
  TitleTrackingMutationInput,
  TitleTrackingStatusPage,
  ViewingStatus,
} from "@/types/title-tracking";

type QuerySnapshot = [readonly unknown[], unknown];

function readSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number | undefined,
  key?: TitleTrackingKey
): QuerySnapshot[] {
  return [
    ...queryClient.getQueriesData({ queryKey: ["titleTracking", userId] }),
    ...queryClient.getQueriesData({
      queryKey: key
        ? ["titleTrackingTitle", userId, key.tmdbId, key.mediaType]
        : ["titleTrackingTitle", userId],
    }),
    ...queryClient.getQueriesData({ queryKey: ["titleTrackingBatch", userId] }),
  ];
}

function restoreSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: QuerySnapshot[]
) {
  snapshots.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
}

function patchTitleCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number | undefined,
  key: TitleTrackingKey,
  entry: TitleTrackingDto | null
) {
  queryClient.setQueriesData<TitleTrackingDto | null>(
    { queryKey: ["titleTrackingTitle", userId, key.tmdbId, key.mediaType] },
    () => entry
  );
  queryClient.setQueriesData<Record<string, TitleTrackingDto | null>>(
    { queryKey: ["titleTrackingBatch", userId] },
    (old) => {
      if (!old) return old;
      const id = `${key.tmdbId}:${key.mediaType}`;
      if (!(id in old)) return old;
      return { ...old, [id]: entry };
    }
  );
}

function patchPageCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number | undefined,
  key: TitleTrackingKey,
  entry: TitleTrackingDto | null
) {
  const queries = queryClient.getQueriesData<TitleTrackingStatusPage>({
    queryKey: ["titleTracking", userId],
  });
  queries.forEach(([queryKey, page]) => {
    if (!page) return;
    const status = queryKey[2] as ViewingStatus;
    const withoutKey = page.items.filter(
      (item) => item.tmdbId !== key.tmdbId || item.mediaType !== key.mediaType
    );
    const items =
      entry && status === entry.status ? [entry, ...withoutKey] : withoutKey;
    queryClient.setQueryData(queryKey, {
      ...page,
      items,
      totalCount: page.totalCount != null ? Math.max(0, page.totalCount + (entry ? 1 : -1)) : items.length,
    });
  });
}

function optimisticEntry(input: TitleTrackingMutationInput): TitleTrackingDto {
  const key = toTrackingKey(input);
  return {
    ...key,
    status: input.status,
    rating:
      input.status === "watched" && input.rating != null
        ? Math.min(5, Math.max(1, Math.round(input.rating)))
        : null,
    note: input.note ?? null,
    lastSeason:
      key.mediaType === "tv" && input.status === "watching"
        ? input.lastSeason ?? null
        : null,
    lastEpisode:
      key.mediaType === "tv" && input.status === "watching"
        ? input.lastEpisode ?? null
        : null,
    updatedAt: Date.now(),
  };
}

function useTrackingEnabled(userId: number | undefined, extra = true): boolean {
  const authStatus = useAuthStore((s) => s.authStatus);
  return (
    extra &&
    !!userId &&
    authStatus !== "restoring" &&
    isTitleTrackingEnabled()
  );
}

export function useTrackingQuery(
  userId: number | undefined,
  status: ViewingStatus,
  page = 0,
  pageSize = 20
) {
  const enabled = useTrackingEnabled(userId);
  return useQuery({
    queryKey: ["titleTracking", userId, status, page, pageSize],
    queryFn: () => getTracking(userId, status, page, pageSize),
    enabled,
  });
}

export function useTrackingForTitle(
  userId: number | undefined,
  key: TitleTrackingKey | null
) {
  const enabled = useTrackingEnabled(userId, !!key && key.tmdbId > 0);
  const tmdbId = key?.tmdbId ?? 0;
  const mediaType = key?.mediaType ?? "movie";
  return useQuery<TitleTrackingDto | null>({
    queryKey: ["titleTrackingTitle", userId, tmdbId, mediaType],
    queryFn: async () => {
      if (!key) return null;
      const entries = await batchGetTracking([key]);
      return (
        entries.find(
          (entry) =>
            entry.tmdbId === key.tmdbId && entry.mediaType === key.mediaType
        ) ?? null
      );
    },
    enabled,
  });
}

export function useBatchTitleTracking(
  userId: number | undefined,
  keys: TitleTrackingKey[]
) {
  const signature = keys
    .map((key) => `${key.tmdbId}:${key.mediaType}`)
    .sort()
    .join("|");
  const enabled = useTrackingEnabled(userId, signature.length > 0);
  const query = useQuery<Record<string, TitleTrackingDto | null>>({
    queryKey: ["titleTrackingBatch", userId, signature],
    queryFn: async () => {
      const normalized = signature
        ? signature.split("|").map((part) => {
            const [tmdbId, mediaType] = part.split(":");
            return {
              tmdbId: Number(tmdbId),
              mediaType: mediaType === "tv" ? ("tv" as const) : ("movie" as const),
            };
          })
        : [];
      const entries = await batchGetTracking(normalized);
      return Object.fromEntries(
        entries.map((entry) => [`${entry.tmdbId}:${entry.mediaType}`, entry])
      );
    },
    enabled,
  });

  return {
    entries: query.data ?? {},
    isLoading: enabled && query.isLoading,
    error: query.error,
  };
}

export function useTitleTrackingMutations(userId: number | undefined) {
  const queryClient = useQueryClient();
  const enabled = useTrackingEnabled(userId);

  const prepare = useCallback(
    async (key: TitleTrackingKey) => {
      await queryClient.cancelQueries({ queryKey: ["titleTracking", userId] });
      await queryClient.cancelQueries({
        queryKey: ["titleTrackingTitle", userId, key.tmdbId, key.mediaType],
      });
      return readSnapshots(queryClient, userId, key);
    },
    [queryClient, userId]
  );

  const settle = useCallback(
    (key: TitleTrackingKey) => {
      queryClient.invalidateQueries({ queryKey: ["titleTracking", userId] });
      queryClient.invalidateQueries({
        queryKey: ["titleTrackingTitle", userId, key.tmdbId, key.mediaType],
      });
      queryClient.invalidateQueries({ queryKey: ["titleTrackingBatch", userId] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts", userId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      notifyTitleTrackingChanged(key);
    },
    [queryClient, userId]
  );

  const upsert = useMutation({
    mutationFn: (input: TitleTrackingMutationInput) => {
      if (!enabled) throw new Error("Title tracking is unavailable");
      return upsertTracking(input);
    },
    onMutate: async (input) => {
      const key = toTrackingKey(input);
      const snapshots = await prepare(key);
      const entry = optimisticEntry(input);
      patchTitleCache(queryClient, userId, key, entry);
      patchPageCache(queryClient, userId, key, entry);
      return { snapshots, key };
    },
    onError: (_error, _input, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: (_data, _error, input) => {
      settle(toTrackingKey(input));
    },
  });

  const clear = useMutation({
    mutationFn: (key: TitleTrackingKey) => {
      if (!enabled) throw new Error("Title tracking is unavailable");
      return clearTracking(key);
    },
    onMutate: async (rawKey) => {
      const key = toTrackingKey(rawKey);
      const snapshots = await prepare(key);
      patchTitleCache(queryClient, userId, key, null);
      patchPageCache(queryClient, userId, key, null);
      return { snapshots, key };
    },
    onError: (_error, _key, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
    },
    onSettled: (_data, _error, key) => {
      settle(toTrackingKey(key));
    },
  });

  return {
    upsert: upsert.mutateAsync,
    clear: clear.mutateAsync,
    isSaving: upsert.isPending || clear.isPending,
    error: upsert.error ?? clear.error,
  };
}
