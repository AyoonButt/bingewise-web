"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { FIRST_VISIT_KEY, isNewOnboardingEnabled } from "@/lib/session";

/** Shared links that open one specific post, as opposed to a feed/list page. */
function isPostDeepLink(pathname: string): boolean {
  return (
    pathname.startsWith("/post/") || pathname.startsWith("/activity/item/")
  );
}

/**
 * Mounted globally: first-time guests land in onboarding from the home page,
 * while shared watchlist/post links open their target without interruption and
 * count as a completed first visit.
 */
export function OnboardingEntryRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((s) => s.authStatus);

  useEffect(() => {
    if (!isNewOnboardingEnabled()) return;
    if (authStatus !== "guest") return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isSharedLink =
      params.has("invite") ||
      params.has("watchlistId") ||
      isPostDeepLink(pathname);

    if (isSharedLink) {
      localStorage.setItem(FIRST_VISIT_KEY, "1");
      return;
    }

    // Only the home page starts setup; other direct entries keep their target.
    if (pathname !== "/") return;
    if (localStorage.getItem(FIRST_VISIT_KEY) === "1") return;
    localStorage.setItem(FIRST_VISIT_KEY, "1");
    router.replace("/onboarding");
  }, [authStatus, pathname, router]);

  return null;
}
