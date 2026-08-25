import { forceLogout, getRefreshResult } from "./token-refresh";
import { DEFAULT_TOKEN_TTL_SECONDS } from "./session";

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api/backend/${path.replace(/^\//, "")}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const result = await getRefreshResult();
    if (result.status === "ok") {
      if (result.user) {
        const { useAuthStore } = await import("@/stores/auth-store");
        useAuthStore.getState().refreshSessionData(
          result.user,
          Date.now() + (result.expiresIn ?? DEFAULT_TOKEN_TTL_SECONDS) * 1000
        );
      }
      // The refresh response just set fresh httpOnly cookies; the backend
      // proxy injects Authorization from them. No token in JS needed.
      const retryRes = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (!retryRes.ok) {
        const errorBody = await retryRes.json().catch(() => null);
        throw new Error(errorBody?.message || `API error: ${retryRes.status}`);
      }
      return retryRes.json();
    }
    if (result.status === "unauthorized") {
      // Only hard-logout when there was a real session to lose. Guests (never
      // logged in) hit 401s constantly on discovery pages — redirecting them
      // to login would break guest browsing.
      const { useAuthStore } = await import("@/stores/auth-store");
      if (useAuthStore.getState().isAuthenticated) {
        await forceLogout();
      }
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || `API error: ${res.status}`);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

export { fetchWithAuth as apiClient };