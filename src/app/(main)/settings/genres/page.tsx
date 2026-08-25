"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { GenrePicker } from "@/components/settings/GenrePicker";
import { ChevronLeft, Palette } from "lucide-react";

export default function GenresSettingsPage() {
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
        <h2 className="text-xl font-bold tracking-tight">Genre Preferences</h2>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Preferred Genres</p>
            <p className="text-xs text-muted-foreground">
              Select genres you enjoy watching
            </p>
          </div>
        </div>
        <GenrePicker userId={user.userId} type="preferred" />
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <p className="text-sm font-medium">Avoid Genres</p>
          <p className="text-xs text-muted-foreground">
            Genres you don&apos;t want recommendations for
          </p>
        </div>
        <GenrePicker userId={user.userId} type="avoid" />
      </div>
    </div>
  );
}
