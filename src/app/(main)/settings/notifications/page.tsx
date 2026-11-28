"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import {
  readLocalNotificationPreferences,
  writeLocalNotificationPreferences,
} from "@/lib/notification-preferences";
import {
  getNotificationPermission,
  registerDevice,
  requestPermission,
  unregisterDevice,
} from "@/lib/push-notifications";
import { Bell, Check, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Permission = ReturnType<typeof getNotificationPermission>;

export default function NotificationSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [enabled, setEnabled] = useState(true);
  const [permission, setPermission] = useState<Permission>("default");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    setEnabled(readLocalNotificationPreferences(user.userId)?.masterEnabled ?? true);
  }, [user?.userId]);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleToggle = async (next: boolean) => {
    if (!user?.userId) return;
    setSaving(true);
    setSaved(false);

    let active = next;
    if (next) {
      let current = getNotificationPermission();
      if (current !== "granted") {
        current = await requestPermission();
      }
      setPermission(current);
      active = current === "granted";
    }

    writeLocalNotificationPreferences(user.userId, { masterEnabled: active });
    setEnabled(active);

    if (active) {
      await registerDevice(user.userId);
    } else {
      await unregisterDevice();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight">Notification Settings</h2>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          Saved for this browser
        </div>
      )}

      <div className="card divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Enable web alerts</p>
              <p className="text-xs text-muted-foreground">
                This setting applies to this browser only.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-pressed={enabled}
            disabled={saving}
            onClick={() => handleToggle(!enabled)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50",
              enabled ? "bg-primary" : "bg-muted"
            )}
          >
            {saving ? (
              <Loader2 className="absolute left-1 h-4 w-4 animate-spin text-foreground" />
            ) : (
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  enabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Browser permission</p>
            <p className="text-xs text-muted-foreground">
              {permission === "granted"
                ? "BingeWise can show alerts in this browser"
                : permission === "denied"
                  ? "Blocked in this browser — enable it in your browser settings"
                  : permission === "unsupported"
                    ? "This browser does not support web push notifications"
                    : "Allow notifications when prompted"}
            </p>
          </div>
          <span
            className={cn(
              "badge",
              permission === "granted"
                ? "badge-default"
                : permission === "denied"
                  ? "bg-destructive/10 text-destructive"
                  : "badge-outline"
            )}
          >
            {permission === "granted"
              ? "Allowed"
              : permission === "denied"
                ? "Blocked"
                : permission === "unsupported"
                  ? "Unsupported"
                  : "Not asked"}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-1">
        Turning alerts off unregisters this browser. Other devices and apps keep
        their own notification settings.
      </p>
    </div>
  );
}
