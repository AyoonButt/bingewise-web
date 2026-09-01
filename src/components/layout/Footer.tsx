import Link from "next/link";
import { BingeWiseWordmark } from "@/components/ui/brand-logo";

const productLinks = [
  { label: "Feed", href: "/feed" },
  { label: "Explore", href: "/explore" },
  { label: "Search", href: "/search" },
  { label: "Watchlists", href: "/watchlists" },
  { label: "Following", href: "/following" },
];

const legalLinks = [
  { label: "About", href: "/legal/about" },
  { label: "FAQ", href: "/legal/faq" },
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
