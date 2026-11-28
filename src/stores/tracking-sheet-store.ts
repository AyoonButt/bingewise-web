"use client";

import { create } from "zustand";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { analytics } from "@/lib/analytics";
import { isTitleTrackingEnabled } from "@/lib/session";
import { candidateFromPost } from "@/lib/title-tracking";
import type { PostDto } from "@/types/post";
import type { TrackCandidate } from "@/types/title-tracking";

export type TrackingSubdialog = "none" | "rating" | "progress";

interface TrackingSheetState {
  candidate: TrackCandidate | null;
  subdialog: TrackingSubdialog;
  openSheet: (candidate: TrackCandidate) => void;
  closeSheet: () => void;
  openSubdialog: (subdialog: Exclude<TrackingSubdialog, "none">) => void;
  closeSubdialog: () => void;
}

export const useTrackingSheetStore = create<TrackingSheetState>((set) => ({
  candidate: null,
  subdialog: "none",
  openSheet: (candidate) => set({ candidate, subdialog: "none" }),
  closeSheet: () => set({ candidate: null, subdialog: "none" }),
  openSubdialog: (subdialog) => set({ subdialog }),
  closeSubdialog: () => set({ subdialog: "none" }),
}));

export function openTrackSheet(candidate: TrackCandidate): boolean {
  if (!isTitleTrackingEnabled()) return false;
  if (!useAuthStore.getState().user) {
    useUiStore.getState().openSignupPrompt();
    return true;
  }
  analytics.logTrackSheetOpened({
    tmdbId: candidate.tmdbId,
    mediaType: candidate.mediaType,
    postId: candidate.postId,
  });
  useTrackingSheetStore.getState().openSheet(candidate);
  return true;
}

export function openTrackSheetForPost(post: PostDto): boolean {
  return openTrackSheet(candidateFromPost(post));
}
