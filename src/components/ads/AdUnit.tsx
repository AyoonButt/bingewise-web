"use client";

import { useEffect, useRef } from "react";
import { useConsentStore } from "@/stores/consent-store";
import { AD_SLOTS, getAdClient, type AdPlacement } from "@/lib/ads";

/**
 * Consent- and flag-gated AdSense display unit.
 *
 * - Renders nothing until ad consent is granted AND the placement is enabled
 *   (master flag + slot ID configured — see src/lib/ads.ts)
 * - Reserves vertical space so slots don't cause layout shift when filled
 * - Queue pattern: pushes into window.adsbygoogle even before the library loads;
 *   AdSense processes queued entries once adsbygoogle.js initializes.
 */
export function AdUnit({
  placement,
  className,
  minHeight = 120,
}: {
  placement: AdPlacement;
  className?: string;
  minHeight?: number;
}) {
  const adConsent = useConsentStore((s) => s.adConsent);
  const ref = useRef<HTMLDivElement>(null);

  const client = getAdClient();
  const slot = AD_SLOTS[placement];
  const active = !!client && !!slot && adConsent === true;

  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const w = window as unknown as { adsbygoogle?: unknown[] };
    w.adsbygoogle = w.adsbygoogle || [];
    try {
      w.adsbygoogle.push({});
    } catch {
      // Ignore — AdSense will scan the DOM once ready.
    }
  }, [active, client, slot]);

  if (!active) return null;

  return (
    <div ref={ref} className={className} style={{ minHeight }} aria-hidden="true">
      {/* client/slot are non-null when active */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client as string}
        data-ad-slot={slot as string}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
