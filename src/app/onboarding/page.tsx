"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Tv, Shield, Bell, List, CheckCircle2, ChevronRight, RotateCcw } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { onboardingProgressPercent } from "@/lib/onboarding-progress";
import { analytics } from "@/lib/analytics";
import { isOnboardingAccountGateEnabled } from "@/lib/session";
import { WelcomeBackdrop } from "@/components/onboarding/WelcomeBackdrop";

function acquisitionSource(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("utm_source") ||
    params.get("utm_campaign") ||
    params.get("ref") ||
    document.referrer ||
    undefined
  );
}

const STEPS = [
  { label: "Region & Language", href: "/onboarding/region-language" },
  { label: "Content Rating", href: "/onboarding/ratings" },
  { label: "Streaming", href: "/onboarding/streaming" },
  { label: "Stay Connected", href: "/onboarding/stay-connected" },
  { label: "Vibe Check", href: "/onboarding/vibe-check" },
  { label: "Taste Calibration", href: "/onboarding/taste-calibration" },
  { label: "Recommended For You", href: "/onboarding/recommended-for-you" },
];

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { completedSteps, clear, loadForUser, isOwnedBy, getResumeRoute, markStepCompleted } =
    useOnboardingStore();
  const userId = useAuthStore((s) => s.user?.userId ?? 0);
  const authStatus = useAuthStore((s) => s.authStatus);
  const openSignupPrompt = useUiStore((s) => s.openSignupPrompt);
  const gateEnabled = isOnboardingAccountGateEnabled();
  const [showDetails, setShowDetails] = useState(false);

  const handleSkip = () => {
    analytics.logOnboardingExited(
      "welcome",
      authStatus === "authenticated" ? "/feed" : gateEnabled ? "signup_prompt" : "/feed?guest=1"
    );
    if (authStatus === "authenticated") return;
    if (gateEnabled) {
      openSignupPrompt({ required: true, destination: "/feed" });
    } else {
      router.push("/feed?guest=1");
    }
  };

  useEffect(() => {
    if (authStatus === "restoring") return;
    loadForUser(userId);
  }, [authStatus, loadForUser, userId]);

  const hasProgress =
    completedSteps.some((step) => step !== "welcome") && isOwnedBy(userId);
  const progressPercent = onboardingProgressPercent(completedSteps);
  const completedCount = completedSteps.filter((step) => step !== "welcome").length;
  const remaining = Math.max(0, STEPS.length - Math.min(completedCount, STEPS.length));

  const benefits = [
    {
      icon: Sparkles,
      title: "A feed built for your taste",
      description: "Recommendations matched to the genres, eras, and lengths you actually enjoy.",
    },
    {
      icon: List,
      title: "Lists that plan ahead",
      description: "Save to your own lists, clone curated public ones, and never wonder what's next.",
    },
    {
      icon: Tv,
      title: "Streaming made simple",
      description: "See what's available on the platforms you already pay for, no more hunting.",
    },
    {
      icon: Shield,
      title: "You're in control",
      description: "Set maturity filters, skip the genres you dislike, and tune your feed to fit.",
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <WelcomeBackdrop />
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Top bar */}
      <div className="flex items-center justify-end px-6 h-14 border-b border-border">
        {authStatus === "authenticated" ? (
          <Link
            href="/feed"
            onClick={() => handleSkip()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip setup
          </Link>
        ) : (
          <button type="button" onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip setup
          </button>
        )}
      </div>

      {/* Progress bar (show if resuming) */}
      {hasProgress && (
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>You have progress saved</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-10">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <BrandLogo size="md" className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Stop scrolling. Start watching.
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              There&apos;s so much to watch and no time to sort through it. BingeWise learns what you
              love and serves up a feed of only the stuff worth your evening.
            </p>
          </div>

          {/* Problem → Solution */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Why you&apos;ll love it
              </p>
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <b.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              {showDetails ? "Hide setup details" : "See what you'll set up"}
            </button>

            {showDetails && (
              <div className="pt-2 space-y-1 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Takes about 2-3 minutes. Your preferences are saved automatically.
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>• Region &amp; language</span>
                  <span>• Content rating</span>
                  <span>• Streaming services</span>
                  <span>• Notification settings</span>
                  <span>• Vibe check</span>
                  <span>• Taste calibration</span>
                  <span>• Personalized preview</span>
                  <span>• Save your progress</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  After setup, create watchlists, discover and clone public ones, and follow
                  friends so your feed always has something ready to watch.
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            {hasProgress ? (
              <>
                <button
                  onClick={() => {
                    analytics.logOnboardingResumeUsed(getResumeRoute());
                    router.push(getResumeRoute());
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Resume Setup ({remaining} step{remaining !== 1 ? "s" : ""} left)
                </button>
                <button
                  onClick={() => {
                    analytics.logOnboardingStarted(acquisitionSource());
                    clear();
                    loadForUser(userId);
                    markStepCompleted("welcome");
                    router.push("/onboarding/region-language");
                  }}
                  className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start Fresh
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  analytics.logOnboardingStarted(acquisitionSource());
                  markStepCompleted("welcome");
                  router.push("/onboarding/region-language");
                }}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
