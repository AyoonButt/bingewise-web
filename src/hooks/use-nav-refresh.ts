import type { MouseEvent } from "react";
import { useUiStore } from "@/stores/ui-store";

/** Tabs whose content can be refreshed by re-tapping their nav icon. */
const REFRESHABLE_PATHS = new Set(["/feed", "/explore"]);

/**
 * Nav click handler: tapping the icon of the page you're already on refreshes
 * its content (like native apps) instead of performing a no-op navigation.
 */
export function handleNavClick(
  e: MouseEvent,
  href: string,
  isActive: boolean
): void {
  if (isActive && REFRESHABLE_PATHS.has(href)) {
    e.preventDefault();
    useUiStore.getState().triggerContentRefresh();
  }
}
