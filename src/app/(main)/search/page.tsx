"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearch } from "@/hooks/use-search";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { PosterTile } from "@/components/search/PosterTile";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { getTrending } from "@/lib/tmdb";
import type { TmdbSearchResult } from "@/types/tmdb";
import { Search as SearchIcon, TrendingUp, Loader2 } from "lucide-react";

export default function SearchPage() {
  const { results, isLoading, search, loadMore, refresh, hasMore } = useSearch();
  const [query, setQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [trending, setTrending] = useState<TmdbSearchResult[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingPage, setTrendingPage] = useState(1);
  const [trendingHasMore, setTrendingHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Preserve results scroll when navigating into a poster detail and back.
  useScrollRestoration("/search", {
    ready: query ? results.length > 0 : trending.length > 0,
  });

  // Trending content for the empty-query state (mobile parity).
  useEffect(() => {
    let cancelled = false;
    getTrending()
      .then((data) => {
        if (!cancelled) {
          setTrending(
            (data.results ?? []).filter(
              (r) => r.media_type === "movie" || r.media_type === "tv"
            )
          );
          setTrendingHasMore((data.total_pages ?? 1) > 1);
        }
      })
      .catch(() => {
        // Trending is best-effort; section just hides on failure.
      })
      .finally(() => {
        if (!cancelled) setTrendingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMoreTrending = useCallback(async () => {
    if (trendingLoading || !trendingHasMore || query) return;
    setTrendingLoading(true);
    try {
      const next = trendingPage + 1;
      const data = await getTrending(next);
      const fresh = (data.results ?? []).filter(
        (r) => r.media_type === "movie" || r.media_type === "tv"
      );
      setTrending((prev) => [...prev, ...fresh]);
      setTrendingPage(next);
      setTrendingHasMore(next < (data.total_pages ?? next));
    } catch {
      setTrendingHasMore(false);
    } finally {
      setTrendingLoading(false);
    }
  }, [trendingLoading, trendingHasMore, trendingPage, query]);

  // Infinite scroll for trending
  const trendingSentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) loadMoreTrending();
        },
        { rootMargin: "400px" }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [loadMoreTrending]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      search(value);
    },
    [search]
  );

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMore();
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loadMore]);

  const showSkeleton = isLoading && !!query.trim();
  const showEmptyState =
    !isLoading && !!query.trim() && results.length === 0;
  const showResults = !isLoading && !!query.trim() && results.length > 0;

  return (
    <PullToRefresh onRefresh={refresh} refreshing={isLoading}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SearchIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Search</h2>
        </div>

        <SearchBar onSearch={handleSearch} />

        {/* Skeleton replaces everything while a search runs (no ghost rows). */}
        {showSkeleton && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[2/3] rounded-xl skeleton" />
                <div className="h-3 skeleton rounded w-3/4" />
                <div className="h-2 skeleton rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {showEmptyState && (
          <div className="text-center py-16 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
              <SearchIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {showResults && (
          <SearchResults
            results={results}
            query={query}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
          />
        )}

        {/* Empty-query landing: endless trending content (mobile parity). */}
        {!query && (
          <div className="space-y-4">
            {trendingLoading && trending.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[2/3] rounded-xl skeleton" />
                    <div className="h-3 skeleton rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              trending.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Trending today</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {trending.map((item, idx) => {
                      const title =
                        "title" in item
                          ? item.title
                          : "name" in item
                            ? item.name
                            : "";
                      const posterPath =
                        "poster_path" in item ? item.poster_path : null;
                      const date =
                        "release_date" in item
                          ? item.release_date
                          : "first_air_date" in item
                            ? item.first_air_date
                            : "";
                      return (
                        <PosterTile
                          key={`${item.id}-${idx}`}
                          href={`/post/${item.id}?type=${item.media_type}`}
                          title={title}
                          subtitle={date?.split("-")[0]}
                          posterPath={posterPath}
                        />
                      );
                    })}
                  </div>

                  {trendingLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {trendingHasMore && (
                    <div
                      ref={trendingSentinelCallback}
                      className="h-4"
                      aria-hidden
                    />
                  )}
                </>
              )
            )}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
