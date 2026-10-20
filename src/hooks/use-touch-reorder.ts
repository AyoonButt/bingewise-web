"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface TouchReorderCallbacks {
  onReorder: (fromIndex: number, toIndex: number) => void;
  getItemCount: () => number;
  itemHeight: number;
  gap: number;
}

export function useTouchReorder({
  onReorder,
  getItemCount,
  itemHeight,
  gap,
}: TouchReorderCallbacks) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const startIndexRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);
  const dragStartTimeRef = useRef<number>(0);
  const startClientYRef = useRef<number>(0);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const DRAG_THRESHOLD = 8;
  const DRAG_DELAY = 150;

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const getItemCountRef = useRef(getItemCount);
  getItemCountRef.current = getItemCount;

  const dropTargetIndexRef = useRef(dropTargetIndex);
  dropTargetIndexRef.current = dropTargetIndex;

  const itemsContainerRefRef = useRef(itemsContainerRef);
  itemsContainerRefRef.current = itemsContainerRef;

  const getItemCountRefCurrent = () => getItemCountRef.current();
  const itemHeightRef = useRef(itemHeight);
  itemHeightRef.current = itemHeight;
  const gapRef = useRef(gap);
  gapRef.current = gap;

  const DRAG_THRESHOLD_CONST = 8;
  const DRAG_DELAY_CONST = 150;

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const startIndex = startIndexRef.current;
    if (startIndex === null) return;

    const deltaY = e.clientY - startClientYRef.current;
    const deltaTime = Date.now() - dragStartTimeRef.current;
    const distance = Math.abs(deltaY);

    if (!dragStartedRef.current) {
      if (distance < DRAG_THRESHOLD_CONST && deltaTime < DRAG_DELAY_CONST) return;
      dragStartedRef.current = true;
      setDraggingIndex(startIndex);
      setDragOffset({ x: 0, y: deltaY });
    }

    if (dragStartedRef.current) {
      e.preventDefault();
      setDragOffset((prev) => ({ x: prev.x, y: deltaY }));

      const container = itemsContainerRefRef.current?.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const relativeY = e.clientY - containerRect.top;
      const targetIndex = Math.floor(
        (relativeY + gapRef.current / 2) / (itemHeightRef.current + gapRef.current)
      );
      const clampedIndex = Math.max(
        0,
        Math.min(getItemCountRef.current() - 1, targetIndex)
      );

      if (clampedIndex !== startIndex && clampedIndex !== dropTargetIndexRef.current) {
        dropTargetIndexRef.current = clampedIndex;
        setDropTargetIndex(clampedIndex);
      }
    }
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const startIndex = startIndexRef.current;

    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerUp);

    if (startIndex !== null) {
      const target = e.target as HTMLElement;
      if (target) {
        target.style.userSelect = "";
        target.style.touchAction = "";
      }
    }

    if (dragStartedRef.current && startIndex !== null && dropTargetIndexRef.current !== null) {
      onReorderRef.current(startIndex, dropTargetIndexRef.current);
    }

    setDraggingIndex(null);
    setDragOffset({ x: 0, y: 0 });
    setDropTargetIndex(null);
    dropTargetIndexRef.current = null;
    startIndexRef.current = null;
    dragStartedRef.current = false;
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      if (e.button !== 0 && e.pointerType !== "touch") return;

      startIndexRef.current = index;
      dragStartedRef.current = false;
      dragStartTimeRef.current = Date.now();
      startClientYRef.current = e.clientY;

      const target = e.currentTarget as HTMLElement;
      target.style.userSelect = "none";
      target.style.touchAction = "none";

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    itemsContainerRef,
    handlePointerDown,
    draggingIndex,
    dragOffset,
    dropTargetIndex,
    isDragging: dragStartedRef.current,
  };
}