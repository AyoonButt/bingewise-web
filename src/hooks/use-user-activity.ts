"use client";

import { useCallback } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { getLanguageRegion } from "@/lib/locale";
import type { PostDto } from "@/types/post";
import type { CommentDto } from "@/types/comment";

export type ActivityInteractionType = "LIKED" | "SAVED" | "COMMENTED";
export type ActivityContentType = "POSTS" | "VIDEOS";

const PAGE_SIZE = 20;

async function fetchPagedPosts(
  language: string,
  ids: number[],
  page: number,
  pageSize: number = PAGE_SIZE
): Promise<PostDto[]> {
  const params = new URLSearchParams({
    interactionIds: ids.join(","),
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiClient<PostDto[]>(`/api/posts/paged/${language}?${params.toString()}`);
}

async function fetchInteractionIds(
  userId: number,
  interactionType: Exclude<ActivityInteractionType, "COMMENTED">,
  contentType: ActivityContentType
): Promise<number[]> {
  if (contentType === "VIDEOS") {
    const suffix = interactionType === "LIKED" ? "liked" : "saved";
    return apiClient<number[]>(
      `/api/trailer-interactions/user/${userId}/${suffix}`
    );
  }
  const path = interactionType === "LIKED" ? "liked" : "saved";
  return apiClient<number[]>(`/api/interactions/${path}/user/${userId}`);
}

export function useUserActivity(
  interactionType: ActivityInteractionType,
  contentType: ActivityContentType
) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId;
  const language = getLanguageRegion(user);

  const isCommented = interactionType === "COMMENTED";
  const commentType = contentType === "VIDEOS" ? "trailer" : "post";

  // Liked/Saved: fetch the full interaction ID list once, then resolve posters
  // in paged slices.
  const idsQuery = useQuery({
    queryKey: ["activityIds", userId, interactionType, contentType],
    queryFn: () =>
      fetchInteractionIds(
        userId!,
        interactionType as Exclude<ActivityInteractionType, "COMMENTED">,
        contentType
      ),
    enabled: !!userId && !isCommented,
  });
  const interactionIds = idsQuery.data ?? [];

  const postsQuery = useInfiniteQuery({
    queryKey: ["activityPosts", userId, interactionType, contentType, language],
    queryFn: ({ pageParam }) => {
      const start = pageParam as number;
      // `interactionIds` already holds the full, client-side list, so we send
      // the exact window of ids per page and pass page=0 — exactly like the
      // COMMENTED branch. Sending a page index here would double-page against
      // the already-sliced set and return empty results for every page after
      // the first, which is why "load more" appeared to do nothing.
      const slice = interactionIds.slice(start, start + PAGE_SIZE);
      if (slice.length === 0) return [] as PostDto[];
      return fetchPagedPosts(language, slice, 0, slice.length);
    },
    enabled: !!userId && !isCommented && idsQuery.isSuccess,
    initialPageParam: 0,
    getNextPageParam: (_lastPage, allPages) => {
      const nextStart = allPages.length * PAGE_SIZE;
      return nextStart < interactionIds.length ? nextStart : undefined;
    },
  });

  // Commented: paginate comments, then resolve the referenced posts.
  const commentsQuery = useInfiniteQuery({
    queryKey: ["activityComments", userId, commentType],
    queryFn: ({ pageParam }) =>
      apiClient<CommentDto[]>(
        `/api/comments/${userId}?commentType=${commentType}&page=${pageParam}&pageSize=${PAGE_SIZE}`
      ),
    enabled: !!userId && isCommented,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      (lastPage?.length ?? 0) >= PAGE_SIZE ? allPages.length : undefined,
  });

  const comments = commentsQuery.data?.pages.flat() ?? [];
  const commentedPostIds = [
    ...new Set(
      comments
        .map((c) => c.postId)
        .filter((id): id is number => id !== null)
    ),
  ];

  const commentedPostsQuery = useQuery({
    queryKey: [
      "activityCommentedPosts",
      userId,
      commentType,
      language,
      commentedPostIds,
    ],
    queryFn: () => fetchPagedPosts(language, commentedPostIds, 0, commentedPostIds.length),
    enabled: commentedPostIds.length > 0,
    // Each new comments page changes `commentedPostIds`, which changes this
    // query key and would otherwise blank `items` (resetting scroll to top)
    // while the next post batch loads. Keep the previous results on screen so
    // new posts append in place.
    placeholderData: keepPreviousData,
  });

  const items: PostDto[] = isCommented
    ? commentedPostsQuery.data ?? []
    : (postsQuery.data?.pages.flatMap((p) => p ?? []) ?? []);

  const isLoading = isCommented
    ? commentsQuery.isLoading ||
      (commentedPostIds.length > 0 && commentedPostsQuery.isLoading)
    : idsQuery.isLoading || postsQuery.isLoading;

  const hasLoadedOnce = !isLoading;

  const hasMore = isCommented
    ? commentsQuery.hasNextPage
    : postsQuery.hasNextPage;

  const isLoadingMore = isCommented
    ? commentsQuery.isFetchingNextPage || commentedPostsQuery.isFetching
    : postsQuery.isFetchingNextPage;

  const error =
    (isCommented
      ? commentsQuery.error ?? commentedPostsQuery.error
      : idsQuery.error ?? postsQuery.error
    )?.message ?? null;

  const loadNextPage = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore || error) return;
    if (isCommented) {
      commentsQuery.fetchNextPage();
    } else {
      postsQuery.fetchNextPage();
    }
  }, [hasMore, isLoading, isLoadingMore, error, isCommented, commentsQuery, postsQuery]);

  return {
    items,
    comments,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    hasLoadedOnce,
    loadNextPage,
  };
}
