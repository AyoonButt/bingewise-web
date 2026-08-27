"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

const SITE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://bingewise.net";

/**
 * "Preferred source" recommend-CTA. Placed where users are already in a
 * sharing mindset (e.g. the share dialog) to encourage word-of-mouth, which
 * earns backlinks and brand mentions that help SEO.
 */
export function PreferredSourceBadge() {
  const [copied, setCopied] = useState(false);

  const recommend = async () => {
    const shareData = {
      title: "BingeWise",
      text: "Your go-to source for personalized watchlists and what to watch next.",
      url: SITE_URL,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(SITE_URL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          Your go-to source for what to watch next
        </p>
        <p className="text-xs text-muted-foreground truncate">
          Found a list you love? Share BingeWise with a fellow fan.
        </p>
      </div>
      <button
        onClick={recommend}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 hover:bg-primary/90 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share
          </>
        )}
      </button>
    </div>
  );
}
