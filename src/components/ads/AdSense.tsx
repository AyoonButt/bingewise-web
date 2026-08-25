"use client";

import Script from "next/script";
import { useConsentStore } from "@/stores/consent-store";
import { getAdClient } from "@/lib/ads";

/**
 * AdSense site-approval mode.
 *
 * Google's review requires the tag reachable without any user interaction, but normal
 * operation must stay consent-gated. Set NEXT_PUBLIC_ADSENSE_VERIFY=true only while
 * your site is pending AdSense approval, then remove it (or set false) so the consent
 * gate applies again. The kill-switch (NEXT_PUBLIC_ADS_ENABLED=false) still wins.
 */
const VERIFY_MODE = process.env.NEXT_PUBLIC_ADSENSE_VERIFY === "true";

export function AdSense() {
  const adConsent = useConsentStore((s) => s.adConsent);
  const client = getAdClient();

  if (!client) return null;
  if (!VERIFY_MODE && adConsent !== true) return null;

  return (
    <Script
      id="adsbygoogle"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
