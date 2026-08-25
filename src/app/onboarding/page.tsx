"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clapperboard, Sparkles, Tv, Shield, Bell, List, CheckCircle2, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";

const STEPS = [
  { label: "Basics", href: "/onboarding/basics" },
  { label: "Genres", href: "/onboarding/genres" },
  { label: "Streaming", href: "/onboarding/streaming" },
  { label: "Ratings", href: "/onboarding/ratings" },
  { label: "Alerts", href: "/onboarding/notifications" },
  { label: "Privacy", href: "/onboarding/privacy" },
  { label: "Review", href: "/onboarding/review" },
];

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { completedSteps, clear } = useOnboardingStore();
  const [showDetails, setShowDetails] = useState(false);

  const hasProgress = completedSteps.length > 0;
  const progressPercent = Math.round((completedSteps.length / STEPS.length) * 100);
  const remaining = STEPS.length - completedSteps.length;

  const benefits = [
    {
      icon: Sparkles,
      title: "A feed built for your taste",
      description: "Recommendations matched to the genres, eras, and lengths you actually enjoy.",
    },
    {
      icon: List,
      title: "Watchlists that plan ahead",
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clapperboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">BingeWise</span>
        </Link>
        <Link
          href="/feed"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip setup
        </Link>
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
              <Clapperboard className="h-7 w-7 text-primary" />
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
                  <span>• Language &amp; region</span>
                  <span>• Movie &amp; TV preferences</span>
                  <span>• Streaming services</span>
                  <span>• Preferred genres</span>
                  <span>• Content rating filter</span>
                  <span>• Notification settings</span>
                  <span>• Account privacy</span>
                  <span>• Review &amp; preview</span>
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
                  onClick={() => router.push(STEPS[completedSteps.length]?.href ?? "/onboarding/basics")}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Resume Setup ({remaining} step{remaining !== 1 ? "s" : ""} left)
                </button>
                <button
                  onClick={() => {
                    clear();
                    router.push("/onboarding/basics");
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
                onClick={() => router.push("/onboarding/basics")}
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
  );
}
