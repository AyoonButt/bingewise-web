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
    images: [
      {
        url: "https://www.bingewise.net/api/og/static/feed",
        width: 1200,
        height: 630,
        alt: "BingeWise – Feed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.bingewise.net/api/og/static/feed"],
  },
  alternates: { canonical: "https://www.bingewise.net/feed" },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
