"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { PostDto } from "@/types/post";
import type {
  FollowActionResponse,
  FollowStatusResponse,
  UserDto,
} from "@/types/user";

export interface UserProfilePreferences {
  userId: number;
  language: string;
  region: string;
  minMovie: number | null;
  maxMovie: number | null;
  minTv: number | null;
  maxTv: number | null;
  oldestDate: string;
  recentDate: string;
  isPrivate?: boolean;
  private?: boolean;
  contentRatingAge?: number;
  subscriptions?: number[];
  genreIds?: number[];
  avoidGenreIds?: number[];
}

const PENDING_REQUESTS_KEY = "bw_pending_follow_requests";

function readPendingRequests(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_REQUESTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function writePendingRequests(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("bw-pending-follow-changed"));
  } catch {
    // storage unavailable
  }
}

export function addPendingFollowRequest(targetUserId: number) {
  const current = readPendingRequests();
  if (!current.includes(targetUserId)) {
    writePendingRequests([...current, targetUserId]);
  }
}

export function removePendingFollowRequest(targetUserId: number) {
  writePendingRequests(readPendingRequests().filter((id) => id !== targetUserId));
}

export function useProfileFollow(
  currentUserId: number | undefined,
  targetUser: Pick<UserDto, "userId" | "isPrivate"> | undefined
) {
  const queryClient = useQueryClient();
  const targetUserId = targetUser?.userId;
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setPendingIds(readPendingRequests());
    sync();
    window.addEventListener("bw-pending-follow-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bw-pending-follow-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const statusQuery = useQuery({
    queryKey: ["followStatus", currentUserId, targetUserId],
    queryFn: () =>
      apiClient<FollowStatusResponse>(
        `/api/users/${currentUserId}/following/${targetUserId}/status`
      ),
    enabled: !!currentUserId && !!targetUserId,
  });

  const followMutation = useMutation({
    mutationFn: () =>
      apiClient<FollowActionResponse>(
        `/api/users/${currentUserId}/following/${targetUserId}`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followStatus"] });
      queryClient.invalidateQueries({ queryKey: ["followStats"] });
      queryClient.invalidateQueries({ queryKey: ["followList"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () =>
      apiClient<FollowActionResponse>(
        `/api/users/${currentUserId}/following/${targetUserId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followStatus"] });
      queryClient.invalidateQueries({ queryKey: ["followStats"] });
      queryClient.invalidateQueries({ queryKey: ["followList"] });
    },
  });

  const isFollowing = statusQuery.data?.following ?? false;
  const isPending = !!targetUserId && pendingIds.includes(targetUserId);

  // A pending request that was accepted shows up as following - clear the local flag.
  useEffect(() => {
    if (isFollowing && targetUserId && pendingIds.includes(targetUserId)) {
      removePendingFollowRequest(targetUserId);
    }
  }, [isFollowing, targetUserId, pendingIds]);

  const toggleFollow = useCallback(() => {
    if (!currentUserId || !targetUserId || !targetUser) return;

    if (isFollowing) {
      unfollowMutation.mutate();
      removePendingFollowRequest(targetUserId);
      return;
    }

    if (isPending) {
      // Cancel a locally-tracked request to a private account.
      removePendingFollowRequest(targetUserId);
      return;
    }

    if (targetUser.isPrivate) {
      // Private accounts are handled client-side, matching the mobile app:
      // no follow API call — just local pending tracking + a push notification
      // so the target can accept/reject from their notifications inbox.
      addPendingFollowRequest(targetUserId);
      const { user: me } = useAuthStore.getState();
      if (me) {
        apiClient("/api/notifications/send", {
          method: "POST",
          body: JSON.stringify({
            userId: targetUserId,
            type: "FOLLOW_REQUEST",
            title: "New follow request",
            message: `${me.name || me.username} (@${me.username}) wants to follow you`,
            referenceId: me.userId,
            contentId: me.userId,
            senderName: me.name || me.username,
            senderUserId: me.userId,
          }),
        }).catch(() => {
          // best-effort; request still tracked locally
        });
      }
      return;
    }

    followMutation.mutate(undefined, {
      onSuccess: (response) => {
        const message = response?.message ?? "";
        const treatedAsRequest =
          message.toLowerCase().includes("request") ||
          message.toLowerCase().includes("pending");
        if (treatedAsRequest) {
          addPendingFollowRequest(targetUserId);
        }
      },
    });
  }, [
    currentUserId,
    targetUserId,
    targetUser,
    isFollowing,
    isPending,
    followMutation,
    unfollowMutation,
  ]);

  return {
    isFollowing,
    isPending,
    toggleFollow,
    isLoading:
      followMutation.isPending ||
      unfollowMutation.isPending ||
      statusQuery.isFetching,
    isStatusKnown: statusQuery.isSuccess,
  };
}

function isForbiddenError(error: Error | null | undefined): boolean {
  const msg = error?.message ?? "";
  return msg.includes("403") || msg.includes("Forbidden");
}

function shouldRetry(failureCount: number, error: Error): boolean {
  // Never retry auth failures — surface the locked/private state immediately.
  const msg = error?.message ?? "";
  if (msg.includes("403") || msg.includes("401")) return false;
  return failureCount < 2;
}

export function useUserProfileData(userId: number | undefined) {
  const prefsQuery = useQuery({
    queryKey: ["userProfilePreferences", userId],
    queryFn: () =>
      apiClient<UserProfilePreferences>(`/api/users/${userId}/preferences`),
    enabled: !!userId,
    retry: shouldRetry,
  });

  const preferences = prefsQuery.data ?? null;

  const genreIds = preferences?.genreIds ?? [];
  const subscriptionIds = preferences?.subscriptions ?? [];

  const genreNamesQuery = useQuery({
    queryKey: ["profileGenreNames", genreIds],
    queryFn: () =>
      apiClient<string[]>(
        `/api/genres/names?ids=${genreIds.join(",")}`
      ),
    enabled: genreIds.length > 0,
  });

  const providerNamesQuery = useQuery({
    queryKey: ["profileProviderNames", subscriptionIds],
    queryFn: () =>
      apiClient<string[]>(
        `/api/providers/names?ids=${subscriptionIds.join(",")}`
      ),
    enabled: subscriptionIds.length > 0,
  });

  // The app resolves top liked posts in the *target user's* language (first 2 chars).
  const language = preferences?.language?.slice(0, 2) || "en";

  const topLikedQuery = useQuery({
    queryKey: ["userTopLikedPosts", userId, language],
    queryFn: () =>
      apiClient<PostDto[]>(
        `/api/interactions/top-liked/user/${userId}?language=${language}`
      ),
    enabled: !!userId && prefsQuery.isSuccess,
  });

  return {
    preferences,
    isLoadingPreferences: prefsQuery.isLoading,
    preferencesError: prefsQuery.isError ? prefsQuery.error?.message : null,
    preferencesForbidden: prefsQuery.isError && isForbiddenError(prefsQuery.error),
    genreNames: genreNamesQuery.data ?? [],
    providerNames: providerNamesQuery.data ?? [],
    topLikedPosts: topLikedQuery.data ?? [],
    isLoadingTopLiked: topLikedQuery.isLoading,
  };
}
