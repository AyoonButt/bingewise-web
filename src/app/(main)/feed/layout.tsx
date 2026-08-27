import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed",
  description:
    "Your personalized feed of TV show and movie recommendations. Discover trending content, trailers, and fan picks tailored to your taste on BingeWise.",
  openGraph: {
    title: "Feed",
    description:
      "Your personalized feed of TV show and movie recommendations. Discover trending content, trailers, and fan picks tailored to your taste on BingeWise.",
    url: "https://www.bingewise.net/feed",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://www.bingewise.net/feed" },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
