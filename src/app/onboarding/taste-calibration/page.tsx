"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboarding-store";

const STAGES = [
  { label: "Reading your vibe", detail: "Matching tone and pacing" },
  { label: "Balancing genres", detail: "Mixing familiar and fresh" },
  { label: "Tuning your feed", detail: "Prioritizing what you liked" },
  { label: "Locking it in", detail: "Almost ready" },
];

export default function TasteCalibrationPage() {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    if (stage >= STAGES.length) {
      if (finished.current) return;
      finished.current = true;
      useOnboardingStore.getState().markStepCompleted("taste-calibration");
      router.replace("/onboarding/recommended-for-you");
      return;
    }
    const timer = window.setTimeout(() => setStage((value) => value + 1), 250);
    return () => window.clearTimeout(timer);
  }, [router, stage]);

  const active = Math.min(stage, STAGES.length - 1);

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Calibrating your taste</h2>
        <p className="text-sm text-muted-foreground">
          Turning your picks into a feed that feels like you.
        </p>
      </div>

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-9 w-9 animate-pulse text-primary" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold">{STAGES[active].label}</p>
        <p className="text-xs text-muted-foreground">{STAGES[active].detail}</p>
      </div>

      <div className="mx-auto flex max-w-xs gap-2">
        {STAGES.map((item, index) => (
          <div
            key={item.label}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= stage ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">This takes one second.</p>
    </div>
  );
}
