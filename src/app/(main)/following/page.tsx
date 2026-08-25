"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useFollowList, useFollowRecommendations } from "@/hooks/use-follow";
import { FollowButton } from "@/components/profile/FollowButton";
import { apiClient } from "@/lib/api-client";
import { Users, Search as SearchIcon, UserPlus } from "lucide-react";
import { userAvatarUrl } from "@/lib/avatar";
import type { FollowingUser } from "@/types/user";

type Tab = "discover" | "following" | "followers";

function GuestSignupButtons() {
  const openSignupPrompt = useUiStore((s) => s.openSignupPrompt);
  return (
    <div className="flex items-center justify-center gap-3">
      <Link href="/auth/register" className="btn-primary h-10 px-5 inline-flex items-center text-sm">
        Sign up free
      </Link>
      <button
        onClick={openSignupPrompt}
        className="btn-outline h-10 px-5 inline-flex items-center text-sm"
      >
        Learn more
      </button>
    </div>
  );
}

const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "discover", label: "Discover", icon: UserPlus },
  { key: "following", label: "Following", icon: Users },
  { key: "followers", label: "Followers", icon: Users },
];

export default function FollowingPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FollowingUser[]>([]);
  const [searching, setSearching] = useState(false);

  const followingList = useFollowList(user?.userId ?? 0, "following");
  const followersList = useFollowList(user?.userId ?? 0, "followers");
  const recommendations = useFollowRecommendations(user?.userId);

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await apiClient<{
        success: boolean;
        users: FollowingUser[];
      }>(`/api/users/search?q=${encodeURIComponent(value)}`);
      setSearchResults(data.users ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const users =
    activeTab === "discover"
      ? searchQuery
        ? searchResults
        : recommendations.data ?? []
      : activeTab === "following"
      ? followingList.data ?? []
      : followersList.data ?? [];

  const isLoading =
    (activeTab === "following" && followingList.isLoading) ||
    (activeTab === "followers" && followersList.isLoading) ||
    (activeTab === "discover" && !searchQuery && recommendations.isLoading);

  // Guest mode: inline conversion prompt (mirrors mobile's SignUpFunnelPrompt)
  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
          <UserPlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Follow people, grow your feed</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Create a free account to follow friends and discover people with your taste.
          </p>
        </div>
        <GuestSignupButtons />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Following</h2>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "discover" && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users to follow..."
            className="input-base pl-10"
          />
        </div>
      )}

      <div className="space-y-1">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                  <div className="h-2 bg-muted rounded w-1/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          users.map((u) => (
            <div
              key={u.userId}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
            >
              <Link
                href={`/user/${u.username}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="avatar avatar-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  <img
                    src={userAvatarUrl(u.userId, 80)}
                    alt={u.name || u.username}
                    className="h-full w-full rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name || u.username}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{u.username}
                  </p>
                </div>
              </Link>
              {user && user.userId !== u.userId && (
                <FollowButton
                  currentUserId={user.userId}
                  targetUserId={u.userId}
                />
              )}
            </div>
          ))}

        {!isLoading && users.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {activeTab === "discover"
                ? "Discover people to follow"
                : activeTab === "following"
                ? "You're not following anyone yet"
                : "No followers yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
