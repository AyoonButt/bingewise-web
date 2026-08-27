"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Search,
  Users,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/brand-logo";
import { GearIcon } from "@/components/ui/icons";
import { handleNavClick } from "@/hooks/use-nav-refresh";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/following", label: "Following", icon: Users },
  { href: "/watchlists", label: "Watchlists", icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const isExplore = pathname.startsWith("/explore");

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:h-screen lg:sticky lg:top-0 transition-colors duration-300",
        isExplore
          ? "bg-[var(--explore-nav-bg)] border-white/10"
          : "bg-card border-border"
      )}
    >
      <div className="p-6 pb-4">
        <Link href="/feed">
          <BrandLogo size="md" />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href, isActive)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? (isExplore ? "bg-[var(--explore-nav-selected)] text-white" : "bg-primary/10 text-primary")
                  : (isExplore ? "text-[var(--explore-nav-unselected)] hover:bg-white/10" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? (isExplore ? "text-white" : "text-primary")
                    : (isExplore ? "text-[var(--explore-nav-unselected)]" : "text-muted-foreground")
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            pathname.startsWith("/settings")
              ? (isExplore ? "bg-[var(--explore-nav-selected)] text-white" : "bg-primary/10 text-primary")
              : (isExplore ? "text-[var(--explore-nav-unselected)] hover:bg-white/10" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")
          )}
        >
          <GearIcon
            className={cn(
              "h-5 w-5",
              pathname.startsWith("/settings")
                ? (isExplore ? "text-white" : "text-primary")
                : (isExplore ? "text-[var(--explore-nav-unselected)]" : "text-muted-foreground")
            )}
          />
          Settings
        </Link>
      </div>
    </aside>
  );
}
