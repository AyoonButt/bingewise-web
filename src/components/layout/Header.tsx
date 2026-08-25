"use client";

import Link from "next/link";
import { Bell, Moon, Sun, Menu } from "lucide-react";
import { userAvatarUrl } from "@/lib/avatar";
import { useTheme } from "@/components/providers";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useUnreadCount } from "@/hooks/use-notifications";
import { BingeWiseWordmark } from "@/components/ui/brand-logo";
import { useState, useEffect } from "react";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { toggleSidebar } = useUiStore();
  const unreadCount = useUnreadCount(user?.userId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-background/80 backdrop-blur-xl border-b border-border">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="lg:hidden text-lg font-bold tracking-tight">
        <BingeWiseWordmark />
      </h1>

      <div className="flex-1" />

      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        {mounted ? (
          resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5 text-primary" />
          ) : (
            <Moon className="h-5 w-5 text-primary" />
          )
        ) : (
          <div className="h-5 w-5" />
        )}
      </button>

      <Link
        href="/notifications"
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {mounted && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      {user?.username ? (
          <Link
            href="/settings"
            className="hidden sm:flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-accent transition-colors"
          >
            <img
              src={userAvatarUrl(user.userId, 32)}
              alt={user.name}
              className="avatar avatar-sm"
            />
            <span className="text-sm font-medium">{user.name}</span>
          </Link>
      ) : (
        <Link
          href="/auth/login"
          className="btn-primary h-8 px-3 text-xs sm:text-sm flex items-center"
        >
          Log in
        </Link>
      )}
    </header>
  );
}
