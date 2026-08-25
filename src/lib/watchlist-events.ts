type WatchlistChangedListener = (watchlistId: number) => void;

const listeners = new Set<WatchlistChangedListener>();

const INVALIDATION_EVENT = "bw-watchlists-invalidated";

export function notifyWatchlistChanged(watchlistId: number): void {
  listeners.forEach((listener) => listener(watchlistId));
}

/**
 * Signals that the owned-watchlists collection changed (cloned, created,
 * deleted) so every mounted My Lists view refetches immediately.
 */
export function notifyWatchlistsInvalidated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INVALIDATION_EVENT));
  }
}

export function onWatchlistsInvalidated(
  listener: () => void
): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(INVALIDATION_EVENT, listener);
  return () => window.removeEventListener(INVALIDATION_EVENT, listener);
}

export function onWatchlistChanged(
  listener: WatchlistChangedListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
