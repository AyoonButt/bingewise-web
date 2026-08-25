"use client";

import { useState, useCallback, useRef } from "react";
import { searchMulti } from "@/lib/tmdb";
import type { TmdbSearchResult } from "@/types/tmdb";

export function useSearch() {
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const lastQuery = useRef("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string) => {
    lastQuery.current = query;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchMulti(query, 1);
        setResults(data.results);
        setTotalPages(data.total_pages);
        setPage(1);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const loadMore = useCallback(async () => {
    const query = lastQuery.current;
    if (!query.trim() || page >= totalPages) return;
    const nextPage = page + 1;
    const data = await searchMulti(query, nextPage);
    setResults((prev) => [
      ...prev,
      ...data.results,
    ]);
    setPage(nextPage);
  }, [page, totalPages]);

  const refresh = useCallback(async () => {
    const query = lastQuery.current;
    if (!query.trim()) return;
    setIsLoading(true);
    try {
        const data = await searchMulti(query, 1);
        setResults(data.results);
        setTotalPages(data.total_pages);
        setPage(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setPage(1);
    setTotalPages(0);
    lastQuery.current = "";
  }, []);

  return {
    results,
    isLoading,
    search,
    loadMore,
    refresh,
    hasMore: page < totalPages,
    clearResults,
  };
}
