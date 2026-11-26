"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuthStore } from "@/stores/auth-store";
import { forceLogout, getRefreshResult } from "@/lib/token-refresh";
import { apiClient } from "@/lib/api-client";
import { analytics } from "@/lib/analytics";
import { NotificationInitializer } from "./NotificationInitializer";
import { AnalyticsInitializer } from "./AnalyticsInitializer";
import {
  DEFAULT_TOKEN_TTL_SECONDS,
  SESSION_KEY,
  SESSION_REFRESH_INTERVAL_MS,
} from "@/lib/session";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep tab content alive: revisiting a tab serves the cached data
        // instantly instead of showing loading states again.
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  resolvedTheme: "dark",
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("bingewise-theme") as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = mq.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("bingewise-theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function AuthInitializer() {
  const sessionRestoredLogged = useRef(false);

  useEffect(() => {
    const { restoreSession } = useAuthStore.getState();

    restoreSession();

    const revalidate = async () => {
      const state = useAuthStore.getState();
      state.touchActivity();

      const result = await getRefreshResult();
      if (result.status === "ok") {
        if (result.user) {
          if (!sessionRestoredLogged.current) {
            analytics.logSessionRestored();
            sessionRestoredLogged.current = true;
          }
          let user = result.user;
          // Auth responses don't include language/region; fetch them so
          // content requests use the user's real locale (e.g. en-GB).
          if (!user.language) {
            const prefs = await apiClient<{
              language: string;
              region: string;
            }>(`/api/users/${user.userId}/preferences`).catch(() => null);
            if (prefs) {
              user = { ...user, language: prefs.language, region: prefs.region };
            }
          }
          const tokenExpiresAt =
            Date.now() + (result.expiresIn ?? DEFAULT_TOKEN_TTL_SECONDS) * 1000;
          const current = useAuthStore.getState();
          if (current.isAuthenticated) {
            current.refreshSessionData(user, tokenExpiresAt);
          } else {
            current.setSession(user, tokenExpiresAt);
          }
        }
        return;
      }

      if (result.status === "unauthorized") {
        const current = useAuthStore.getState();
        if (current.isAuthenticated) {
          await forceLogout();
        } else {
          current.logout();
        }
      }
      if (result.status === "error") {
        analytics.logRefreshRetryableFailure();
      }
    };

    void revalidate();

    const interval = setInterval(revalidate, SESSION_REFRESH_INTERVAL_MS);
    const onFocus = () => {
      revalidate();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_KEY) return;
      const state = useAuthStore.getState();
      if (event.newValue) {
        state.restoreSession();
        revalidate();
      } else {
        state.logout();
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthInitializer />
        <NotificationInitializer />
        <AnalyticsInitializer />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
