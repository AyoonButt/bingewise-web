"use client";

import { useFollow } from "@/hooks/use-follow";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

interface FollowButtonProps {
  currentUserId: number;
  targetUserId: number;
}

export function FollowButton({ currentUserId, targetUserId }: FollowButtonProps) {
  const { isFollowing, toggleFollow, isLoading } = useFollow(
    currentUserId,
    targetUserId
  );

  const handleClick = () => {
    // Guest mode: prompt sign-up instead of hitting the API
    if (!useAuthStore.getState().user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    toggleFollow();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
