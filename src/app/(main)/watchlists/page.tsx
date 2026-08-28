"use client";

import { useState } from "react";
import { Bookmark, Compass, Plus, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useWatchlists } from "@/hooks/use-watchlists";
import { usePublicWatchlists } from "@/hooks/use-public-watchlists";
import { WatchlistCard } from "@/components/watchlist/WatchlistCard";
import { CreateWatchlistDialog } from "@/components/watchlist/CreateWatchlistDialog";
import { cn } from "@/lib/utils";

type Tab = "discover" | "mine";

export default function WatchlistsPage() {
  const user = useAuthStore((s) => s.user);
  const openSignupPrompt = useUiStore((s) => s.openSignupPrompt);
  const { watchlists, isLoading, isCreating, error, createList } = useWatchlists(
    user?.userId
  );
  // Guests land on Discover; they have no lists of their own.
  const [tab, setTab] = useState<Tab>(user ? "mine" : "discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const publicFeed = usePublicWatchlists(tab === "discover" ? searchQuery : "");

  const handleCreateClick = () => {
    // Guest mode: prompt sign-up instead of opening the dialog
    if (!user) {
      openSignupPrompt();
      return;
    }
    setShowCreate(true);
  };

  const handleCreate = async (
    name: string,
    description: string | null,
    coverColor: string | null
  ) => {
    try {
      await createList(name, description, coverColor);
      setShowCreate(false);
    } catch {
      // keep dialog open; error shown inside it
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Watchlists
        </h1>
        {tab === "mine" && (
          <button
            onClick={handleCreateClick}
            className="btn-primary h-10 px-3.5 sm:px-4 flex items-center gap-2 text-sm whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New List</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-xl bg-muted/60">
        <button
          onClick={() => setTab("discover")}
          className={cn(
            "flex-1 h-9 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2",
            tab === "discover"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Compass className="h-4 w-4" />
          Discover
        </button>
        <button
          onClick={() => setTab("mine")}
          className={cn(
            "flex-1 h-9 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2",
            tab === "mine"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark className="h-4 w-4" />
          My Lists
        </button>
      </div>

      {tab === "discover" ? (
        <DiscoverTab
          query={searchQuery}
          onQueryChange={setSearchQuery}
          feed={publicFeed}
        />
      ) : (
        <MyListsTab
          watchlists={watchlists}
          isLoading={isLoading}
          isGuest={!user}
          onCreateClick={handleCreateClick}
        />
      )}

      <CreateWatchlistDialog
        open={showCreate}
        isCreating={isCreating}
        error={error}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

function DiscoverTab({
  query,
  onQueryChange,
  feed,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  feed: ReturnType<typeof usePublicWatchlists>;
}) {
  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search public watchlists…"
          className="input-base pl-10"
        />
      </div>

      {feed.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-20 bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : feed.error ? (
        <p className="text-sm text-destructive text-center py-10">{feed.error}</p>
      ) : feed.results.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <Compass className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {query.trim()
              ? `No public watchlists match “${query.trim()}”.`
              : "No public watchlists yet. Make one of yours public to appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {feed.results.map((w) => (
            <WatchlistCard key={w.id} watchlist={w} showSharedBy={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyListsTab({
  watchlists,
  isLoading,
  isGuest,
  onCreateClick,
}: {
  watchlists: import("@/types/watchlist").Watchlist[];
  isLoading: boolean;
  isGuest: boolean;
  onCreateClick: () => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-20 bg-muted animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
          <Bookmark className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Create a free account to build watchlists and save movies and shows.
        </p>
        <button
          onClick={onCreateClick}
          className="btn-primary h-10 px-4 inline-flex items-center gap-2 text-sm"
        >
          Sign up free
        </button>
      </div>
    );
  }

  if (watchlists.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
          <Bookmark className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          No watchlists yet. Create one to save movies and shows.
        </p>
        <button
          onClick={onCreateClick}
          className="btn-primary h-10 px-4 inline-flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Create your first watchlist
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {watchlists.map((w) => (
        <WatchlistCard key={w.id} watchlist={w} />
      ))}
    </div>
  );
}
