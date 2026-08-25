import type { AuthResponse } from "@/types/auth";
import type { UserDto } from "@/types/user";

export type RefreshResult =
  | {
      status: "ok";
      user: UserDto | null;
      expiresIn: number | null;
    }
  | { status: "unauthorized" }
  | { status: "error" };

let refreshPromise: Promise<RefreshResult> | null = null;

export async function getRefreshResult(): Promise<RefreshResult> {
  return doRefresh();
}

async function doRefresh(): Promise<RefreshResult> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefreshInner();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doRefreshInner(): Promise<RefreshResult> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const auth: AuthResponse = await res.json();
        const user = auth.user
          ? {
              userId: auth.user.id,
              name: auth.user.name || auth.user.username,
              username: auth.user.username,
              email: auth.user.email,
              isPrivate: false,
              createdAt: new Date().toISOString(),
            }
          : null;
        return {
          status: "ok",
          user,
          expiresIn: auth.expiresIn,
        };
      }
      if (res.status === 401) {
        return { status: "unauthorized" };
      }
    } catch {
      // network error, retry
    }

    if (attempt < maxAttempts - 1) {
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return { status: "error" };
}

export async function forceLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // cookies may already be gone
  }
  const { useAuthStore } = await import("@/stores/auth-store");
  useAuthStore.getState().logout();
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}