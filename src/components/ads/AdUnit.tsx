"use client";

import { useEffect, useRef } from "react";
import { useConsentStore } from "@/stores/consent-store";
import { AD_SLOTS, getAdClient, type AdPlacement } from "@/lib/ads";
import { analytics } from "@/lib/analytics";

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
  const impressedRef = useRef(false);
  const reportedLoadRef = useRef(false);

  const client = getAdClient();
  const slot = AD_SLOTS[placement];
  const active = !!client && !!slot && adConsent === true;

  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const w = window as unknown as { adsbygoogle?: unknown[] };
    w.adsbygoogle = w.adsbygoogle || [];
    analytics.logAdPreloadStarted(placement);
    try {
      w.adsbygoogle.push({});
    } catch (e) {
      analytics.logAdLoadFailure(
        placement,
        e instanceof Error ? e.message : "push-failed"
      );
    }
  }, [active, client, slot, placement]);

  // AdSense sets data-ad-status on the <ins> once it fills (or doesn't).
  // Best-effort load success/failure reporting for the ad-health dashboard.
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const ins = el.querySelector("ins.adsbygoogle");
    if (!ins) return;
    const observer = new MutationObserver(() => {
      const status = ins.getAttribute("data-ad-status");
      if (status === "filled" && !reportedLoadRef.current) {
        reportedLoadRef.current = true;
        analytics.logAdLoadSuccess(placement);
        observer.disconnect();
      } else if (status === "unfilled" && !reportedLoadRef.current) {
        reportedLoadRef.current = true;
        analytics.logAdLoadFailure(placement, "unfilled");
        observer.disconnect();
      }
    });
    observer.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });
    return () => observer.disconnect();
  }, [active, placement]);

  // Viewable impression: fire once when the slot is at least half in view.
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el || impressedRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !impressedRef.current) {
          impressedRef.current = true;
          analytics.logAdImpression(placement);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, placement]);

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
