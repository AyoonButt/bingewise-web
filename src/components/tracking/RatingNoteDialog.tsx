"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Star, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { analytics } from "@/lib/analytics";
import { toTrackingKey } from "@/lib/title-tracking";
import { useTitleTrackingMutations } from "@/hooks/use-title-tracking";
import { cn } from "@/lib/utils";
import type { TitleTrackingDto, TrackCandidate } from "@/types/title-tracking";

const schema = z.object({
  rating: z.number().int().min(0).max(5),
  note: z.string().max(500, "Notes are limited to 500 characters"),
});

type FormValues = z.infer<typeof schema>;

interface RatingNoteDialogProps {
  open: boolean;
  candidate: TrackCandidate;
  entry: TitleTrackingDto | null;
  onClose: () => void;
}

export function RatingNoteDialog({
  open,
  candidate,
  entry,
  onClose,
}: RatingNoteDialogProps) {
  const user = useAuthStore((s) => s.user);
  const key = toTrackingKey(candidate);
  const { upsert, isSaving, error } = useTitleTrackingMutations(user?.userId);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: entry?.rating ?? 0,
      note: entry?.note ?? "",
    },
  });

  const rating = watch("rating");
  const note = watch("note");

  useEffect(() => {
    if (open) {
      reset({ rating: entry?.rating ?? 0, note: entry?.note ?? "" });
    }
  }, [open, entry?.rating, entry?.note, reset]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSaving, onClose]);

  if (!open) return null;

  const onSubmit = async (values: FormValues) => {
    const nextRating = values.rating > 0 ? values.rating : null;
    const nextNote = values.note.trim() || null;
    try {
      await upsert({
        ...key,
        status: "watched",
        rating: nextRating,
        note: nextNote,
        lastSeason: null,
        lastEpisode: null,
      });
    } catch {
      return;
    }
    const ref = {
      tmdbId: key.tmdbId,
      mediaType: key.mediaType,
      postId: candidate.postId,
    };
    if (nextRating !== null) analytics.logTitleRatingSet(ref, nextRating);
    if (nextNote !== null) analytics.logTitleNoteSaved(ref, nextNote.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={isSaving ? undefined : onClose}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative w-full max-w-md bg-background border border-border rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Rate &amp; note</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Your rating</p>
          <div className="flex items-center gap-1" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("rating", value)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                className="p-1 rounded-lg hover:bg-accent transition-colors"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    value <= rating
                      ? "fill-[var(--star-yellow)] text-[var(--star-yellow)]"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setValue("rating", 0)}
                className="text-xs text-muted-foreground hover:text-foreground ml-2"
              >
                Clear
              </button>
            )}
          </div>
          {errors.rating && (
            <p className="text-xs text-destructive">{errors.rating.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="tracking-note">
            Private note <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="tracking-note"
            {...register("note")}
            placeholder="Only you can see this"
            className="input-base min-h-[70px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Only you can see this</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {note.length}/500
            </p>
          </div>
          {errors.note && (
            <p className="text-xs text-destructive">{errors.note.message}</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error.message}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="btn-outline flex-1 h-10"
          >
            Skip
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex-1 h-10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
