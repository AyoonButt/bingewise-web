export const ONBOARDING_SCHEMA_VERSION = 2;

export const ONBOARDING_STEP_IDS = [
  "welcome",
  "region-language",
  "content-rating",
  "streaming-services",
  "stay-connected",
  "vibe-check",
  "taste-calibration",
  "recommended-for-you",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

const NEW_STEP_IDS = new Set<string>(ONBOARDING_STEP_IDS);

const NEW_STEP_ROUTES: Record<OnboardingStepId, string> = {
  welcome: "/onboarding",
  "region-language": "/onboarding/region-language",
  "content-rating": "/onboarding/ratings",
  "streaming-services": "/onboarding/streaming",
  "stay-connected": "/onboarding/stay-connected",
  "vibe-check": "/onboarding/vibe-check",
  "taste-calibration": "/onboarding/taste-calibration",
  "recommended-for-you": "/onboarding/recommended-for-you",
};

export interface VibeDeckProgress {
  deck: number[];
  cursor: number;
  decisions: Record<number, "liked" | "soft-avoid">;
}

export function normalizeCompletedSteps(steps: string[]): OnboardingStepId[] {
  const completed = new Set<string>(steps);

  const legacyMap: Array<[string, OnboardingStepId]> = [
    ["basics", "region-language"],
    ["genres", "vibe-check"],
    ["streaming", "streaming-services"],
    ["ratings", "content-rating"],
    ["notifications", "stay-connected"],
  ];

  for (const [legacy, current] of legacyMap) {
    if (completed.has(legacy)) completed.add(current);
  }

  return ONBOARDING_STEP_IDS.filter((step) => completed.has(step));
}

export function nextOnboardingRoute(
  completedSteps: string[],
  lastStep?: string | null
): string {
  const completed = new Set<string>(completedSteps);

  if (
    lastStep &&
    NEW_STEP_IDS.has(lastStep as OnboardingStepId) &&
    !completed.has(lastStep)
  ) {
    return NEW_STEP_ROUTES[lastStep as OnboardingStepId];
  }

  if (completedSteps.some((step) => NEW_STEP_IDS.has(step))) {
    const normalized = normalizeCompletedSteps([...completed]);
    const next = ONBOARDING_STEP_IDS.find((step) => !normalized.includes(step));
    return next ? NEW_STEP_ROUTES[next] : "/onboarding/recommended-for-you";
  }

  if (!completed.has("basics")) return "/onboarding/basics";
  if (!completed.has("genres")) return "/onboarding/genres";
  if (!completed.has("streaming")) return "/onboarding/streaming";
  if (!completed.has("ratings")) return "/onboarding/ratings";
  if (!completed.has("notifications") && !completed.has("stay-connected")) {
    return "/onboarding/notifications";
  }
  if (!completed.has("privacy")) return "/onboarding/privacy";
  return "/onboarding/review";
}

export function onboardingProgressPercent(completedSteps: string[]): number {
  const normalizedCount = normalizeCompletedSteps(completedSteps).length;
  const count = Math.max(normalizedCount, Math.min(completedSteps.length, ONBOARDING_STEP_IDS.length));
  return Math.round((count / ONBOARDING_STEP_IDS.length) * 100);
}
