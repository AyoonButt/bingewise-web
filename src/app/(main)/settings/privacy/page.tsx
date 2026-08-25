"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { PrivacyToggle } from "@/components/settings/PrivacyToggle";
import { ChevronLeft, Shield, Lock, Globe } from "lucide-react";

export default function PrivacyPage() {
  const user = useAuthStore((s) => s.user);
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);

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
        <h2 className="text-xl font-bold tracking-tight">Privacy</h2>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Account Privacy</p>
            <p className="text-xs text-muted-foreground">
              Control who can see your content
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Globe className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Private Account</p>
                <p className="text-xs text-muted-foreground">
                  {isPrivate
                    ? "Only approved followers can see your posts"
                    : "Anyone can see your posts"}
                </p>
              </div>
            </div>
            <PrivacyToggle
              userId={user.userId}
              isPrivate={isPrivate}
              onToggle={setIsPrivate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
