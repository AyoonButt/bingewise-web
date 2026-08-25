"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { logout as apiLogout } from "@/lib/auth";
import { unregisterDevice } from "@/lib/push-notifications";

export function useAuth() {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const logout = async () => {
    await unregisterDevice();
    await apiLogout();
    storeLogout();
    router.push("/auth/login");
  };

  return { user, isAuthenticated, setUser, logout };
}
