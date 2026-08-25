import { create } from "zustand";
import type { UserDto } from "@/types/user";
import type { SessionData } from "@/types/auth";
import { SESSION_KEY, SESSION_TIMEOUT_MS } from "@/lib/session";

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  tokenExpiresAt: number | null;
  loginTimestamp: number | null;
  setUser: (user: UserDto | null) => void;
  setSession: (user: UserDto, tokenExpiresAt: number) => void;
  refreshSessionData: (user: UserDto, tokenExpiresAt: number) => void;
  logout: () => void;
  restoreSession: () => boolean;
  isSessionExpired: () => boolean;
}

function loadSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

function saveSession(user: UserDto, tokenExpiresAt: number) {
  const session: SessionData = {
    user,
    tokenExpiresAt,
    loginTimestamp: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  tokenExpiresAt: null,
  loginTimestamp: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setSession: (user, tokenExpiresAt) => {
    saveSession(user, tokenExpiresAt);
    set({
      user,
      isAuthenticated: true,
      tokenExpiresAt,
      loginTimestamp: Date.now(),
    });
  },

  refreshSessionData: (user, tokenExpiresAt) => {
    const session = loadSession();
    const loginTimestamp = session?.loginTimestamp ?? Date.now();
    const updated: SessionData = { user, tokenExpiresAt, loginTimestamp };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    set({ user, isAuthenticated: true, tokenExpiresAt, loginTimestamp });
  },

  logout: () => {
    clearSession();
    set({
      user: null,
      isAuthenticated: false,
      tokenExpiresAt: null,
      loginTimestamp: null,
    });
  },

  restoreSession: () => {
    const session = loadSession();
    if (!session) return false;

    const now = Date.now();
    if (now - session.loginTimestamp > SESSION_TIMEOUT_MS) {
      clearSession();
      return false;
    }

    const user = session.user;
    if (!user || !user.userId || !user.username || user.username === "undefined") {
      clearSession();
      return false;
    }

    if (!user.name) {
      user.name = user.username;
    }

    set({
      user,
      isAuthenticated: true,
      tokenExpiresAt: session.tokenExpiresAt,
      loginTimestamp: session.loginTimestamp,
    });
    return true;
  },

  isSessionExpired: () => {
    const { loginTimestamp } = get();
    if (!loginTimestamp) return true;
    return Date.now() - loginTimestamp > SESSION_TIMEOUT_MS;
  },
}));
