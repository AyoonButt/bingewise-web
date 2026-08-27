"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import type { InteractionStates, UserPostInteractionDto } from "@/types/interactions";

export function useInteractions(userId: number | undefined) {
  const queryClient = useQueryClient();

  const likedQuery = useQuery({
    queryKey: ["likedPosts", userId],
    queryFn: () =>
      apiClient<number[]>(`/api/interactions/liked/user/${userId}`),
    enabled: !!userId,
  });

  const savedQuery = useQuery({
    queryKey: ["savedPosts", userId],
    queryFn: () =>
      apiClient<number[]>(`/api/interactions/saved/user/${userId}`),
    enabled: !!userId,
  });

  const saveInteraction = useMutation({
    mutationFn: (vars: {
      postId: number;
      likeState: boolean;
      saveState: boolean;
    }) => {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error("Not authenticated");
      const now = Date.now();
      const body: UserPostInteractionDto = {
        interactionId: null,
        userId: user.userId,
        postId: vars.postId,
        startTimestamp: now - 1000,
        endTimestamp: now,
        likeState: vars.likeState,
        saveState: vars.saveState,
        commentButtonPressed: false,
      };
      return apiClient("/api/interactions/save", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onMutate: async (vars) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["likedPosts", userId] });
      await queryClient.cancelQueries({ queryKey: ["savedPosts", userId] });

      const previousLiked = queryClient.getQueryData<number[]>(["likedPosts", userId]);
      const previousSaved = queryClient.getQueryData<number[]>(["savedPosts", userId]);

      queryClient.setQueryData<number[]>(["likedPosts", userId], (old = []) =>
        vars.likeState
          ? old.includes(vars.postId) ? old : [...old, vars.postId]
          : old.filter((id) => id !== vars.postId)
      );

      queryClient.setQueryData<number[]>(["savedPosts", userId], (old = []) =>
        vars.saveState
          ? old.includes(vars.postId) ? old : [...old, vars.postId]
          : old.filter((id) => id !== vars.postId)
      );

      return { previousLiked, previousSaved };
    },
    onError: (_err, _vars, context) => {
      if (!userId) return;
      if (context?.previousLiked) {
        queryClient.setQueryData(["likedPosts", userId], context.previousLiked);
      }
      if (context?.previousSaved) {
        queryClient.setQueryData(["savedPosts", userId], context.previousSaved);
      }
    },
  });

  const stateMutations = useCallback(
    (postId: number) => {
      const isCurrentlyLiked = likedQuery.data?.includes(postId) ?? false;
      const isCurrentlySaved = savedQuery.data?.includes(postId) ?? false;
      return { isCurrentlyLiked, isCurrentlySaved };
    },
    [likedQuery.data, savedQuery.data]
  );

  const toggleLike = useCallback(
    (postId: number) => {
      // Guest mode: prompt sign-up instead of hitting the API
      if (!useAuthStore.getState().user) {
        useUiStore.getState().openSignupPrompt();
        return;
      }
      const { isCurrentlyLiked, isCurrentlySaved } = stateMutations(postId);
      saveInteraction.mutate({
        postId,
        likeState: !isCurrentlyLiked,
        saveState: isCurrentlySaved,
      });
    },
    [stateMutations, saveInteraction]
  );

  const toggleSave = useCallback(
    (postId: number) => {
      // Guest mode: prompt sign-up instead of hitting the API
      if (!useAuthStore.getState().user) {
        useUiStore.getState().openSignupPrompt();
        return;
      }
      const { isCurrentlyLiked, isCurrentlySaved } = stateMutations(postId);
      saveInteraction.mutate({
        postId,
        likeState: isCurrentlyLiked,
        saveState: !isCurrentlySaved,
      });
    },
    [stateMutations, saveInteraction]
  );

  const isLiked = useCallback(
    (postId: number) => likedQuery.data?.includes(postId) ?? false,
    [likedQuery.data]
  );

  const isSaved = useCallback(
    (postId: number) => savedQuery.data?.includes(postId) ?? false,
    [savedQuery.data]
  );

  return {
    isLiked,
    isSaved,
    toggleLike,
    toggleSave,
  };
}

export function useInteractionStates(userId: number | undefined, postId: number) {
  return useQuery({
    queryKey: ["interactionStates", userId, postId],
    queryFn: () =>
      apiClient<InteractionStates>(
        `/api/interactions/${userId}/${postId}/states`
      ),
    enabled: !!userId && !!postId,
  });
}
