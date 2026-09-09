import type { Metadata } from "next";
import { fetchWatchlistDetailForRender } from "@/lib/watchlist-server";
import WatchlistDetailPage from "./watchlist-detail";

const BASE_URL = "https://www.bingewise.net";

function getShareToken(
  searchParams: { [key: string]: string | string[] | undefined }
): string | null {
  const st = searchParams.st;
  return typeof st === "string" ? st : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const watchlistId = Number(params.id);
  const data = await fetchWatchlistDetailForRender(
    watchlistId,
    getShareToken(searchParams)
  );

  if (!data) {
    return { title: "Watchlist" };
  }

  const { watchlist } = data;
  const description =
    watchlist.description ||
    `A public watchlist of ${watchlist.itemCount} ${
      watchlist.itemCount === 1 ? "title" : "titles"
    } curated on BingeWise.`;
  const canonical = `${BASE_URL}/watchlist/${watchlistId}`;

  return {
    title: watchlist.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${watchlist.name} | Watchlist`,
      description,
      url: canonical,
      siteName: "BingeWise",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/${watchlistId}`,
          width: 1200,
          height: 630,
          alt: `${watchlist.name} – BingeWise watchlist`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${watchlist.name} | Watchlist`,
      description,
      images: [`${BASE_URL}/api/og/${watchlistId}`],
    },
  };
}

export default async function WatchlistPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const watchlistId = Number(params.id);
  // Server-render the list so public watchlists ship real content (name,
  // items, collaborators) in the HTML for crawlers and share-link recipients.
  // If it fails (private list w/o token, backend hiccup) the client component
  // falls back to its own fetch and shows the normal error/empty states.
  const initialData = await fetchWatchlistDetailForRender(
    watchlistId,
    getShareToken(searchParams)
  );

  return <WatchlistDetailPage initialData={initialData} />;
}