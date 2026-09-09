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
  applicationName: "BingeWise",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/images/bingewise_192.png", type: "image/png", sizes: "192x192" },
      { url: "/images/bingewise_512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/images/bingewise_180.png", sizes: "180x180", type: "image/png" },
      { url: "/images/bingewise_appicon.png", sizes: "1024x1024" },
    ],
  },
  openGraph: {
    siteName: "BingeWise",
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
