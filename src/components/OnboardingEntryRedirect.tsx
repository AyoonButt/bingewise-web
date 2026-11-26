"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { FIRST_VISIT_KEY, isNewOnboardingEnabled } from "@/lib/session";

export function OnboardingEntryRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.authStatus);

  useEffect(() => {
    if (!isNewOnboardingEnabled()) return;
    if (authStatus !== "guest") return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const bypassParams = ["guest", "invite", "watchlistId", "from"];
    if (bypassParams.some((key) => params.has(key))) {
      localStorage.setItem(FIRST_VISIT_KEY, "1");
      return;
    }
    if (localStorage.getItem(FIRST_VISIT_KEY) === "1") return;
    localStorage.setItem(FIRST_VISIT_KEY, "1");
    router.replace("/onboarding");
  }, [authStatus, router]);

  return <>{children}</>;
}
