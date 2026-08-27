import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Explore trending TV shows and movies. Watch trailers, discover new releases, and find your next binge across all streaming services.",
  openGraph: {
    title: "Explore",
    description:
      "Explore trending TV shows and movies. Watch trailers, discover new releases, and find your next binge across all streaming services.",
    url: "https://www.bingewise.net/explore",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://www.bingewise.net/explore" },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
