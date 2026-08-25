"use client";

import { useFollowStats } from "@/hooks/use-follow";
import { useFollow } from "@/hooks/use-follow";
import { userAvatarUrl } from "@/lib/avatar";
import type { UserDto } from "@/types/user";
import { cn } from "@/lib/utils";

interface UserProfileProps {
  user: UserDto;
  currentUserId?: number;
}

export function UserProfile({ user, currentUserId }: UserProfileProps) {
  const { data: stats } = useFollowStats(user.userId);
  const { isFollowing, toggleFollow, isLoading } = useFollow(
    currentUserId,
    user.userId
  );

  const isOwnProfile = currentUserId === user.userId;

  return (
    <div className="flex items-start gap-4 p-4">
      <img
        src={userAvatarUrl(user.userId, 160)}
        alt={user.username}
        className="h-20 w-20 rounded-full"
      />
      <div className="flex-1">
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-muted-foreground">@{user.username}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <span>
            <strong>{stats?.followingCount ?? 0}</strong> following
          </span>
          <span>
            <strong>{stats?.followersCount ?? 0}</strong> followers
          </span>
        </div>
        {!isOwnProfile && (
          <button
            onClick={toggleFollow}
            disabled={isLoading}
            className={cn(
              "mt-3 px-5 py-1.5 text-sm font-medium rounded-full transition-colors",
              isFollowing
                ? "bg-[var(--following-green)] text-white hover:opacity-90"
                : "bg-[var(--follow-blue)] text-white hover:opacity-90"
            )}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </div>
  );
}
