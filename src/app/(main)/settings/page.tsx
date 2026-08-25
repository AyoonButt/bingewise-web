"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, ChevronRight, ChevronLeft } from "lucide-react";
import { useTheme } from "@/components/providers";
import { userAvatarUrl } from "@/lib/avatar";
import { settingsLinks } from "@/lib/settings-nav";
import Image from "next/image";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/feed"
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight brand-gradient-text">Settings</h2>
      </div>

      {user && (
        <Link
          href={`/user/${user.username}`}
          className="card p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors group"
        >
          <Image
            src={userAvatarUrl(user.userId, 96)}
            alt={user.name}
            width={64}
            height={64}
            className="avatar avatar-xl rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {user.name}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              @{user.username}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      )}

      <div className="card divide-y divide-border">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-xs text-muted-foreground">
                  {link.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Appearance</p>
            <p className="text-xs text-muted-foreground">Toggle dark mode</p>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-primary"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme === "dark" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors font-medium text-sm"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
