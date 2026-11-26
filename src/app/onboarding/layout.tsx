"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const steps = [
  { href: "/onboarding", label: "Start" },
  { href: "/onboarding/region-language", label: "Region" },
  { href: "/onboarding/ratings", label: "Rating" },
  { href: "/onboarding/streaming", label: "Streaming" },
  { href: "/onboarding/stay-connected", label: "Alerts" },
  { href: "/onboarding/vibe-check", label: "Vibe" },
  { href: "/onboarding/taste-calibration", label: "Taste" },
  { href: "/onboarding/recommended-for-you", label: "For You" },
];

const legacySteps: Record<string, number> = {
  "/onboarding/basics": 1,
  "/onboarding/genres": 5,
  "/onboarding/notifications": 4,
  "/onboarding/privacy": 7,
  "/onboarding/review": 7,
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = steps.findIndex((s) => s.href === pathname);
  const stepIndex = currentStep >= 0 ? currentStep : (legacySteps[pathname] ?? 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <div className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <Link
          href="/feed?guest=1"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </Link>
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
    </div>
  );
}
