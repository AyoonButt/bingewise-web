"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useConsentStore } from "@/stores/consent-store";

/**
 * Implied-consent cookie/ad banner:
 * - Ads cannot be opted out of; continuing to browse (scrolling or navigating)
 *   constitutes acceptance of ads and the terms they're governed by.
 * - Analytics IS optional — users may explicitly turn it off.
 * - Links to Terms of Service and Privacy Policy.
 */
export function ConsentBanner() {
  const hasDecided = useConsentStore((s) => s.adConsent !== null);
  const setConsent = useConsentStore((s) => s.setConsent);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // Pathname on first render; if the user navigates away without choosing,
  // that counts as continued use = implicit acceptance.
  const initialPath = useRef(pathname);

  // Avoid SSR/CSR hydration mismatch — only render after mount.
  useEffect(() => setMounted(true), []);

  // Implicit acceptance on navigation without an explicit choice.
  useEffect(() => {
    if (!mounted || !initialPath.current) return;
    if (!hasDecided && pathname !== initialPath.current) {
      setConsent(true, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted]);

  // Implicit acceptance on scroll (continuing to use the site).
  useEffect(() => {
    if (!mounted || hasDecided) return;
    const onScroll = () => {
      if (window.scrollY > 120) {
        setConsent(true, true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted, hasDecided, setConsent]);

  if (!mounted || hasDecided) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[80] p-4 pb-20 sm:pb-4 bg-card border-t border-border shadow-2xl">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground flex-1 leading-relaxed">
          We use cookies to serve ads and optional analytics. By continuing to
          use BingeWise you agree to ads and our{" "}
          <Link
            href="/legal/terms"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setConsent(true, false)}
            className="btn-outline h-11 px-4 text-xs sm:text-sm whitespace-nowrap"
          >
            Accept essential only
          </button>
          <button
            onClick={() => setConsent(true, true)}
            className="btn-primary h-11 px-4 text-xs sm:text-sm whitespace-nowrap"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
