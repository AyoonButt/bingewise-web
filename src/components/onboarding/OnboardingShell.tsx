"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { isOnboardingAccountGateEnabled } from "@/lib/session";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { SignupPromptModal } from "@/components/auth/SignupPromptModal";

const steps = [
  { href: "/onboarding", label: "Start", id: "welcome" },
  { href: "/onboarding/region-language", label: "Region", id: "region-language" },
  { href: "/onboarding/ratings", label: "Rating", id: "content-rating" },
  { href: "/onboarding/streaming", label: "Streaming", id: "streaming-services" },
  { href: "/onboarding/stay-connected", label: "Alerts", id: "stay-connected" },
  { href: "/onboarding/vibe-check", label: "Vibe", id: "vibe-check" },
  { href: "/onboarding/taste-calibration", label: "Taste", id: "taste-calibration" },
  { href: "/onboarding/recommended-for-you", label: "For You", id: "recommended-for-you" },
];

const legacySteps: Record<string, number> = {
  "/onboarding/basics": 1,
  "/onboarding/genres": 5,
  "/onboarding/notifications": 4,
  "/onboarding/privacy": 7,
  "/onboarding/review": 7,
};

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.authStatus);
  const openSignupPrompt = useUiStore((s) => s.openSignupPrompt);
  const currentStep = steps.findIndex((s) => s.href === pathname);
  const stepIndex = currentStep >= 0 ? currentStep : (legacySteps[pathname] ?? 0);
  const stepId = currentStep >= 0 ? steps[currentStep].id : pathname.split("/").pop() || "unknown";
  const gateEnabled = isOnboardingAccountGateEnabled();

  useEffect(() => {
    if (authStatus === "restoring") return;
    analytics.logOnboardingStepViewed(stepId);
  }, [authStatus, stepId]);

  const handleSkip = () => {
    analytics.logOnboardingExited(
      stepId,
      authStatus === "authenticated" ? "/feed" : gateEnabled ? "signup_prompt" : "/feed?guest=1"
    );
    if (authStatus === "authenticated") return;
    if (gateEnabled) {
      openSignupPrompt({ required: true, destination: "/feed" });
    } else {
      router.push("/feed?guest=1");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        {authStatus === "authenticated" ? (
          <Link
            href="/feed"
            onClick={() => analytics.logOnboardingExited(stepId, "/feed")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}
        <div className="flex items-center gap-3 w-40">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all",
                stepIndex === 0 && "w-0"
              )}
              style={{
                width: `${(stepIndex / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {stepIndex}/{steps.length - 1}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">{children}</div>
      </div>
      <SignupPromptModal />
    </div>
  );
}
