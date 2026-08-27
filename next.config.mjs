/**
 * Security headers applied to every response.
 * CSP is tuned for the site's real integrations: TMDB images, dicebear
 * avatars, Google AdSense, YouTube embeds, and Firebase web push.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // AdSense + Next.js inline/eval requirements + YouTube IFrame API.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://www.googletagmanager.com https://fcmregistrations.google.com https://www.youtube.com",
      "style-src 'self' 'unsafe-inline'",
      // TMDB posters, dicebear avatars, ad creative images.
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      // Backend API + Firebase + any websocket notifications channel.
      "connect-src 'self' https: wss:",
      // YouTube trailer embeds and AdSense safeframes.
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://googleads.g.doubleclick.net https://*.safeframe.googlesyndication.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.themoviedb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.justwatch.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
