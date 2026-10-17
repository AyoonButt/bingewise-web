"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { logout as apiLogout } from "@/lib/auth";
import { unregisterDevice } from "@/lib/push-notifications";
import { analytics } from "@/lib/analytics";

export function useAuth() {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const logout = async () => {
    analytics.sessionEnd();
    await unregisterDevice();
    await apiLogout();
    storeLogout();
    router.push("/auth/login");
  };

  return { user, isAuthenticated, setUser, logout };
}
