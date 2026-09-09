import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

const FONT_URLS: Record<number, string> = {
  400: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-400-normal.woff",
  500: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-500-normal.woff",
  700: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff",
  900: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-900-normal.woff",
};

const FONT_WEIGHTS = [400, 500, 700, 900] as const;

async function loadFonts() {
  const results = await Promise.all(
    FONT_WEIGHTS.map(async (weight) => {
      const res = await fetch(FONT_URLS[weight]);
      const data = await res.arrayBuffer();
      return { name: "Inter", weight, data };
    })
  );
  return results;
}

const PAGE_DATA: Record<string, { title: string; subtitle: string; accent: string }> = {
  home: {
    title: "Find Your Next Binge",
    subtitle: "Personalized TV & movie recommendations across all your streaming services.",
    accent: "#1565C0",
  },
  explore: {
    title: "Explore",
    subtitle: "Discover trending TV shows and movies. Watch trailers and find your next binge.",
    accent: "#7C3AED",
  },
  feed: {
    title: "Your Feed",
    subtitle: "Personalized recommendations tailored to your taste.",
    accent: "#059669",
  },
  about: {
    title: "About BingeWise",
    subtitle: "Free personalized TV & movie recommendations powered by AI taste profiling.",
    accent: "#D97706",
  },
  faq: {
    title: "FAQ",
    subtitle: "Answers to common questions about BingeWise.",
    accent: "#DC2626",
  },
  search: {
    title: "Search",
    subtitle: "Find any TV show, movie, or person. See where to stream across all services.",
    accent: "#0891B2",
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = PAGE_DATA[slug] ?? PAGE_DATA.home;

  try {
    const image = new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "60px 80px",
            background: `linear-gradient(135deg, ${data.accent}33, #0E0E13, #0E0E13, ${data.accent}55)`,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 22,
              letterSpacing: 8,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            BINGEWISE
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 900,
              marginBottom: 24,
              maxWidth: 800,
            }}
          >
            {data.title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 26,
              lineHeight: 1.4,
              maxWidth: 700,
            }}
          >
            {data.subtitle}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 50,
              left: 80,
              color: "rgba(255,255,255,0.5)",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            www.bingewise.net
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: await loadFonts(),
      }
    );

    return new Response(image.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response("Render failed", { status: 500 });
  }
}
