"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { getLanguageRegion } from "@/lib/locale";
import type { PostDto } from "@/types/post";
import type { WatchlistItem } from "@/types/watchlist";

/**
 * Fallback when no real post exists for a watchlist item (e.g. the media was
 * never added to the posts table). Post-level interactions stay no-ops,
 * matching how the feed system guards on a missing PostDto.postId.
 */
export function watchlistItemToPostDto(item: WatchlistItem): PostDto {
  return {
    postId: null,
    tmdbId: item.tmdbId,
    type: item.mediaType,
    title: item.title,
    releaseDate: item.releaseYear ? String(item.releaseYear) : null,
    overview: item.overview,
    posterPath: item.posterPath,
    voteAverage: 0,
    voteCount: 0,
    originalLanguage: null,
    originalTitle: null,
    popularity: 0,
    genreIds: "",
    postLikeCount: 0,
    trailerLikeCount: 0,
    videoKey: "",
    providerIds: null,
    runtime: null,
    contentRating: null,
  };
}

/**
 * Resolve watchlist items to full language-aware PostDtos so the feed renders
 * with the same components as the interactions feed. Items without a post fall
 * back to a stub built from the stored item fields.
 */
export function useWatchlistFeed(items: WatchlistItem[], enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const language = getLanguageRegion(user);
  const [resolved, setResolved] = useState<Map<string, PostDto>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || items.length === 0) {
      setResolved(new Map());
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    apiClient<PostDto[]>(`/api/posts/by-tmdb/${language}`, {
      method: "POST",
      body: JSON.stringify(
        items.map((item) => ({ tmdbId: item.tmdbId, type: item.mediaType }))
      ),
    })
      .then((posts) => {
        if (cancelled) return;
        const map = new Map<string, PostDto>();
        (posts ?? []).forEach((p) => map.set(`${p.tmdbId}_${p.type}`, p));
        setResolved(map);
      })
      .catch(() => {
        if (!cancelled) setResolved(new Map());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [items, enabled, language]);

  const posts = useMemo<PostDto[]>(
    () => items.map((item) => resolved.get(`${item.tmdbId}_${item.mediaType}`) ?? watchlistItemToPostDto(item)),
    [items, resolved]
  );

  return { posts, isLoading };
}
