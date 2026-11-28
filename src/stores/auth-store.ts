import { create } from "zustand";
import type { UserDto } from "@/types/user";
import type { SessionData } from "@/types/auth";
import {
  ACTIVITY_UPDATE_THROTTLE_MS,
  CLOCK_SKEW_TOLERANCE_MS,
  SESSION_KEY,
} from "@/lib/session";

export type AuthStatus = "restoring" | "authenticated" | "guest";

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  sessionEpoch: number;
  tokenExpiresAt: number | null;
  loginTimestamp: number | null;
  lastActivityAt: number | null;
  setUser: (user: UserDto | null) => void;
  setSession: (user: UserDto, tokenExpiresAt: number) => void;
  refreshSessionData: (user: UserDto, tokenExpiresAt: number) => void;
  touchActivity: () => void;
  logout: () => void;
  restoreSession: () => boolean;
}

let lastActivityWriteMs = 0;

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

function persistSession(session: SessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  lastActivityWriteMs = session.lastActivityAt ?? Date.now();
}

function saveSession(user: UserDto, tokenExpiresAt: number) {
  const now = Date.now();
  persistSession({
    user,
    tokenExpiresAt,
    loginTimestamp: now,
    lastActivityAt: now,
  });
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  lastActivityWriteMs = 0;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  authStatus: "restoring",
  sessionEpoch: 0,
  tokenExpiresAt: null,
  loginTimestamp: null,
  lastActivityAt: null,

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
      authStatus: user ? "authenticated" : "guest",
      sessionEpoch: state.sessionEpoch + 1,
    })),

  setSession: (user, tokenExpiresAt) => {
    saveSession(user, tokenExpiresAt);
    const now = Date.now();
    set((state) => ({
      user,
      isAuthenticated: true,
      authStatus: "authenticated",
      sessionEpoch: state.sessionEpoch + 1,
      tokenExpiresAt,
      loginTimestamp: now,
      lastActivityAt: now,
    }));
  },

  refreshSessionData: (user, tokenExpiresAt) => {
    const session = loadSession();
    const loginTimestamp = session?.loginTimestamp ?? Date.now();
    const lastActivityAt = session?.lastActivityAt ?? Date.now();
    persistSession({ user, tokenExpiresAt, loginTimestamp, lastActivityAt });
    set((state) => ({
      user,
      isAuthenticated: true,
      authStatus: "authenticated",
      sessionEpoch: state.sessionEpoch + 1,
      tokenExpiresAt,
      loginTimestamp,
      lastActivityAt,
    }));
  },

  touchActivity: () => {
    if (typeof window === "undefined") return;
    const state = get();
    if (!state.isAuthenticated) return;

    const now = Date.now();
    const previous = state.lastActivityAt ?? state.loginTimestamp ?? 0;
    if (previous && now - lastActivityWriteMs < ACTIVITY_UPDATE_THROTTLE_MS) {
      return;
    }

    const session = loadSession();
    if (session) {
      persistSession({ ...session, lastActivityAt: now });
    } else {
      lastActivityWriteMs = now;
    }
    set({ lastActivityAt: now });
  },

  logout: () => {
    clearSession();
    set((state) => ({
      user: null,
      isAuthenticated: false,
      authStatus: "guest",
      sessionEpoch: state.sessionEpoch + 1,
      tokenExpiresAt: null,
      loginTimestamp: null,
      lastActivityAt: null,
    }));
  },

  restoreSession: () => {
    const session = loadSession();
    if (!session) {
      // Keep the session in "restoring" until revalidation has decided whether
      // httpOnly cookies still identify a user. Serving a guest feed on the
      // first paint is what makes a resumed sign-up look like a guest session.
      return false;
    }

    const now = Date.now();
    const lastActivityAt = session.lastActivityAt ?? session.loginTimestamp;

    // A future timestamp means the device clock moved backwards. Treat that as
    // tampering, but never log out merely because local activity is old: the
    // httpOnly cookies decide whether the session is still valid.
    if (lastActivityAt > now + CLOCK_SKEW_TOLERANCE_MS) {
      clearSession();
      set((state) => ({
        user: null,
        isAuthenticated: false,
        authStatus: "guest",
        sessionEpoch: state.sessionEpoch + 1,
        tokenExpiresAt: null,
        loginTimestamp: null,
        lastActivityAt: null,
      }));
      return false;
    }

    const user = session.user;
    if (!user || !user.userId || !user.username || user.username === "undefined") {
      clearSession();
      set((state) => ({
        user: null,
        isAuthenticated: false,
        authStatus: "guest",
        sessionEpoch: state.sessionEpoch + 1,
        tokenExpiresAt: null,
        loginTimestamp: null,
        lastActivityAt: null,
      }));
      return false;
    }

    if (!user.name) {
      user.name = user.username;
    }

    set((state) => ({
      user,
      isAuthenticated: true,
      authStatus: "authenticated",
      sessionEpoch: state.sessionEpoch + 1,
      tokenExpiresAt: session.tokenExpiresAt,
      loginTimestamp: session.loginTimestamp,
      lastActivityAt,
    }));
    return true;
  },
}));
