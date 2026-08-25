"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  refreshing?: boolean;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  refreshing,
  className,
}: PullToRefreshProps) {
  const { pull, isRefreshing } = usePullToRefresh({ onRefresh, refreshing });

  return (
    <div className={className} style={{ touchAction: "pan-y" }}>
      <div
        style={{
          height: pull,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          transition: isRefreshing ? "height 200ms ease" : "none",
        }}
      >
        {(pull > 0 || isRefreshing) && (
          <div className="pb-2">
            <Loader2
              className={`h-5 w-5 text-muted-foreground ${
                isRefreshing ? "animate-spin" : ""
              }`}
              style={
                isRefreshing ? undefined : { transform: `rotate(${pull * 4}deg)` }
              }
            />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
