"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingReviewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/recommended-for-you");
  }, [router]);

  return null;
}
