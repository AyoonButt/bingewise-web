import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for TV shows, movies, and people. Find where to stream any title across Netflix, Hulu, Disney+, and more.",
  openGraph: {
    title: "Search",
    description:
      "Search for TV shows, movies, and people. Find where to stream any title across Netflix, Hulu, Disney+, and more.",
    url: "https://www.bingewise.net/search",
    siteName: "BingeWise",
    type: "website",
    images: [
      {
        url: "https://www.bingewise.net/api/og/static/search",
        width: 1200,
        height: 630,
        alt: "BingeWise – Search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.bingewise.net/api/og/static/search"],
  },
  alternates: { canonical: "https://www.bingewise.net/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
