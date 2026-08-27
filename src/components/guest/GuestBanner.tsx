"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const DISMISS_KEY = "bw-guest-banner-dismissed";

/**
 * Slim conversion banner shown to signed-out visitors on guest-browsable pages.
 * Dismissal persists for the browser (localStorage).
 */
export function GuestBanner() {
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!mounted || user || dismissed) return null;

  return (
    <div className="relative z-30 flex items-center gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20 text-sm">
      <Sparkles className="h-4 w-4 text-primary shrink-0" />
      <p className="flex-1 min-w-0">
        You&rsquo;re browsing as a guest.{" "}
        <Link
          href="/auth/register?from=/feed"
          className="font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Create a free account
        </Link>{" "}
        to like, save, and build watchlists.
      </p>
      <button
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="p-2.5 rounded-lg hover:bg-accent transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
