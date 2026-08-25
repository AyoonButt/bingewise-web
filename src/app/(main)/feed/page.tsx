"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useFeed } from "@/hooks/use-feed";
import { useInteractions } from "@/hooks/use-interactions";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { getLanguageRegion } from "@/lib/locale";
import { FeedList } from "@/components/feed/FeedList";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { Sparkles } from "lucide-react";

export default function FeedPage() {
  const user = useAuthStore((s) => s.user);
  const locale = getLanguageRegion(user);
  const region = locale.split("-")[1] ?? "US";
  const {
    posts,
    loadMore,
    refresh,
    isLoading,
    isFetchingNextPage,
    isRefreshing,
    hasNextPage,
  } = useFeed(user?.userId, locale, region);
  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractions(
    user?.userId
  );

  // Preserve feed scroll when navigating into a poster detail and back.
  useScrollRestoration("/feed", { ready: posts.length > 0 });

  // Re-tapping the Home nav icon while already on the feed refreshes it.
  const contentRefreshSignal = useUiStore((s) => s.contentRefreshSignal);
  useEffect(() => {
    if (contentRefreshSignal === 0) return;
    refresh();
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRefreshSignal]);

  // "Not interested": hide the card locally and persist the signal for the ML pipeline.
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const handleNotInterested = useCallback(
    (postId: number) => {
      const { user } = useAuthStore.getState();
      if (!user) {
        useUiStore.getState().openSignupPrompt();
        return;
      }
      setHiddenIds((prev) => new Set(prev).add(postId));
      apiClient("/api/not-interested", {
        method: "POST",
        body: JSON.stringify({ userId: user.userId, postId }),
      }).catch(() => {});
    },
    []
  );
  const visiblePosts = useMemo(
    () => posts.filter((p) => p.postId == null || !hiddenIds.has(p.postId)),
    [posts, hiddenIds]
  );

  return (
    <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
      <div className="space-y-6">
        <div className="hidden md:flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Your Feed</h2>
        </div>

        <FeedList
          posts={visiblePosts}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage ?? false}
          loadMore={loadMore}
          onLike={toggleLike}
          onSave={toggleSave}
          onNotInterested={handleNotInterested}
          isLiked={isLiked}
          isSaved={isSaved}
        />
      </div>
    </PullToRefresh>
  );
}
