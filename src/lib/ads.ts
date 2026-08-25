/**
 * Central web ads configuration.
 *
 * All AdSense placements read their slot IDs from here so env renames are one-file
 * changes. Ads are fully disabled unless both the master flag and a publisher ID are
 * present; individual placements stay off until their slot ID exists.
 */

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/** Master kill-switch. Set NEXT_PUBLIC_ADS_ENABLED=false to disable all ads (dev/staging). */
export const ADS_ENABLED =
  process.env.NEXT_PUBLIC_ADS_ENABLED !== "false" && !!CLIENT;

/** Slot IDs per placement (create in AdSense → Ads → By ad unit). */
export const AD_SLOTS = {
  /** Home feed (/feed) — display unit between posts. */
  feed: process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT,
  /** Explore trailer pager — display unit as an occasional full-screen slide. */
  explore: process.env.NEXT_PUBLIC_ADSENSE_EXPLORE_SLOT,
} as const;

/** Insert an ad after every Nth post/slide. */
export const AD_INTERVALS = {
  feed: 5,
  explore: 10,
} as const;

export type AdPlacement = keyof typeof AD_SLOTS;

export function isPlacementEnabled(placement: AdPlacement): boolean {
  return ADS_ENABLED && !!AD_SLOTS[placement];
}

export function getAdClient(): string | undefined {
  return ADS_ENABLED ? CLIENT : undefined;
}
