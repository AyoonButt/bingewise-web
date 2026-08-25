"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  FollowStatsResponse,
  FollowStatusResponse,
  FollowingListResponse,
  FollowersListResponse,
  FollowRecommendationsResponse,
  FollowingUser,
} from "@/types/user";

export function useFollow(userId: number | undefined, targetUserId?: number) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["followStatus", userId, targetUserId],
    queryFn: () =>
      apiClient<FollowStatusResponse>(
        `/api/users/${userId}/following/${targetUserId}/status`
      ),
    enabled: !!userId && !!targetUserId,
  });

  const followMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/users/${userId}/following/${targetUserId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followStatus"] });
      queryClient.invalidateQueries({ queryKey: ["followStats"] });
      queryClient.invalidateQueries({ queryKey: ["followList"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/users/${userId}/following/${targetUserId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followStatus"] });
      queryClient.invalidateQueries({ queryKey: ["followStats"] });
      queryClient.invalidateQueries({ queryKey: ["followList"] });
    },
  });

  const toggleFollow = useCallback(() => {
    if (statusQuery.data?.following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  }, [statusQuery.data?.following, followMutation, unfollowMutation]);

  return {
    isFollowing: statusQuery.data?.following ?? false,
    toggleFollow,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  };
}

export function useFollowList(userId: number, type: "following" | "followers") {
  return useQuery({
    queryKey: ["followList", userId, type],
    queryFn: async (): Promise<FollowingUser[]> => {
      if (type === "followers") {
        const data = await apiClient<FollowersListResponse>(
          `/api/users/${userId}/following/followers`
        );
        return data.followers ?? [];
      }
      const data = await apiClient<FollowingListResponse>(
        `/api/users/${userId}/following`
      );
      return data.following ?? [];
    },
    enabled: !!userId,
  });
}

export function useFollowStats(userId: number | undefined) {
  return useQuery({
    queryKey: ["followStats", userId],
    queryFn: async () => {
      const data = await apiClient<FollowStatsResponse>(
        `/api/users/${userId}/following/stats`
      );
      return data.stats;
    },
    enabled: !!userId,
  });
}

export function useFollowRecommendations(userId: number | undefined) {
  return useQuery({
    queryKey: ["followRecommendations", userId],
    queryFn: async () => {
      const data = await apiClient<FollowRecommendationsResponse>(
        `/api/users/${userId}/following/recommendations?limit=10`
      );
      return data.recommendations ?? [];
    },
    enabled: !!userId,
  });
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["userSearch", query],
    queryFn: async () => {
      const data = await apiClient<{
        success: boolean;
        users: { userId: number; username: string; name: string }[];
      }>(`/api/users/search?q=${encodeURIComponent(query)}`);
      return data.users ?? [];
    },
    enabled: query.trim().length > 0,
  });
}
