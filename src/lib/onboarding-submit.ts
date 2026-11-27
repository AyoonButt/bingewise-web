import { apiClient } from "@/lib/api-client";
import { writeLocalNotificationPreferences } from "@/lib/notification-preferences";
import { SESSION_KEY } from "@/lib/session";
import type { SessionData } from "@/types/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values));
}

/**
 * Keys here must match the backend's UserUpdate DTO exactly. That DTO is bound
 * with a strict ObjectMapper, so unknown keys (including the store's client-only
 * `vibe*` names) produce a 400 instead of being ignored.
 */
export function buildOnboardingPayload() {
  const state = useOnboardingStore.getState();
  const providers =
    state.orderedSelectedProviders.length > 0
      ? state.orderedSelectedProviders
      : state.selectedProviders;
  // preferredGenres/avoidedGenres already carry drag order. The legacy
  // ordered* genre fields are never written by any step, so using them here
  // would let stale persisted values override the user's current choices.
  const genres = uniqueNumbers([...state.preferredGenres, ...state.vibeLikedGenres]);
  // Vibe rejects are soft ranking signals, not hard exclusions. They must stay
  // in softAvoidGenreIds so the backend can demote rather than hide them.
  const avoidGenres = uniqueNumbers(state.avoidedGenres).filter(
    (id) => !genres.includes(id)
  );
  const softAvoidGenreIds = uniqueNumbers(state.vibeSoftAvoidedGenres).filter(
    (id) => !genres.includes(id) && !avoidGenres.includes(id)
  );

  return {
    language: state.language.split("-")[0] || "en",
    region: state.region,
    // The backend treats null as "leave this field unchanged", not "no limit".
    // Onboarding's unbounded sentinels (0/300 for movies, 0/90 for TV) must be
    // sent explicitly or a new account keeps the server defaults (60/180/20/90).
    minMovie: state.minMovieDuration,
    maxMovie: state.maxMovieDuration,
    minTV: state.minTvDuration,
    maxTV: state.maxTvDuration,
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
    softAvoidGenreIds,
    excludedTmdbIds: uniqueNumbers(state.vibeExcludedTmdbIds),
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

  const state = useOnboardingStore.getState();
  const payload = buildOnboardingPayload();

  // This is the only onboarding write the backend can actually persist.
  await apiClient(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  // There is no backend notification-settings endpoint, and only the master
  // choice can actually be enforced on web by registering/unregistering this
  // device. Keep that one choice locally instead of POSTing to a 404 route.
  writeLocalNotificationPreferences(userId, {
    masterEnabled: state.notificationsEnabled,
  });

  // The backend has no complete-setup endpoint; needsSetup is response-only.
  // Mark it complete in the local session so the client does not loop back into
  // onboarding. Login/refresh already report needsSetup: false.
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
