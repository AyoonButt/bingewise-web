import type { MetadataRoute } from "next";

const BASE_URL = "https://www.bingewise.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/feed`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/watchlists`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/following`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog/best-movies-2026`, lastModified: new Date("2026-01-15"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog/building-the-perfect-watchlist`, lastModified: new Date("2026-01-10"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog/streaming-fatigue-solutions`, lastModified: new Date("2025-12-28"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog/hidden-gems-on-netflix`, lastModified: new Date("2025-12-20"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog/tv-series-to-binge-this-year`, lastModified: new Date("2025-12-15"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/legal/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/legal/faq`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/legal/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/account-deletion`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  return staticPages;
}