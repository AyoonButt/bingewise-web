/**
 * The backend has no notification-settings endpoint, and web push can only be
 * enforced per device. Keep the single master choice on this device so it is
 * never silently lost; category-level suppression is intentionally not offered
 * on web because it cannot be honored without backend support.
 */
export interface LocalNotificationPreferences {
  masterEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: LocalNotificationPreferences = {
  masterEnabled: true,
};

const STORAGE_KEY = "bingewise-notification-preferences";

type StoredPreferences = Record<string, LocalNotificationPreferences>;

function readStore(): StoredPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readLocalNotificationPreferences(
  userId?: number
): LocalNotificationPreferences | null {
  if (!userId) return null;
  const stored = readStore()[String(userId)];
  if (!stored || typeof stored !== "object") return null;
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, masterEnabled: !!stored.masterEnabled };
}

export function writeLocalNotificationPreferences(
  userId: number,
  preferences: LocalNotificationPreferences
): void {
  if (typeof window === "undefined") return;
  try {
    const store = readStore();
    store[String(userId)] = { masterEnabled: preferences.masterEnabled };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Preferences are best-effort local state; never fail onboarding for them.
  }
}
