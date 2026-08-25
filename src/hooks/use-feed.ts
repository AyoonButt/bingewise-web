"use client";

import { useCallback } from "react";
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
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | null;
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);

      if (userId) {
        // Recommendations returns a raw List<PostDto> (no cursor pagination)
        const posts = await apiClient<PostDto[] | ContentResponse>(
          `/api/recommendations/${userId}/${language}?${params.toString()}`
        );
        if (Array.isArray(posts)) {
          return {
            posts,
            totalCount: posts.length,
            nextCursor: null,
            hasMore: false,
          } as ContentResponse;
        }
        return posts;
      }

      // Guest mode: same endpoint the mobile app uses. Unauthenticated,
      // returns a bare PostDto[] with no cursor pagination.
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
        nextCursor: null,
        hasMore: false,
      } as ContentResponse;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
  });

  const posts: PostDto[] =
    query.data?.pages.flatMap((p) => p?.posts ?? []).filter(Boolean) ?? [];

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const refresh = useCallback(() => {
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
