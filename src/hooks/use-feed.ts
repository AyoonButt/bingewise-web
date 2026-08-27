"use client";

import { useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ContentResponse, PostDto } from "@/types/post";

export function useFeed(
  userId?: number,
  language = "en-US",
  region = "US"
) {
  const query = useInfiniteQuery({
    queryKey: ["feed", userId, language, region],
    queryFn: async ({ pageParam }): Promise<ContentResponse> => {
      const cursor = pageParam as string | null;
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);

      if (userId) {
        return await apiClient<ContentResponse>(
          `/api/recommendations/${userId}/${language}?${params.toString()}`
        );
      }

      // Guest mode: same endpoint the mobile app uses. Unauthenticated,
      // returns a bare PostDto[] (backend exposes no cursor for guests).
      const [lang] = language.split("-");
      const guestPosts = await fetch(
        `/api/guest/recommendations?language=${lang}&region=${region}&contentType=posts&limit=25`
      ).then((r) => {
        if (!r.ok) throw new Error(`Guest feed error: ${r.status}`);
        return r.json();
      });
      const posts: PostDto[] = Array.isArray(guestPosts) ? guestPosts : [];
      return {
        posts,
        totalCount: posts.length,
        recentCount: posts.length,
        qualityCount: 0,
        hasQualityFallback: false,
        contentType: "recommendations",
        nextCursor: null,
        hasMore: false,
      } as ContentResponse;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore && lastPage?.nextCursor ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
  });

  const posts: PostDto[] =
    query.data?.pages.flatMap((p) => p?.posts ?? []).filter(Boolean) ?? [];

  // Bounded refill: the Feed tab scrolls via a bottom sentinel, so an empty page
  // (backend keeps hasMore=true but yields nothing) would otherwise keep firing
  // loadMore. Cap consecutive empty fetches so a sparse catalog can't storm the
  // recommendations endpoint.
  const emptyStreakRef = useRef(0);
  const loadMore = useCallback(() => {
    if (!(query.hasNextPage && !query.isFetchingNextPage)) return;
    if (emptyStreakRef.current >= 3) return;
    const before = query.data?.pages.flatMap((p) => p?.posts ?? []).length ?? 0;
    void query.fetchNextPage().then(() => {
      const after = query.data?.pages.flatMap((p) => p?.posts ?? []).length ?? 0;
      emptyStreakRef.current = after === before ? emptyStreakRef.current + 1 : 0;
    });
  }, [query]);

  const refresh = useCallback(() => {
    emptyStreakRef.current = 0;
    query.refetch();
  }, [query]);

  return {
    posts,
    loadMore,
    refresh,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefreshing: query.isFetching && (query.data?.pages.length ?? 0) > 0,
    hasNextPage: query.hasNextPage,
  };
}
