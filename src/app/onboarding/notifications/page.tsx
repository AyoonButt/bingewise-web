"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Bell, Reply, UserPlus, Mail, Film, Clapperboard, Globe, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";

const categories = [
  { key: "repliesEnabled" as const, icon: Reply, label: "Replies", desc: "When someone replies to your posts" },
  { key: "followRequestsEnabled" as const, icon: UserPlus, label: "Follow Requests", desc: "When someone follows you" },
  { key: "messagesEnabled" as const, icon: Mail, label: "Messages", desc: "When you receive DMs" },
  { key: "releasesEnabled" as const, icon: Film, label: "Upcoming Releases", desc: "Reminders for movies and TV premieres" },
  { key: "sequelsEnabled" as const, icon: Clapperboard, label: "Sequels", desc: "When sequels to your favorites are announced" },
  { key: "subscriptionsEnabled" as const, icon: Layers, label: "New Seasons", desc: "When shows you follow return" },
  { key: "streamingEnabled" as const, icon: Globe, label: "Streaming Availability", desc: "When saved content becomes available to stream" },
  { key: "generalEnabled" as const, icon: Bell, label: "General", desc: "App updates and announcements" },
];

export default function OnboardingNotificationsPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [masterEnabled, setMasterEnabled] = useState(store.notificationsEnabled);
  const [enabled, setEnabled] = useState(() => ({
    repliesEnabled: store.repliesEnabled,
    followRequestsEnabled: store.followRequestsEnabled,
    messagesEnabled: store.messagesEnabled,
    releasesEnabled: store.releasesEnabled,
    sequelsEnabled: store.sequelsEnabled,
    generalEnabled: store.generalEnabled,
    subscriptionsEnabled: store.subscriptionsEnabled,
    streamingEnabled: store.streamingEnabled,
  }));

  const toggle = (key: keyof typeof enabled) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleContinue = () => {
    store.setNotificationsEnabled(masterEnabled);
    Object.entries(enabled).forEach(([k, v]) =>
      store.setNotificationCategory(k as keyof typeof enabled, v)
    );
    store.markStepCompleted("notifications");
    router.push("/onboarding/privacy");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Stay Connected</h2>
        <p className="text-sm text-muted-foreground">
          Get notified about activity that matters to you.
        </p>
      </div>

      {/* Master toggle */}
      <div className="card p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Enable Notifications</p>
          <p className="text-xs text-muted-foreground">Receive updates about content and activity</p>
        </div>
        <button
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

      {/* Category toggles */}
      {masterEnabled && (
        <div className="card divide-y divide-border">
          {categories.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center gap-3 p-4">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                  enabled[key] ? "bg-primary" : "bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                    enabled[key] ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {!masterEnabled && (
        <p className="text-center text-xs text-muted-foreground">
          Notifications are disabled. You can enable them later in Settings.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/ratings")}
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
