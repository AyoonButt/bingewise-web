import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import {
  OgPolaroidCard,
  type OgWatchlistData,
} from "@/lib/og/OgPolaroidCard";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

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

async function fetchWatchlist(id: string): Promise<OgWatchlistData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/watchlists/${id}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const detail = (await res.json()) as {
      watchlist: {
        id: number;
        name: string;
        description?: string | null;
        coverColor?: string | null;
        itemCount: number;
      };
      items: Array<{ title: string; posterPath: string | null }>;
    };
    return {
      id: detail.watchlist.id,
      name: detail.watchlist.name,
      description: detail.watchlist.description ?? null,
      itemCount: detail.watchlist.itemCount,
      accentColor: detail.watchlist.coverColor ?? "#1565C0",
      items: detail.items.map((x) => ({
        title: x.title,
        posterPath: x.posterPath,
      })),
    };
  } catch {
    return null;
  }
}

function fallbackCard(id: string): OgWatchlistData {
  return {
    id: Number(id),
    name: "BingeWise",
    description: "Curated watchlists worth sharing.",
    itemCount: 0,
    accentColor: "#1565C0",
    items: [],
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = (await fetchWatchlist(id)) ?? fallbackCard(id);

  try {
    const image = new ImageResponse(<OgPolaroidCard watchlist={data} />, {
      width: 1200,
      height: 630,
      fonts: await loadFonts(),
    });

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
