"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

const MOBILE_MAX_WIDTH = 1023;

/**
 * Measures the exact space available for a "reel" container on mobile:
 * from the container's own top edge down to the top of the fixed bottom
 * nav. The container is typically preceded by the header, guest banner,
 * page padding and/or headings, so a viewport calc cannot know the real
 * offset — this measures it directly. Desktop returns null so the caller's
 * `lg:h-[...]` class keeps controlling the height there.
 */
export function useReelHeight(
  containerRef: RefObject<HTMLElement | null>
): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    let rafId = 0;

    const compute = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (
          window.matchMedia(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`).matches
        ) {
          setHeight(null);
          return;
        }
        const el = containerRef.current;
        if (!el) return;
        const nav = document.querySelector<HTMLElement>("[data-mobile-nav]");
        const navTop = nav
          ? nav.getBoundingClientRect().top
          : window.innerHeight;
        const containerTop = el.getBoundingClientRect().top;
        const next = Math.max(0, Math.floor(navTop - containerTop - 1));
        setHeight((prev) => (prev === next ? prev : next));
      });
    };

    compute();

    const bodyObserver = new ResizeObserver(compute);
    bodyObserver.observe(document.body);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, { passive: true });
    window.visualViewport?.addEventListener("resize", compute);
    window.visualViewport?.addEventListener("scroll", compute, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      bodyObserver.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
      window.visualViewport?.removeEventListener("resize", compute);
      window.visualViewport?.removeEventListener("scroll", compute);
    };
  }, [containerRef]);

  return height;
}