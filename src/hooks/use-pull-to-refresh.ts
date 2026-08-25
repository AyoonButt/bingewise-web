"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  onRefresh: () => void | Promise<void>;
  scrollRef?: React.RefObject<HTMLElement | null>;
  refreshing?: boolean;
}

const THRESHOLD = 64;
const MAX_PULL = 100;

export function usePullToRefresh({ onRefresh, scrollRef, refreshing }: Options) {
  const [pull, setPull] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const pressed = useRef(false);
  const pullRef = useRef(0);
  const localRefreshing = useRef(false);

  const getScrollTop = () =>
    scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY;

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (localRefreshing.current) return;
      if (getScrollTop() <= 0) {
        startY.current = e.clientY;
        startX.current = e.clientX;
        pressed.current = true;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (startY.current == null || !pressed.current || localRefreshing.current)
        return;
      const dy = e.clientY - (startY.current ?? 0);
      const dx = e.clientX - (startX.current ?? 0);
      if (Math.abs(dx) > Math.abs(dy)) {
        startY.current = null;
        pressed.current = false;
        setPull(0);
        pullRef.current = 0;
        return;
      }
      if (dy > 0 && getScrollTop() <= 0) {
        const p = Math.min(MAX_PULL, dy * 0.5);
        pullRef.current = p;
        setPull(p);
      } else if (dy <= 0) {
        startY.current = null;
        pressed.current = false;
        setPull(0);
        pullRef.current = 0;
      }
    };

    const onUp = async () => {
      if (startY.current == null) return;
      const p = pullRef.current;
      startY.current = null;
      pressed.current = false;
      if (p >= THRESHOLD && !localRefreshing.current) {
        localRefreshing.current = true;
        setIsRefreshing(true);
        setPull(THRESHOLD);
        try {
          await onRefresh();
        } finally {
          localRefreshing.current = false;
          setIsRefreshing(false);
          setPull(0);
          pullRef.current = 0;
        }
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    };

    const target: HTMLElement | Window = scrollRef?.current ?? window;
    target.addEventListener("pointerdown", onDown as EventListener);
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerup", onUp as EventListener);
    target.addEventListener("pointercancel", onUp as EventListener);
    return () => {
      target.removeEventListener("pointerdown", onDown as EventListener);
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerup", onUp as EventListener);
      target.removeEventListener("pointercancel", onUp as EventListener);
    };
  }, [onRefresh, scrollRef]);

  useEffect(() => {
    if (refreshing && !localRefreshing.current) {
      setIsRefreshing(true);
      setPull(THRESHOLD);
    } else if (!refreshing && !localRefreshing.current) {
      setIsRefreshing(false);
      setPull(0);
    }
  }, [refreshing]);

  return { pull, isRefreshing };
}
