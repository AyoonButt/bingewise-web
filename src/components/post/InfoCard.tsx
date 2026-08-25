"use client";

import { SectionHeader } from "@/components/ui/section-header";

interface InfoRow {
  label: string;
  value: string;
}

interface InfoCardProps {
  rows: InfoRow[];
}

export function InfoCard({ rows }: InfoCardProps) {
  const visibleRows = rows.filter(
    (r) => r.value && r.value !== "null" && r.value !== "N/A"
  );

  if (visibleRows.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
      {visibleRows.map((row) => (
        <div key={row.label} className="flex gap-2 text-sm">
          <span className="font-semibold text-muted-foreground shrink-0">
            {row.label}
          </span>
          <span className="text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
