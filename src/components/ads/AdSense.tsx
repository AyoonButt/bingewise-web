"use client";

import Script from "next/script";
import { useConsentStore } from "@/stores/consent-store";
import { getAdClient } from "@/lib/ads";

/**
 * AdSense — consent-gated in normal operation.
 * During site approval, the root layout (server component) renders the script
 * directly via the ADSENSE_VERIFY env var (no NEXT_PUBLIC_ prefix needed).
 */
export function AdSense() {
  const adConsent = useConsentStore((s) => s.adConsent);
  const client = getAdClient();

  if (!client) return null;
  if (adConsent !== true) return null;

  return (
    <Script
      id="adsbygoogle"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
