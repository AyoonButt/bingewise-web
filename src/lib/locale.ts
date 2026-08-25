export function getLanguageRegion(
  user?: { language?: string; region?: string } | null
): string {
  const language = user?.language || "en";
  const region = user?.region || "US";
  return `${language}-${region}`;
}