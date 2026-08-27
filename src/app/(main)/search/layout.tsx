import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for TV shows, movies, and people. Find where to stream any title across Netflix, Hulu, Disney+, and more.",
  openGraph: {
    title: "Search",
    description:
      "Search for TV shows, movies, and people. Find where to stream any title across Netflix, Hulu, Disney+, and more.",
    url: "https://bingewise.net/search",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://bingewise.net/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
