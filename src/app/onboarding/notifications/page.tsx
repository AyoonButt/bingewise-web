"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy bookmarked route. The active wizard uses /onboarding/stay-connected,
 * which only offers the per-device web alert choice the web can actually honor.
 */
export default function OnboardingNotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/stay-connected");
  }, [router]);

  return null;
}
