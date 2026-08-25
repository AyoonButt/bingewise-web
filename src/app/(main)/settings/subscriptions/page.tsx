"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { SubscriptionPicker } from "@/components/settings/SubscriptionPicker";
import { ChevronLeft, Tv } from "lucide-react";

export default function SubscriptionsSettingsPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight">
          Streaming Services
        </h2>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tv className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Your Subscriptions</p>
            <p className="text-xs text-muted-foreground">
              Select the streaming services you use
            </p>
          </div>
        </div>
        <SubscriptionPicker userId={user.userId} />
      </div>
    </div>
  );
}
