"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, Users, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleNavClick } from "@/hooks/use-nav-refresh";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/watchlists", label: "Lists", icon: Bookmark },
  { href: "/following", label: "Following", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();
  const isExplore = pathname.startsWith("/explore");

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 inset-x-0 z-50 safe-area-inset transition-colors duration-300",
        isExplore ? "bg-[var(--explore-nav-bg)] border-t border-white/10" : "bg-card border-t border-border"
      )}
    >
      <div className="flex items-center justify-around h-16">
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
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 h-full transition-colors relative",
                isActive
                  ? (isExplore ? "text-[var(--explore-nav-selected)]" : "text-primary")
                  : (isExplore ? "text-[var(--explore-nav-unselected)]" : "text-muted-foreground active:text-foreground")
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
              {isActive && (
                <div
                  className={cn(
                    "absolute -bottom-0 h-[3px] w-8 rounded-t-full transition-colors",
                    isExplore ? "bg-[var(--explore-nav-selected)]" : "bg-primary"
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
