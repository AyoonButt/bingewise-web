import type { TitleTrackingKey } from "@/types/title-tracking";

type TitleTrackingListener = (key: TitleTrackingKey | null) => void;

const listeners = new Set<TitleTrackingListener>();
const INVALIDATION_EVENT = "bw-title-tracking-invalidated";

export function notifyTitleTrackingChanged(key: TitleTrackingKey | null = null): void {
  listeners.forEach((listener) => listener(key));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<TitleTrackingKey | null>(INVALIDATION_EVENT, { detail: key })
    );
  }
}

export function onTitleTrackingChanged(
  listener: TitleTrackingListener
): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") return () => listeners.delete(listener);

  const handler = (event: Event) => {
    listener((event as CustomEvent<TitleTrackingKey | null>).detail ?? null);
  };
  window.addEventListener(INVALIDATION_EVENT, handler);
  return () => {
    listeners.delete(listener);
    window.removeEventListener(INVALIDATION_EVENT, handler);
  };
}
