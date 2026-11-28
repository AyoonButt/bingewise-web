"use client";

import { useEffect, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { analytics } from "@/lib/analytics";
import { toTrackingKey } from "@/lib/title-tracking";
import { useTitleTrackingMutations } from "@/hooks/use-title-tracking";
import type { TitleTrackingDto, TrackCandidate } from "@/types/title-tracking";

interface TvProgressEditorProps {
  candidate: TrackCandidate;
  entry: TitleTrackingDto | null;
  onSaved?: () => void;
}

function parsePositive(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function TvProgressEditor({
  candidate,
  entry,
  onSaved,
}: TvProgressEditorProps) {
  const user = useAuthStore((s) => s.user);
  const key = toTrackingKey(candidate);
  const { upsert, isSaving, error } = useTitleTrackingMutations(user?.userId);
  const [season, setSeason] = useState(entry?.lastSeason ? String(entry.lastSeason) : "");
  const [episode, setEpisode] = useState(
    entry?.lastEpisode ? String(entry.lastEpisode) : ""
  );

  useEffect(() => {
    setSeason(entry?.lastSeason ? String(entry.lastSeason) : "");
    setEpisode(entry?.lastEpisode ? String(entry.lastEpisode) : "");
  }, [candidate.tmdbId, entry?.lastSeason, entry?.lastEpisode]);

  if (key.mediaType !== "tv") return null;

  const lastSeason = parsePositive(season);
  const lastEpisode = parsePositive(episode);
  const valid = lastSeason !== null && lastEpisode !== null;

  const save = async (nextSeason: number | null, nextEpisode: number | null) => {
    if ((nextSeason === null) !== (nextEpisode === null) || isSaving) return;
    try {
      await upsert({
        ...key,
        status: "watching",
        note: entry?.note ?? null,
        lastSeason: nextSeason,
        lastEpisode: nextEpisode,
      });
    } catch {
      return;
    }
    if (nextSeason !== null && nextEpisode !== null) {
      analytics.logTvProgressSaved(
        {
          tmdbId: key.tmdbId,
          mediaType: key.mediaType,
          postId: candidate.postId,
        },
        nextSeason,
        nextEpisode
      );
    }
    onSaved?.();
  };

  const increment = () => {
    const nextSeason = lastSeason ?? 1;
    const nextEpisode = (lastEpisode ?? 0) + 1;
    setSeason(String(nextSeason));
    setEpisode(String(nextEpisode));
    void save(nextSeason, nextEpisode);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Progress</p>
        <p className="text-xs text-muted-foreground">Season and episode</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">S</span>
        <input
          type="number"
          min={1}
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          aria-label="Season number"
          className="input-base h-9 w-16 px-2 text-center"
          placeholder="2"
        />
        <span className="text-sm text-muted-foreground">E</span>
        <input
          type="number"
          min={1}
          value={episode}
          onChange={(e) => setEpisode(e.target.value)}
          aria-label="Episode number"
          className="input-base h-9 w-16 px-2 text-center"
          placeholder="4"
        />
        <button
          type="button"
          onClick={increment}
          disabled={isSaving}
          className="btn-outline h-9 px-2.5 flex items-center gap-1 text-sm"
          aria-label="Increment episode"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+1</span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void save(lastSeason, lastEpisode)}
          disabled={!valid || isSaving}
          className="btn-primary h-9 flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save progress
        </button>
        <button
          type="button"
          onClick={() => {
            setSeason("");
            setEpisode("");
            void save(null, null);
          }}
          disabled={!entry?.lastSeason || isSaving}
          className="btn-outline h-9 px-3 flex items-center gap-1 text-sm disabled:opacity-50"
        >
          <Minus className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
