"use client";

// Tracks how many intercept modals are currently stacked so the "X" button can
// return the user to the exact state they were in *before* the first modal
// (poster / person / item) was opened — regardless of how many layers deep
// (e.g. poster -> item) they navigated.

let depth = 0;

/**
 * Call from a modal's mount effect. Returns a cleanup to call on unmount.
 * Each opened modal corresponds to exactly one router.push (one history entry),
 * so `depth` equals the number of history steps needed to dismiss the stack.
 */
export function registerModalOpen(): () => void {
  depth += 1;
  return () => {
    depth = Math.max(0, depth - 1);
  };
}

/**
 * Dismisses every stacked modal and returns to the page that was visible before
 * the first one opened. Uses history.go(-depth) so the @modal parallel slot
 * reverts to its default (null) for the underlying route.
 */
export function closeAllModals(): void {
  if (typeof window === "undefined") return;
  if (depth > 0) {
    window.history.go(-depth);
  }
}
