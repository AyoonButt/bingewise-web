"use client";

import { decodeHtmlEntities } from "@/lib/utils";

interface OverviewCardProps {
  overview: string;
}

export function OverviewCard({ overview }: OverviewCardProps) {
  const text = decodeHtmlEntities(overview);
  if (!text || text === "null") return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold mb-2">Overview</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {text}
      </p>
    </div>
  );
}
