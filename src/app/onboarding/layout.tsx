"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const steps = [
  { href: "/onboarding", label: "Start", step: 0 },
  { href: "/onboarding/basics", label: "Basics", step: 1 },
  { href: "/onboarding/genres", label: "Genres", step: 2 },
  { href: "/onboarding/streaming", label: "Streaming", step: 3 },
  { href: "/onboarding/ratings", label: "Ratings", step: 4 },
  { href: "/onboarding/notifications", label: "Alerts", step: 5 },
  { href: "/onboarding/privacy", label: "Privacy", step: 6 },
  { href: "/onboarding/review", label: "Review", step: 7 },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = steps.findIndex((s) => pathname === s.href);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip
        </Link>
        <div className="flex items-center gap-3 w-40">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all",
                currentStep === 0 && "w-0"
              )}
              style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.max(currentStep, 0)}/{steps.length - 1}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}
