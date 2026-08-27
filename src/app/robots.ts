import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/settings/", "/onboarding/", "/notifications/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Bytespider",
          "CCBot",
          "anthropic-ai",
          "cohere-ai",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://www.bingewise.net/sitemap.xml",
  };
}
