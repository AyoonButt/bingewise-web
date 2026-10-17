"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useConsentStore } from "@/stores/consent-store";
import {
  analytics,
  disableAnalytics,
  enableAnalytics,
  setAnalyticsUserId,
} from "@/lib/analytics";

/**
 * Bridges consent + auth state into the analytics sink.
 *
 * Mounted once in Providers. Analytics stays fully dormant (no SDK, no script,
 * no cookies) until the user grants analytics consent; when consent is revoked
 * it is disabled again. The signed-in user id is attached/cleared as auth state
 * changes, and a session-start event fires the first time a user is seen.
 */
export function AnalyticsInitializer() {
  const analyticsConsent = useConsentStore((s) => s.analyticsConsent);
  const userId = useAuthStore((s) => s.user?.userId ?? null);
  const startedForUserRef = useRef<number | null>(null);

  useEffect(() => {
    if (analyticsConsent === true) {
      void enableAnalytics();
    } else if (analyticsConsent === false) {
      disableAnalytics();
    }
  }, [analyticsConsent]);

  useEffect(() => {
    if (analyticsConsent !== true) return;
    setAnalyticsUserId(userId);
    if (userId == null) {
      startedForUserRef.current = null;
      return;
    }
    if (startedForUserRef.current !== userId) {
      startedForUserRef.current = userId;
      analytics.sessionStart(userId);
    }
  }, [userId, analyticsConsent]);

  return null;
}
