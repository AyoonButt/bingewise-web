"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function OnboardingPrivacyPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [isPrivate, setIsPrivate] = useState(store.isPrivateAccount);

  const handleContinue = () => {
    store.setPrivateAccount(isPrivate);
    store.markStepCompleted("privacy");
    router.push("/onboarding/review");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Account Privacy</h2>
        <p className="text-sm text-muted-foreground">
          Choose who can see your profile and content.
        </p>
      </div>

      <div className="space-y-3">
        {/* Public */}
        <button
          onClick={() => setIsPrivate(false)}
          className={cn(
            "w-full card p-5 text-left border-2 transition-all",
            !isPrivate
              ? "border-primary bg-primary/5"
              : "border-border hover:border-border/60"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Public Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anyone can see your posts, follower list, and who you follow.
              </p>
            </div>
            {!isPrivate && (
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </button>

        {/* Private */}
        <button
          onClick={() => setIsPrivate(true)}
          className={cn(
            "w-full card p-5 text-left border-2 transition-all",
            isPrivate
              ? "border-primary bg-primary/5"
              : "border-border hover:border-border/60"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shrink-0">
              <Lock className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Private Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Only approved followers can see your posts. You approve follow requests manually.
              </p>
            </div>
            {isPrivate && (
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/notifications")}
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
