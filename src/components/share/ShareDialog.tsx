"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { userAvatarUrl } from "@/lib/avatar";

interface ShareDialogProps {
  postId: number;
  postTitle: string;
  onClose: () => void;
  /** When set, shares a watchlist instead of a post. getLink resolves the
   *  share URL (owner → minted secret-link; others → current URL incl. st). */
  watchlistTarget?: {
    id: number;
    name: string;
    getLink: () => Promise<string>;
  };
}

function toRelativePath(link: string): string {
  try {
    const url = new URL(link);
    return url.pathname + url.search;
  } catch {
    return link.startsWith("/") ? link : `/watchlist/${link}`;
  }
}

export function ShareDialog({
  postId,
  postTitle,
  onClose,
  watchlistTarget,
}: ShareDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ userId: number; username: string; name: string }[]>([]);
  const [shared, setShared] = useState(false);
  const [searching, setSearching] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await apiClient<{
        success: boolean;
        users: { userId: number; username: string; name: string }[];
      }>(`/api/users/search?q=${encodeURIComponent(value)}`);
      setResults(data.users ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleShare = async (userId: number) => {
    setError(null);
    // Watchlist share: notification carries the share URL (incl. secret
    // link token when applicable) so recipients gain access.
    let posterUrl: string | null = null;
    let type = "SHARE";
    let title = "Shared post";
    let message = `${user?.name ?? user?.username ?? "Someone"} shared "${postTitle}" with you`;
    let contentId = postId;
    let referenceId = 0;

    if (watchlistTarget) {
      type = "WATCHLIST_SHARE";
      title = "Shared watchlist";
      message = `${user?.name ?? user?.username ?? "Someone"} shared the watchlist "${watchlistTarget.name}" with you`;
      contentId = watchlistTarget.id;
      referenceId = watchlistTarget.id;
      try {
        posterUrl = toRelativePath(await watchlistTarget.getLink());
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Couldn't create a shareable link for this list"
        );
        return;
      }
    }

    await apiClient("/api/notifications/send", {
      method: "POST",
      body: JSON.stringify({
        userId,
        type,
        title,
        message,
        referenceId,
        contentId,
        senderName: user?.name ?? user?.username ?? "",
        senderUserId: user?.userId ?? 0,
        posterUrl,
        scheduledFor: null,
      }),
    });
    setShared(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-card rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {shared ? (
          <p className="text-sm text-green-600">Shared successfully!</p>
        ) : (
          <>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searching && (
              <p className="text-xs text-muted-foreground">Searching...</p>
            )}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => handleShare(u.userId)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                    <img
                      src={userAvatarUrl(u.userId, 64)}
                      alt={u.username}
                      className="h-8 w-8"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
