"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTrackingSheetStore } from "@/stores/tracking-sheet-store";
import { useTrackingForTitle } from "@/hooks/use-title-tracking";
import { toTrackingKey } from "@/lib/title-tracking";
import { TrackSheet } from "@/components/tracking/TrackSheet";
import { RatingNoteDialog } from "@/components/tracking/RatingNoteDialog";
import { TvProgressEditor } from "@/components/tracking/TvProgressEditor";
import type { TitleTrackingDto, TrackCandidate } from "@/types/title-tracking";

function ProgressDialog({
  candidate,
  entry,
  onClose,
}: {
  candidate: TrackCandidate;
  entry: TitleTrackingDto | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-background border border-border rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">TV progress</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <TvProgressEditor candidate={candidate} entry={entry} onSaved={onClose} />
      </div>
    </div>
  );
}

export function TrackSheetHost() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const candidate = useTrackingSheetStore((s) => s.candidate);
  const subdialog = useTrackingSheetStore((s) => s.subdialog);
  const closeSheet = useTrackingSheetStore((s) => s.closeSheet);
  const closeSubdialog = useTrackingSheetStore((s) => s.closeSubdialog);
  const key = candidate ? toTrackingKey(candidate) : null;
  const entryQuery = useTrackingForTitle(user?.userId, key);
  const entry = entryQuery.data ?? null;

  if (!candidate) return null;

  return (
    <>
      <TrackSheet
        candidate={candidate}
        onClose={closeSheet}
        onManageLists={() => {
          closeSheet();
          router.push("/watchlists");
        }}
      />
      {subdialog === "rating" && (
        <RatingNoteDialog
          open
          candidate={candidate}
          entry={entry}
          onClose={closeSubdialog}
        />
      )}
      {subdialog === "progress" && (
        <ProgressDialog
          candidate={candidate}
          entry={entry}
          onClose={closeSubdialog}
        />
      )}
    </>
  );
}
