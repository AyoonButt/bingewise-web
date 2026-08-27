import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Following",
  description:
    "See what the community is watching. Follow fans with similar taste and discover new recommendations.",
  openGraph: {
    title: "Following",
    description:
      "See what the community is watching. Follow fans with similar taste and discover new recommendations.",
    url: "https://bingewise.net/following",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://bingewise.net/following" },
};

export default function FollowingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
