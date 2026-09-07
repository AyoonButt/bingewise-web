import { cache } from "react";
import { cookies, headers } from "next/headers";
import { normalizeDetail, type WatchlistDetailDTO } from "./watchlist-normalize";
import type { WatchlistDetailResponse } from "@/types/watchlist";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

/**
 * Server-side watchlist detail fetch for SSR + generateMetadata. Mirrors the
 * guest proxy route (/api/guest/watchlists/[id]) but runs directly against the
 * backend so publicly linked watchlists ship fully rendered HTML to crawlers.
 * Wrapped in React cache() so generateMetadata and the page render share one
 * request. Returns null on any failure — the client page then falls back to
 * its normal client-side fetch.
 */
export const fetchWatchlistDetailForRender = cache(
  async (
    id: number,
    shareToken?: string | null
  ): Promise<WatchlistDetailResponse | null> => {
    if (!Number.isFinite(id)) return null;

    const accessToken = cookies().get("accessToken")?.value;
    const requestHeaders = headers();

    const fetchHeaders: Record<string, string> = {};
    if (accessToken) fetchHeaders.Authorization = `Bearer ${accessToken}`;

    // Forward the real client IP so the backend's per-IP rate limiter buckets
    // SSR crawler visits per visitor instead of sharing one server pool.
    const clientIp =
      requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip");
    if (clientIp) fetchHeaders["X-Forwarded-For"] = clientIp;

    const qs = shareToken ? `?st=${encodeURIComponent(shareToken)}` : "";
    try {
      const res = await fetch(`${BACKEND_URL}/api/watchlists/${id}${qs}`, {
        headers: fetchHeaders,
        next: { revalidate: 0 },
      });
      if (!res.ok) return null;
      return normalizeDetail((await res.json()) as WatchlistDetailDTO);
    } catch {
      return null;
    }
  }
);