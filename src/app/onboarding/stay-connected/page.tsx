"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  getNotificationPermission,
  registerDevice,
  requestPermission,
  unregisterDevice,
} from "@/lib/push-notifications";

export default function StayConnectedPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const userId = useAuthStore((s) => s.user?.userId);
  const [masterEnabled, setMasterEnabled] = useState(store.notificationsEnabled);
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handlePermission = async () => {
    setRequesting(true);
    try {
      setPermission(await requestPermission());
    } finally {
      setRequesting(false);
    }
  };

  const handleContinue = async () => {
    store.setNotificationsEnabled(masterEnabled);
    store.markStepCompleted("stay-connected");

    if (!userId) {
      router.push("/onboarding/vibe-check");
      return;
    }

    if (!masterEnabled) {
      await unregisterDevice();
    } else if (permission === "granted") {
      await registerDevice(userId);
    } else {
      // Never leave a token registered if alerts will not be shown.
      await unregisterDevice();
    }

    router.push("/onboarding/vibe-check");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Stay Connected</h2>
        <p className="text-sm text-muted-foreground">
          Choose whether this browser can show BingeWise alerts.
        </p>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Enable web alerts</p>
          <p className="text-xs text-muted-foreground">
            This setting applies to this browser only.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={masterEnabled}
          onClick={() => setMasterEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
            masterEnabled ? "bg-primary" : "bg-secondary"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
              masterEnabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {masterEnabled && permission !== "granted" && permission !== "unsupported" && (
        <button
          onClick={handlePermission}
          disabled={requesting}
          className="w-full py-2.5 rounded-xl text-sm border border-primary/40 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {requesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enabling…
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" /> Allow browser alerts
            </>
          )}
        </button>
      )}

      {masterEnabled && permission === "granted" && (
        <p className="text-center text-xs text-muted-foreground">
          Browser alerts are allowed for this device.
        </p>
      )}

      {masterEnabled && permission === "denied" && (
        <p className="text-center text-xs text-muted-foreground">
          Browser alerts are blocked. You can still use BingeWise normally.
        </p>
      )}

      {masterEnabled && permission === "unsupported" && (
        <p className="text-center text-xs text-muted-foreground">
          This browser does not support web alerts.
        </p>
      )}

      {!masterEnabled && (
        <p className="text-center text-xs text-muted-foreground">
          Alerts are off. You can enable them later in Settings.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/streaming")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
