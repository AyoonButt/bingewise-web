"use client";

import Link from "next/link";
import { Bell, Moon, Sun, Menu } from "lucide-react";
import { userAvatarUrl } from "@/lib/avatar";
import Image from "next/image";
import { useTheme } from "@/components/providers";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useUnreadCount } from "@/hooks/use-notifications";
import { BingeWiseWordmark } from "@/components/ui/brand-logo";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { toggleSidebar } = useUiStore();
  const unreadCount = useUnreadCount(user?.userId);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const isExplore = pathname.startsWith("/explore");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center gap-3 px-4 h-14 safe-area-top transition-all duration-300 border-b",
        isExplore
          ? "max-lg:bg-[var(--explore-nav-bg)] text-white border-white/10 lg:bg-[#0A1628]/80 lg:backdrop-blur-xl"
          : "max-lg:bg-card text-card-foreground border-border lg:bg-background/80 lg:text-foreground lg:backdrop-blur-xl"
      )}
    >
      <button
        onClick={toggleSidebar}
        className={cn(
          "lg:hidden p-2.5 -ml-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
          isExplore ? "hover:bg-white/10" : "hover:bg-accent"
        )}
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
        className={cn(
          "p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
          isExplore ? "hover:bg-white/10" : "hover:bg-accent"
        )}
        aria-label="Toggle theme"
      >
        {mounted ? (
          resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )
        ) : (
          <div className="h-5 w-5" />
        )}
      </button>

      <Link
        href="/notifications"
        className={cn(
          "relative p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
          isExplore ? "hover:bg-white/10" : "hover:bg-accent"
        )}
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
            className={cn(
              "hidden sm:flex items-center gap-2 p-1 pr-3 rounded-full transition-colors",
              isExplore ? "hover:bg-white/10" : "hover:bg-accent"
            )}
          >
            <Image
              src={userAvatarUrl(user.userId, 32)}
              alt={user.name}
              width={32}
              height={32}
              className="avatar avatar-sm"
            />
            <span className="text-sm font-medium">{user.name}</span>
          </Link>
      ) : (
        <Link
          href="/auth/login"
          className="btn-primary h-10 px-3 text-xs sm:text-sm flex items-center"
        >
          Log in
        </Link>
      )}
    </header>
  );
}
