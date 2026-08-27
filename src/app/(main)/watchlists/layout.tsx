import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Watchlists",
  description:
    "Manage your watchlists. Track shows and movies across all your streaming services in one place.",
  openGraph: {
    title: "My Watchlists",
    description:
      "Manage your watchlists. Track shows and movies across all your streaming services in one place.",
    url: "https://www.bingewise.net/watchlists",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://www.bingewise.net/watchlists" },
};

export default function WatchlistsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
