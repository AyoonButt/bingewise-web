import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free BingeWise account to get personalized TV show and movie recommendations across all your streaming services.",
  openGraph: {
    title: "Create Account",
    description:
      "Create a free BingeWise account to get personalized TV show and movie recommendations across all your streaming services.",
    url: "https://bingewise.net/auth/register",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://bingewise.net/auth/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
