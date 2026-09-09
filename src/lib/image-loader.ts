export default function tmdbLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If already an absolute URL (TMDB, dicebear, etc.), return as-is without optimization
  if (/^https?:\/\//i.test(src)) {
    return src;
  }
  // Fallback for relative paths (shouldn't happen with tmdbImage)
  return src;
}