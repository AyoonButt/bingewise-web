import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Footer } from "@/components/layout/Footer";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "BingeWise",
    template: "%s | BingeWise",
  },
  description:
    "Discover your next favorite TV show and movie. BingeWise learns what you love and serves personalized recommendations across all your streaming services.",
  applicationName: "BingeWise - Movies and TV",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/bingewise_appicon.png", type: "image/png" },
    ],
    apple: "/images/bingewise_appicon.png",
  },
  openGraph: {
    siteName: "BingeWise - Movies and TV",
    type: "website",
    locale: "en_US",
    url: "https://www.bingewise.net",
  },
  twitter: {
    card: "summary_large_image",
  },
  metadataBase: new URL("https://www.bingewise.net"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const verifyMode = process.env.ADSENSE_VERIFY === "true";

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        {verifyMode && adClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
