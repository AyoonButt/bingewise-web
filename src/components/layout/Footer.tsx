import Link from "next/link";
import { BingeWiseWordmark } from "@/components/ui/brand-logo";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/bingewise_official",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@bingewise_official",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.93a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.36z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/bingewise_official",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/bingewise_official",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.4-5.93s-.36-.72-.36-1.78c0-1.66.97-2.9 2.17-2.9 1.02 0 1.52.77 1.52 1.69 0 1.03-.65 2.56-1 3.98-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.26 3.78-5.52 0-2.89-2.07-4.9-5.03-4.9-3.43 0-5.44 2.57-5.44 5.23 0 1.03.4 2.14.9 2.74a.36.36 0 0 1 .08.35l-.33 1.36c-.05.22-.18.27-.41.16-1.52-.71-2.47-2.94-2.47-4.73 0-3.85 2.8-7.39 8.06-7.39 4.23 0 7.52 3.02 7.52 7.05 0 4.21-2.65 7.59-6.33 7.59-1.24 0-2.4-.64-2.8-1.4l-.76 2.91c-.28 1.06-1.03 2.4-1.54 3.21A12 12 0 1 0 12 0z" />
      </svg>
    ),
  },
];

const productLinks = [
  { label: "Feed", href: "/feed" },
  { label: "Explore", href: "/explore" },
  { label: "Search", href: "/search" },
  { label: "Watchlists", href: "/watchlists" },
  { label: "Following", href: "/following" },
];

const companyLinks = [
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/legal/about" },
  { label: "FAQ", href: "/legal/faq" },
  { label: "Support", href: "/legal/support" },
];

const legalLinks = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Account Deletion", href: "/legal/account-deletion" },
];

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <BingeWiseWordmark className="text-xl font-bold tracking-tight" />
            <p className="mt-3 text-sm text-zinc-500">
              Discover your next binge.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-200 transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">
              Product
            </h3>
            <ul className="space-y-0.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">Company</h3>
            <ul className="space-y-0.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">Legal</h3>
            <ul className="space-y-0.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">
              Attribution
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                Powered by{" "}
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
                >
                  TMDB
                </a>
              </li>
              <li>
                Streaming data from{" "}
                <a
                  href="https://www.justwatch.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
                >
                  JustWatch
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 text-center">
            &copy; 2026 BingeWise. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600 text-center mt-2">
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
