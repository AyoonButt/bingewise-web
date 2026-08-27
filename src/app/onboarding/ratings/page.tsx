"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore, CONTENT_RATINGS, type ContentRating } from "@/stores/onboarding-store";

const DOT_PX = 28;

export default function OnboardingRatingsPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [rating, setRating] = useState<ContentRating>(store.contentRating);

  const selectedIdx = CONTENT_RATINGS.findIndex((r) => r.value === rating);

  const handleContinue = () => {
    store.setContentRating(rating);
    store.markStepCompleted("ratings");
    router.push("/onboarding/notifications");
  };

  const total = CONTENT_RATINGS.length;
  const fillPct = total <= 1 ? 0 : (selectedIdx / (total - 1)) * 100;

  // Track bar is 8px tall, centered on the vertical center of the 28px dots.
  // Dots row starts at the top of the container, so dot centers are at 14px.
  const trackStyle = {
    top: DOT_PX / 2,
    height: 8,
    transform: "translateY(-50%)",
  } as const;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Content Rating</h2>
        <p className="text-sm text-muted-foreground">
          Choose the highest maturity level you want in your feed.
        </p>
      </div>

      <div className="card p-5">
        {/* Track + dots */}
        <div className="relative mb-8">
          {/* Background track — full width, through dot centers */}
          <div
            className="absolute left-0 right-0 flex items-center"
            style={trackStyle}
          >
            <div className="w-full h-2 rounded-full bg-secondary" />
          </div>
          {/* Filled track — spans 0..fillPct, same vertical axis */}
          <div
            className="absolute left-0 right-0 flex items-center"
            style={trackStyle}
          >
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>

          {/* Dots — centered vertically, spaced evenly */}
          <div className="relative flex justify-between items-center">
            {CONTENT_RATINGS.map((r, i) => {
              const isSelected = i === selectedIdx;
              const isIncluded = i <= selectedIdx;
              return (
                <button
                  key={r.value}
                  onClick={() => setRating(r.value)}
                  className="flex flex-col items-center gap-1.5 focus:outline-none"
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm",
                      isIncluded
                        ? isSelected
                          ? "bg-primary text-primary-foreground ring-[3px] ring-white"
                          : "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {isIncluded && !isSelected ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : r.value === 99 ? (
                      <span className="text-lg font-bold leading-none">∞</span>
                    ) : (
                      <span>{r.value}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors leading-tight text-center",
                      isIncluded ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected label card */}
        <div className="rounded-xl bg-primary p-4 text-center">
          <p className="text-base font-bold text-primary-foreground">
            {CONTENT_RATINGS[selectedIdx].label}
          </p>
          <p className="text-xs text-primary/80">
            {CONTENT_RATINGS[selectedIdx].description} &mdash;{" "}
            {rating === 99
              ? "All content shown"
              : rating === 0
              ? "Only kids content"
              : `Content ${rating} and below`}
          </p>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-3">
          Select a lower rating to filter out more mature content.
        </p>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Regional ratings shown based on your region setting.</p>
        <p>You can change this anytime in Settings &rarr; Content Rating.</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/streaming")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
