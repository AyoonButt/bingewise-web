export const WATCHLIST_PALETTE = [
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#EAB308",
  "#6366F1",
  "#64748B",
];

export const DEFAULT_COVER_COLOR = "#3B82F6";

export function parseCoverColor(hex?: string | null): string {
  if (!hex) return DEFAULT_COVER_COLOR;
  const value = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{8}$/.test(value)) {
    return `#${value.slice(2).toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase()}`;
  }
  return DEFAULT_COVER_COLOR;
}
