import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to BingeWise to access your personalized recommendations, watchlists, and community.",
  openGraph: {
    title: "Sign In",
    description:
      "Sign in to BingeWise to access your personalized recommendations, watchlists, and community.",
    url: "https://bingewise.net/auth/login",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://bingewise.net/auth/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
