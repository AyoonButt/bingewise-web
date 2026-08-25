"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { usePushToastStore } from "@/stores/push-toast-store";
import { useUnreadStore } from "@/stores/unread-store";
import {
  getStoredToken,
  onForegroundMessage,
  onServiceWorkerMessage,
  registerDevice,
  registerServiceWorker,
  unregisterDevice,
} from "@/lib/push-notifications";
import { NotificationToastHost } from "./NotificationToast";

export function NotificationInitializer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.userId);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      unregisterDevice();
      return;
    }

    let active = true;
    const { push } = usePushToastStore.getState();

    const setup = async () => {
      if (!active) return;
      await registerServiceWorker();

      if (getStoredToken()) {
        await registerDevice(userId);
      }

      const unsubscribeMessage = onForegroundMessage((payload) => {
        if (!active) return;
        useUnreadStore.getState().bump();
        push({
          type: payload.type,
          title: payload.title,
          message: payload.message,
          referenceId: payload.referenceId,
          senderName: payload.senderName,
        });
      });

      const unsubscribeSW = onServiceWorkerMessage((event) => {
        const data = event.data;
        if (data.type === "FORCE_LOGOUT") {
          useAuthStore.getState().logout();
          window.location.href = "/auth/login";
        }
      });

      return () => {
        unsubscribeMessage();
        unsubscribeSW();
      };
    };

    const cleanup = setup();
    return () => {
      active = false;
      cleanup.then((fn) => fn?.());
    };
  }, [isAuthenticated, userId]);

  return <NotificationToastHost />;
}