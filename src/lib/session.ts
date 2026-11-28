export const SESSION_KEY = "bingewise-session";
export const FIRST_VISIT_KEY = "bw-first-visit-complete";

// Refresh window: 30 days balances convenience against the exposure period if
// a refresh token is ever stolen. Activity on authenticated requests rolls it
// forward; the httpOnly cookie remains the source of truth.
export const SESSION_INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000;
export const ACTIVITY_UPDATE_THROTTLE_MS = 5 * 60 * 1000;
export const CLOCK_SKEW_TOLERANCE_MS = 60 * 1000;

export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;
export const DEFAULT_TOKEN_TTL_SECONDS = 900;
export const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function isDefinitiveRefreshFailure(status: number): boolean {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

export function isRetryableRefreshFailure(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function isNewOnboardingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NEW_ONBOARDING !== "false";
}

/** Gates the required account step at onboarding exit. Set to "false" to A/B test a soft gate. */
export function isOnboardingAccountGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ONBOARDING_ACCOUNT_GATE !== "false";
}

export function isTitleTrackingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TITLE_TRACKING !== "false";
}
