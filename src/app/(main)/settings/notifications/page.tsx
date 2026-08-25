"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import {
  getNotificationPermission,
  registerDevice,
  requestPermission,
  unregisterDevice,
} from "@/lib/push-notifications";
import { ChevronLeft, Loader2, Check, Bell } from "lucide-react";

interface NotificationPreferences {
  userId?: number;
  masterEnabled: boolean;
  repliesEnabled: boolean;
  releasesEnabled: boolean;
  sequelsEnabled: boolean;
  followRequestsEnabled: boolean;
  messagesEnabled: boolean;
  generalEnabled: boolean;
  subscriptionsEnabled: boolean;
  streamingEnabled: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  masterEnabled: true,
  repliesEnabled: true,
  releasesEnabled: true,
  sequelsEnabled: true,
  followRequestsEnabled: true,
  messagesEnabled: true,
  generalEnabled: true,
  subscriptionsEnabled: true,
  streamingEnabled: true,
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<
    "granted" | "denied" | "default" | "unsupported"
  >("default");

  useEffect(() => {
    if (!user?.userId) return;
    apiClient<NotificationPreferences>(
      `/api/users/${user.userId}/notification-preferences`
    )
      .then((data) => {
        if (data) setPrefs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.userId]);

  useEffect(() => {
    setBrowserPermission(getNotificationPermission());
  }, []);

  const handleMasterToggle = async (enabled: boolean) => {
    update("masterEnabled", enabled);
    if (!user) return;

    if (enabled) {
      const current = getNotificationPermission();
      if (current === "denied" || current === "unsupported") {
        setBrowserPermission(current);
        return;
      }
      let permission: "granted" | "denied" | "default" | "unsupported" = current;
      if (permission !== "granted") {
        permission = await requestPermission();
        setBrowserPermission(permission);
      }
      if (permission === "granted") {
        await registerDevice(user.userId);
      }
    } else {
      await unregisterDevice();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiClient(`/api/users/${user.userId}/notification-preferences`, {
        method: "PUT",
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg skeleton" />
          <div className="h-6 skeleton w-40" />
        </div>
        <div className="card p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 skeleton w-32" />
              <div className="h-6 skeleton w-11" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
          Settings saved
        </div>
      )}

      <div className="card divide-y divide-border">
        {/* Master toggle */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Enable Notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive push notifications
              </p>
            </div>
          </div>
          <Toggle
            checked={prefs.masterEnabled}
            onChange={handleMasterToggle}
          />
        </div>

        {/* Browser permission status */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Browser permission</p>
            <p className="text-xs text-muted-foreground">
              {browserPermission === "granted"
                ? "Notifications are enabled in this browser"
                : browserPermission === "denied"
                  ? "Blocked in this browser - enable it in your browser settings"
                  : browserPermission === "unsupported"
                    ? "This browser does not support web push notifications"
                    : "Allow notifications when prompted"}
            </p>
          </div>
          <span
            className={`badge ${
              browserPermission === "granted"
                ? "badge-default"
                : browserPermission === "denied"
                  ? "bg-destructive/10 text-destructive"
                  : "badge-outline"
            }`}
          >
            {browserPermission === "granted"
              ? "Allowed"
              : browserPermission === "denied"
                ? "Blocked"
                : browserPermission === "unsupported"
                  ? "Unsupported"
                  : "Not asked"}
          </span>
        </div>

        {/* Category toggles - only enabled when master is on */}
        {[
          { key: "repliesEnabled" as const, label: "Replies", desc: "When someone replies to your comments" },
          { key: "followRequestsEnabled" as const, label: "Follow Requests", desc: "When someone requests to follow you" },
          { key: "messagesEnabled" as const, label: "Messages", desc: "Direct messages and mentions" },
          { key: "releasesEnabled" as const, label: "Upcoming Releases", desc: "New releases from your favorite genres" },
          { key: "sequelsEnabled" as const, label: "Sequel Releases", desc: "Sequels to movies and shows you've liked" },
          { key: "subscriptionsEnabled" as const, label: "Subscription Updates", desc: "New seasons and status changes" },
          { key: "streamingEnabled" as const, label: "Streaming Alerts", desc: "Streaming availability updates" },
          { key: "generalEnabled" as const, label: "General", desc: "Announcements and general updates" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Toggle
              checked={prefs[key]}
              onChange={(v) => update(key, v)}
              disabled={!prefs.masterEnabled}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground px-1">
        Push notifications work in Chrome, Edge, Firefox and Safari 16.4+.
        Turning off &quot;Enable Notifications&quot; stops web push on this device.
      </p>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full h-11"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </div>
  );
}
