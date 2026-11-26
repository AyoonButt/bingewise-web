import { apiClient } from "@/lib/api-client";
import { SESSION_KEY } from "@/lib/session";
import type { SessionData } from "@/types/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values));
}

export function buildOnboardingPayload() {
  const state = useOnboardingStore.getState();
  const providers =
    state.orderedSelectedProviders.length > 0
      ? state.orderedSelectedProviders
      : state.selectedProviders;
  const genres = uniqueNumbers([
    ...state.orderedSelectedGenres,
    ...state.preferredGenres,
    ...state.vibeLikedGenres,
  ]);
  const avoidGenres = uniqueNumbers([
    ...state.orderedAvoidedGenres,
    ...state.avoidedGenres,
    ...state.vibeSoftAvoidedGenres,
  ]).filter((id) => !genres.includes(id));

  return {
    language: state.language.split("-")[0] || "en",
    region: state.region,
    minMovie: state.minMovieDuration || null,
    maxMovie: state.maxMovieDuration < 300 ? state.maxMovieDuration : null,
    minTV: state.minTvDuration || null,
    maxTV: state.maxTvDuration < 90 ? state.maxTvDuration : null,
    oldestDate: state.oldestDate || "1900-01-01",
    recentDate:
      state.recentDate === "CURRENT"
        ? new Date().toISOString().split("T")[0]
        : state.recentDate || "2099-12-31",
    isPrivate: state.isPrivateAccount,
    contentRatingAge: state.contentRating,
    contentLanguagePreference: state.contentLanguagePreference,
    subscriptions: providers,
    genres,
    avoidGenres,
    vibeLikedGenres: state.vibeLikedGenres,
    vibeSoftAvoidedGenres: state.vibeSoftAvoidedGenres,
    vibeExcludedTmdbIds: state.vibeExcludedTmdbIds,
  };
}

function markSetupCompleteLocally() {
  const auth = useAuthStore.getState();
  if (!auth.user) return;
  let tokenExpiresAt = auth.tokenExpiresAt ?? Date.now() + 30 * 24 * 60 * 60 * 1000;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const session = raw ? (JSON.parse(raw) as SessionData) : null;
      if (session?.tokenExpiresAt) tokenExpiresAt = session.tokenExpiresAt;
    } catch {
      tokenExpiresAt = auth.tokenExpiresAt ?? Date.now() + 30 * 24 * 60 * 60 * 1000;
    }
  }
  auth.refreshSessionData({ ...auth.user, needsSetup: false }, tokenExpiresAt);
}

export async function submitOnboarding(): Promise<void> {
  const userId = useAuthStore.getState().user?.userId;
  if (!userId) throw new Error("Sign in to save your preferences");

  const payload = buildOnboardingPayload();

  await apiClient(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  try {
    await apiClient(`/api/notifications/${userId}/settings`, {
      method: "PUT",
      body: JSON.stringify({
        enabled: useOnboardingStore.getState().notificationsEnabled,
        repliesEnabled: useOnboardingStore.getState().repliesEnabled,
        followRequestsEnabled: useOnboardingStore.getState().followRequestsEnabled,
        messagesEnabled: useOnboardingStore.getState().messagesEnabled,
        releasesEnabled: useOnboardingStore.getState().releasesEnabled,
        sequelsEnabled: useOnboardingStore.getState().sequelsEnabled,
        subscriptionsEnabled: useOnboardingStore.getState().subscriptionsEnabled,
        streamingEnabled: useOnboardingStore.getState().streamingEnabled,
        generalEnabled: useOnboardingStore.getState().generalEnabled,
      }),
    });
  } catch (error) {
    void error;
  }

  try {
    await apiClient(`/api/users/${userId}/complete-setup`, {
      method: "POST",
      body: "{}",
    });
  } catch (error) {
    void error;
  }

  markSetupCompleteLocally();
}

export async function promoteGuestProgress(userId: number): Promise<"saved" | "resume" | "none"> {
  const store = useOnboardingStore.getState();
  const meaningfulSteps = store.completedSteps.filter((step) => step !== "welcome");

  if (meaningfulSteps.length === 0) {
    store.clear();
    store.loadForUser(userId);
    return "none";
  }

  store.loadForUser(userId);
  const state = useOnboardingStore.getState();

  if (state.completedSteps.includes("recommended-for-you")) {
    await submitOnboarding();
    useOnboardingStore.getState().clear();
    return "saved";
  }

  return "resume";
}
