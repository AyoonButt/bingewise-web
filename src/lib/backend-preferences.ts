function numberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function nullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

/**
 * Maps an onboarding preference payload to exactly the fields the backend
 * accepts. Kept outside the route module so the field contract can be tested
 * directly without importing a Next.js route handler.
 */
export function buildBackendPreferences(input: Record<string, unknown>) {
  // Exactly the fields in the backend's UserPreferencesDto. The backend uses a
  // strict ObjectMapper, so unknown or mis-cased keys (e.g. minTv) cause a 400.
  return {
    userId: Number(input.userId) || 0,
    language: stringValue(input.language, "en"),
    region: stringValue(input.region, "US"),
    minMovie: nullableInt(input.minMovie),
    maxMovie: nullableInt(input.maxMovie),
    minTV: nullableInt(input.minTV),
    maxTV: nullableInt(input.maxTV),
    oldestDate: stringValue(input.oldestDate, "1900-01-01"),
    recentDate: stringValue(input.recentDate, "2099-12-31"),
    isPrivate: Boolean(input.isPrivate),
    contentRatingAge: Number(input.contentRatingAge) || 99,
    contentLanguagePreference: stringValue(input.contentLanguagePreference, "ANY"),
    subscriptions: numberArray(input.subscriptions),
    genreIds: numberArray(input.genreIds),
    avoidGenreIds: numberArray(input.avoidGenreIds),
    softAvoidGenreIds: numberArray(input.softAvoidGenreIds),
    excludedTmdbIds: numberArray(input.excludedTmdbIds),
  };
}
