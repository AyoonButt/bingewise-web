import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const STORAGE_KEY = "bw:scroll-memory";

type ScrollMap = Record<string, number>;

/**
 * Wipes all remembered scroll offsets. Called on auth transitions (login,
 * register, logout) so a fresh session always starts at the top instead of
 * restoring a stale position from a previous session. Returning from
 * sub-pages (e.g. settings) is unaffected — same-session memory stays intact.
 */
export function clearScrollMemory(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readMap(): ScrollMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") as ScrollMap;
  } catch {
    return {};
  }
}

function writeMap(map: ScrollMap): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / serialization errors */
  }
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Remembers the scroll position of a view (keyed by `key`) and restores it when
 * the view is mounted again — e.g. after navigating into a poster detail page
 * and coming back. Works for both window-scrolling lists (omit `containerRef`)
 * and inner scroll containers (reels) by passing the container ref.
 *
 * Restoration only fires once the content is tall enough to reach the saved
 * offset, so it waits for async data to render before snapping back.
 */
export function useScrollRestoration(
  key: string,
  options: { containerRef?: RefObject<HTMLElement | null>; ready?: boolean } = {}
): void {
  const { containerRef, ready = true } = options;
  const restoredRef = useRef(false);

  const getScroll = (): number => {
    const el = containerRef?.current ?? null;
    return el ? el.scrollTop : window.scrollY;
  };

  const setScroll = (value: number): void => {
    const el = containerRef?.current ?? null;
    if (el) {
      el.scrollTop = value;
    } else {
      window.scrollTo(0, value);
    }
  };

  // Continuously persist scroll position. We deliberately avoid saving only in
  // the unmount cleanup, because React 18 Strict Mode runs that cleanup once on
  // the very first mount (with scroll at 0) and would clobber the real position
  // saved from a previous visit. Listening to scroll keeps the latest offset in
  // storage so navigation away/back restores correctly.
  useIsoLayoutEffect(() => {
    if (!key) return;
    const persist = () => {
      const map = readMap();
      map[key] = getScroll();
      writeMap(map);
    };
    const onHide = () => persist();
    window.addEventListener("pagehide", onHide);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        persist();
      });
    };
    const target: Window | HTMLElement = containerRef?.current ?? window;
    target.addEventListener("scroll", onScroll as EventListener, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pagehide", onHide);
      target.removeEventListener("scroll", onScroll as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Restore once the view is ready and tall enough to contain the offset.
  useIsoLayoutEffect(() => {
    if (!key || !ready || restoredRef.current) return;
    const target = readMap()[key];
    if (typeof target !== "number") return;

    let frame = 0;
    let attempts = 0;
    const attempt = () => {
      const el = containerRef?.current ?? null;
      const max =
        el != null
          ? el.scrollHeight - el.clientHeight
          : document.documentElement.scrollHeight - window.innerHeight;
      if (target <= max || attempts >= 60) {
        setScroll(target);
        restoredRef.current = true;
        return;
      }
      attempts++;
      frame = requestAnimationFrame(attempt);
    };
    frame = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
}
