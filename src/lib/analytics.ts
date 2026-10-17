/**
 * Web product analytics.
 *
 * Mirrors the mobile app's shared AnalyticsManager
 * (com.bingewise.shared.analytics.AnalyticsManager) so both platforms emit the
 * same `bw_*` Firebase event taxonomy into the same GA4 property.
 *
 * Design notes:
 * - The Firebase Analytics SDK is imported lazily and only initialised once the
 *   user grants analytics consent (see AnalyticsInitializer). No GA/gtag script,
 *   cookie, or network call is made before that.
 * - Every call is fire-and-forget: if the SDK isn't ready, consent was denied,
 *   or the SDK throws, the event is dropped silently. Analytics must never
 *   disturb the user experience.
 * - Param keys/values are truncated like mobile (40 / 100 chars) so a stray long
 *   title can't bloat an event payload.
 */

import { getFirebaseApp } from "./firebase";

type AnalyticsModule = typeof import("firebase/analytics");
type FirebaseAnalytics = import("firebase/analytics").Analytics;

const MAX_KEY_LENGTH = 40;
const MAX_PARAM_LENGTH = 100;

/** Event names — must stay in sync with the mobile AnalyticsManager taxonomy. */
export const ANALYTICS_EVENTS = {
  // Auth funnel
  LOGIN_ATTEMPT: "bw_login_attempt",
  LOGIN_SUCCESS: "bw_login_success",
  LOGIN_FAILURE: "bw_login_failure",
  REGISTER_ATTEMPT: "bw_register_attempt",
  REGISTER_SUCCESS: "bw_register_success",
  REGISTER_FAILURE: "bw_register_failure",
  SESSION_START: "bw_session_start",
  SESSION_END: "bw_session_end",

  // Trailer / explore feed
  TRAILER_IMPRESSION: "bw_trailer_impression",
  TRAILER_PLAY: "bw_trailer_play",
  TRAILER_PAUSE: "bw_trailer_pause",
  TRAILER_REPLAY: "bw_trailer_replay",
  TRAILER_LIKE: "bw_trailer_like",
  TRAILER_UNLIKE: "bw_trailer_unlike",
  TRAILER_SAVE: "bw_trailer_save",
  TRAILER_UNSAVE: "bw_trailer_unsave",
  TRAILER_MUTE: "bw_trailer_mute",
  TRAILER_UNMUTE: "bw_trailer_unmute",
  TRAILER_COMMENT_TAP: "bw_trailer_comment_tap",
  TRAILER_NOT_INTERESTED: "bw_trailer_not_interested",
  TRAILER_FEED_REFRESH: "bw_trailer_feed_refresh",

  // Home feed
  FEED_POST_IMPRESSION: "bw_feed_post_impression",
  FEED_POST_LIKE: "bw_feed_post_like",
  FEED_POST_UNLIKE: "bw_feed_post_unlike",
  FEED_POST_SAVE: "bw_feed_post_save",
  FEED_POST_UNSAVE: "bw_feed_post_unsave",
  FEED_DOUBLE_TAP_LIKE: "bw_feed_double_tap_like",
  FEED_COMMENT_TAP: "bw_feed_comment_tap",
  FEED_NOT_INTERESTED: "bw_feed_not_interested",
  FEED_REFRESH: "bw_feed_refresh",
  COMMENT_SUBMIT: "bw_comment_submit",

  // Ads
  AD_CONSENT_STARTED: "bw_ad_consent_started",
  AD_CONSENT_OBTAINED: "bw_ad_consent_obtained",
  AD_CONSENT_DENIED: "bw_ad_consent_denied",
  AD_PRELOAD_STARTED: "bw_ad_preload_started",
  AD_LOAD_SUCCESS: "bw_ad_load_success",
  AD_LOAD_FAILURE: "bw_ad_load_failure",
  AD_IMPRESSION: "bw_ad_impression",

  // Watch-provider / JustWatch outbound links
  WATCH_PROVIDER_CLICK: "bw_watch_provider_click",

  // Watchlists
  WATCHLIST_CREATED: "bw_watchlist_created",
  WATCHLIST_DELETED: "bw_watchlist_deleted",
  WATCHLIST_UPDATED: "bw_watchlist_updated",
  WATCHLIST_ITEM_ADDED: "bw_watchlist_item_added",
  WATCHLIST_ITEM_REMOVED: "bw_watchlist_item_removed",
  WATCHLIST_CLONED: "bw_watchlist_cloned",
  WATCHLIST_LINK_SHARED: "bw_watchlist_link_shared",
  WATCHLIST_REORDERED: "bw_watchlist_reordered",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type EventParamValue = string | number | boolean | null | undefined;
export type EventParams = Record<string, EventParamValue>;

let analyticsModule: AnalyticsModule | null = null;
let analyticsInstance: FirebaseAnalytics | null = null;
let initPromise: Promise<FirebaseAnalytics | null> | null = null;
let enabled = false;
let pendingUserId: string | null = null;

function hasMeasurementId(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
}

/** Lazily load + initialise the Firebase Analytics SDK (client only). */
async function loadAnalytics(): Promise<FirebaseAnalytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!hasMeasurementId()) return null;
      const mod = await import("firebase/analytics");
      if (!(await mod.isSupported())) return null;
      const app = getFirebaseApp();
      if (!app) return null;
      const instance = mod.getAnalytics(app);
      analyticsModule = mod;
      analyticsInstance = instance;
      if (pendingUserId) mod.setUserId(instance, pendingUserId);
      return instance;
    } catch {
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/** Enable collection (called once analytics consent is granted). */
export async function enableAnalytics(): Promise<void> {
  enabled = true;
  const instance = await loadAnalytics();
  if (instance && analyticsModule) {
    try {
      analyticsModule.setAnalyticsCollectionEnabled(instance, true);
    } catch {
      // ignore
    }
  }
}

/** Disable collection (called when consent is denied or reset). */
export function disableAnalytics(): void {
  enabled = false;
  if (analyticsInstance && analyticsModule) {
    try {
      analyticsModule.setAnalyticsCollectionEnabled(analyticsInstance, false);
    } catch {
      // ignore
    }
  }
}

/** Low-level escape hatch for one-off events not covered by the helpers. */
export function logEvent(name: string, params: EventParams = {}): void {
  if (!enabled || !analyticsInstance || !analyticsModule) return;
  try {
    const cleaned: Record<string, string | number | boolean> = {};
    for (const rawKey in params) {
      const value = params[rawKey];
      if (value === null || value === undefined) continue;
      const key = rawKey.slice(0, MAX_KEY_LENGTH);
      cleaned[key] =
        typeof value === "string" ? value.slice(0, MAX_PARAM_LENGTH) : value;
    }
    analyticsModule.logEvent(analyticsInstance, name, cleaned);
  } catch {
    // never let analytics break the app
  }
}

/** Attach the signed-in user id (null clears it). */
export function setAnalyticsUserId(userId: number | string | null): void {
  pendingUserId =
    userId === null ? null : String(userId).slice(0, MAX_PARAM_LENGTH);
  if (analyticsInstance && analyticsModule) {
    try {
      analyticsModule.setUserId(analyticsInstance, pendingUserId);
    } catch {
      // ignore
    }
  }
}

interface MediaRef {
  postId?: number | null;
  mediaType?: string | null;
  tmdbId?: number | null;
}

function mediaParams(ref: MediaRef): EventParams {
  return {
    post_id: ref.postId ?? undefined,
    media_type: ref.mediaType?.toLowerCase(),
    tmdb_id: ref.tmdbId ?? undefined,
  };
}

/**
 * Typed analytics facade mirroring the mobile AnalyticsManager helpers.
 * Import and call directly: `analytics.logTrailerLike({ postId })`.
 */
export const analytics = {
  logEvent,
  setUserId: setAnalyticsUserId,

  // ---- Auth funnel ----
  loginAttempt() {
    logEvent(ANALYTICS_EVENTS.LOGIN_ATTEMPT);
  },
  loginSuccess(userId: number) {
    setAnalyticsUserId(userId);
    logEvent(ANALYTICS_EVENTS.LOGIN_SUCCESS, { user_id: userId });
  },
  loginFailure(errorCode: number, reason: string) {
    logEvent(ANALYTICS_EVENTS.LOGIN_FAILURE, {
      error_code: errorCode,
      reason,
    });
  },
  registerAttempt() {
    logEvent(ANALYTICS_EVENTS.REGISTER_ATTEMPT);
  },
  registerSuccess(userId: number) {
    setAnalyticsUserId(userId);
    logEvent(ANALYTICS_EVENTS.REGISTER_SUCCESS, { user_id: userId });
  },
  registerFailure(errorCode: number, reason: string) {
    logEvent(ANALYTICS_EVENTS.REGISTER_FAILURE, {
      error_code: errorCode,
      reason,
    });
  },
  sessionStart(userId: number) {
    logEvent(ANALYTICS_EVENTS.SESSION_START, { user_id: userId });
  },
  sessionEnd() {
    logEvent(ANALYTICS_EVENTS.SESSION_END);
    setAnalyticsUserId(null);
  },

  // ---- Trailer / explore feed ----
  logTrailerImpression(ref: MediaRef & { position?: number }) {
    logEvent(ANALYTICS_EVENTS.TRAILER_IMPRESSION, {
      ...mediaParams(ref),
      position: ref.position ?? undefined,
    });
  },
  logTrailerPlay(postId?: number | null, mediaType?: string | null) {
    logEvent(ANALYTICS_EVENTS.TRAILER_PLAY, {
      post_id: postId ?? undefined,
      media_type: mediaType?.toLowerCase(),
    });
  },
  logTrailerPause(
    postId: number | null | undefined,
    mediaType: string | null | undefined,
    watchTimeSec: number
  ) {
    logEvent(ANALYTICS_EVENTS.TRAILER_PAUSE, {
      post_id: postId ?? undefined,
      media_type: mediaType?.toLowerCase(),
      watch_time_seconds: watchTimeSec,
    });
  },
  logTrailerReplay(
    postId: number | null | undefined,
    mediaType: string | null | undefined,
    replayCount: number
  ) {
    logEvent(ANALYTICS_EVENTS.TRAILER_REPLAY, {
      post_id: postId ?? undefined,
      media_type: mediaType?.toLowerCase(),
      replay_count: replayCount,
    });
  },
  logTrailerLike(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.TRAILER_LIKE, mediaParams(ref));
  },
  logTrailerUnlike(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.TRAILER_UNLIKE, mediaParams(ref));
  },
  logTrailerSave(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.TRAILER_SAVE, mediaParams(ref));
  },
  logTrailerUnsave(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.TRAILER_UNSAVE, mediaParams(ref));
  },
  logTrailerMute(postId?: number | null, muted?: boolean) {
    logEvent(muted ? ANALYTICS_EVENTS.TRAILER_MUTE : ANALYTICS_EVENTS.TRAILER_UNMUTE, {
      post_id: postId ?? undefined,
      muted,
    });
  },
  logTrailerCommentTap(postId?: number | null) {
    logEvent(ANALYTICS_EVENTS.TRAILER_COMMENT_TAP, {
      post_id: postId ?? undefined,
    });
  },
  logTrailerNotInterested(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.TRAILER_NOT_INTERESTED, mediaParams(ref));
  },
  logTrailerFeedRefresh() {
    logEvent(ANALYTICS_EVENTS.TRAILER_FEED_REFRESH);
  },

  // ---- Home feed ----
  logFeedPostImpression(ref: MediaRef & { position?: number }) {
    logEvent(ANALYTICS_EVENTS.FEED_POST_IMPRESSION, {
      ...mediaParams(ref),
      position: ref.position ?? undefined,
    });
  },
  logFeedPostLike(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.FEED_POST_LIKE, mediaParams(ref));
  },
  logFeedPostUnlike(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.FEED_POST_UNLIKE, mediaParams(ref));
  },
  logFeedPostSave(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.FEED_POST_SAVE, mediaParams(ref));
  },
  logFeedPostUnsave(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.FEED_POST_UNSAVE, mediaParams(ref));
  },
  logFeedDoubleTapLike(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.FEED_DOUBLE_TAP_LIKE, mediaParams(ref));
  },
  logFeedCommentTap(postId?: number | null) {
    logEvent(ANALYTICS_EVENTS.FEED_COMMENT_TAP, {
      post_id: postId ?? undefined,
    });
  },
  logFeedNotInterested(ref: MediaRef) {
    logEvent(ANALYTICS_EVENTS.FEED_NOT_INTERESTED, mediaParams(ref));
  },
  logFeedRefresh() {
    logEvent(ANALYTICS_EVENTS.FEED_REFRESH);
  },
  logCommentSubmit(opts: {
    postId?: number | null;
    isReply: boolean;
    commentType: string;
  }) {
    logEvent(ANALYTICS_EVENTS.COMMENT_SUBMIT, {
      post_id: opts.postId ?? undefined,
      is_reply: opts.isReply,
      comment_type: opts.commentType,
    });
  },

  // ---- Ads ----
  logAdConsentFlowStarted() {
    logEvent(ANALYTICS_EVENTS.AD_CONSENT_STARTED);
  },
  logAdConsentObtained() {
    logEvent(ANALYTICS_EVENTS.AD_CONSENT_OBTAINED);
  },
  logAdConsentDenied() {
    logEvent(ANALYTICS_EVENTS.AD_CONSENT_DENIED);
  },
  logAdPreloadStarted(placement: string) {
    logEvent(ANALYTICS_EVENTS.AD_PRELOAD_STARTED, { placement });
  },
  logAdLoadSuccess(placement: string) {
    logEvent(ANALYTICS_EVENTS.AD_LOAD_SUCCESS, { placement });
  },
  logAdLoadFailure(placement: string, errorMessage?: string | null) {
    logEvent(ANALYTICS_EVENTS.AD_LOAD_FAILURE, {
      placement,
      error_message: errorMessage ?? undefined,
    });
  },
  logAdImpression(placement: string, position = -1) {
    logEvent(ANALYTICS_EVENTS.AD_IMPRESSION, { placement, position });
  },

  // ---- Watch providers ----
  logWatchProviderClick(providerName: string | null, providerId?: number | null) {
    logEvent(ANALYTICS_EVENTS.WATCH_PROVIDER_CLICK, {
      provider_name: providerName ?? undefined,
      provider_id: providerId ?? undefined,
    });
  },
  // ---- Watchlists ----
  logWatchlistCreated(watchlistId: number, itemCount = 0) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_CREATED, {
      watchlist_id: watchlistId,
      item_count: itemCount,
    });
  },
  logWatchlistDeleted(watchlistId: number) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_DELETED, {
      watchlist_id: watchlistId,
    });
  },
  logWatchlistUpdated(watchlistId: number) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_UPDATED, {
      watchlist_id: watchlistId,
    });
  },
  logWatchlistItemAdded(ref: MediaRef & { watchlistId: number }) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_ITEM_ADDED, {
      watchlist_id: ref.watchlistId,
      ...mediaParams(ref),
    });
  },
  logWatchlistItemRemoved(ref: MediaRef & { watchlistId: number }) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_ITEM_REMOVED, {
      watchlist_id: ref.watchlistId,
      ...mediaParams(ref),
    });
  },
  logWatchlistCloned(sourceId: number, newId: number) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_CLONED, {
      source_id: sourceId,
      new_id: newId,
    });
  },
  logWatchlistLinkShared(watchlistId: number) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_LINK_SHARED, {
      watchlist_id: watchlistId,
    });
  },
  logWatchlistReordered(watchlistId: number) {
    logEvent(ANALYTICS_EVENTS.WATCHLIST_REORDERED, {
      watchlist_id: watchlistId,
    });
  },
};
