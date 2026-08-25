import { deleteToken, getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance, isMessagingSupported } from "./firebase";
import { apiClient } from "./api-client";

const TOKEN_KEY = "fcm_token";

export interface WebPushPayload {
  type: string;
  title: string;
  message: string;
  referenceId: number;
  contentId: number;
  senderName: string;
  senderUserId: number;
  posterUrl?: string;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isMessagingSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    return registration;
  } catch {
    return null;
  }
}

export async function requestPermission(): Promise<
  "granted" | "denied" | "default" | "unsupported"
> {
  if (!isMessagingSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    await refreshToken();
  }
  return permission;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isMessagingSupported()) return "unsupported";
  return Notification.permission;
}

async function refreshToken(): Promise<string | null> {
  const messaging = getMessagingInstance();
  const registration = await registerServiceWorker();
  if (!messaging || !registration) return null;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  const previous = getStoredToken();
  if (token !== previous) {
    if (previous) {
      await removeTokenFromBackend(previous);
    }
    setStoredToken(token);
  }
  return token;
}

async function removeTokenFromBackend(token: string): Promise<void> {
  try {
    await fetch(`/api/backend/api/notifications/tokens/${encodeURIComponent(token)}`, {
      method: "DELETE",
    });
  } catch {
    // ignore - backend cleans up invalid tokens on its own
  }
}

function deviceInfo(): string {
  const ua = navigator.userAgent;
  const browsers: [RegExp, string][] = [
    [/Edg\//, "Edge"],
    [/OPR\//, "Opera"],
    [/SamsungBrowser\//, "Samsung Internet"],
    [/Chrome\//, "Chrome"],
    [/Firefox\//, "Firefox"],
    [/Safari\//, "Safari"],
  ];
  let browser = "Browser";
  for (const [regex, name] of browsers) {
    if (regex.test(ua)) {
      browser = name;
      break;
    }
  }
  const version = ua.match(/(?:Chrome|Firefox|Safari|Edg|OPR)\/([\d.]+)/)?.[1] ?? "";
  const platform = navigator.platform || "Unknown OS";
  return `${browser} ${version} (Web · ${platform})`;
}

export async function registerDevice(userId: number): Promise<boolean> {
  const permission = getNotificationPermission();
  if (permission === "denied" || permission === "unsupported") return false;

  let token = getStoredToken();
  if (permission === "granted") {
    token = (await refreshToken()) ?? token;
  } else if (!token) {
    const result = await requestPermission();
    if (result !== "granted") return false;
    token = getStoredToken();
  }
  if (!token) return false;

  try {
    await apiClient(`/api/notifications/${userId}/tokens`, {
      method: "POST",
      body: JSON.stringify({ token, deviceInfo: deviceInfo() }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function unregisterDevice(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    await removeTokenFromBackend(token);
    setStoredToken(null);
  }
  const messaging = getMessagingInstance();
  if (messaging) {
    try {
      await deleteToken(messaging);
    } catch {
      // ignore
    }
  }
}

export function onForegroundMessage(
  callback: (payload: WebPushPayload) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    const data = payload.data ?? {};
    callback({
      type: data.type ?? "",
      title: data.title ?? "BingeWise",
      message: data.message ?? "",
      referenceId: Number(data.referenceId ?? 0) || 0,
      contentId: Number(data.contentId ?? 0) || 0,
      senderName: data.senderName ?? "",
      senderUserId: Number(data.senderUserId ?? 0) || 0,
      posterUrl: data.posterUrl ?? undefined,
    });
  });
}

export function onServiceWorkerMessage(
  callback: (event: MessageEvent) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type) callback(event);
  };
  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

