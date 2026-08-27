import type { MetadataRoute } from "next";

const BASE_URL = "https://bingewise.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/feed`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/auth/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/legal/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/legal/faq`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  let userPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${process.env.BACKEND_URL ?? "https://api-bingewise.com"}/api/seo/users`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const users: Array<{ username: string; updatedAt?: string }> = await res.json();
      userPages = users.map((u) => {
        const parsed = u.updatedAt ? new Date(u.updatedAt) : new Date();
        return {
          url: `${BASE_URL}/user/${u.username}`,
          lastModified: Number.isNaN(parsed.getTime()) ? new Date() : parsed,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        };
      });
    }
  } catch {
    // backend unreachable — return static only
  }

  return [...staticPages, ...userPages];
}
