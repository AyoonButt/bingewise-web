export const SESSION_KEY = "bingewise-session";
// Refresh window: 30 days balances convenience against the exposure period if
// a refresh token is ever stolen. Users re-login monthly at most.
export const SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;
export const DEFAULT_TOKEN_TTL_SECONDS = 900;
export const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;