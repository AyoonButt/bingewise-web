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

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-inset">
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
                  ? "text-secondary"
                  : "text-muted-foreground active:text-foreground"
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
                <div className="absolute -bottom-0 h-[3px] w-8 rounded-t-full bg-secondary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
