"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, Loader2, Check } from "lucide-react";

interface UserPreferences {
  minMovie: number | null;
  maxMovie: number | null;
  minTV: number | null;
  maxTV: number | null;
  oldestDate: string | null;
  recentDate: string | null;
}

interface MediaPreferences {
  minMovieDuration: number;
  maxMovieDuration: number;
  minTvDuration: number;
  maxTvDuration: number;
  startYear: number;
  endYear: number;
}

const DEFAULT_PREFS: MediaPreferences = {
  minMovieDuration: 60,
  maxMovieDuration: 240,
  minTvDuration: 20,
  maxTvDuration: 120,
  startYear: 1970,
  endYear: new Date().getFullYear(),
};

const CURRENT_YEAR = new Date().getFullYear();

export default function MediaPreferencesPage() {
  const user = useAuthStore((s) => s.user);
  const [prefs, setPrefs] = useState<MediaPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    apiClient<UserPreferences>(`/api/users/${user.userId}/preferences`)
      .then((data) => {
        if (data) {
          setPrefs({
            minMovieDuration: data.minMovie ?? DEFAULT_PREFS.minMovieDuration,
            maxMovieDuration: data.maxMovie ?? DEFAULT_PREFS.maxMovieDuration,
            minTvDuration: data.minTV ?? DEFAULT_PREFS.minTvDuration,
            maxTvDuration: data.maxTV ?? DEFAULT_PREFS.maxTvDuration,
            startYear: data.oldestDate
              ? parseInt(data.oldestDate.split("-")[0])
              : DEFAULT_PREFS.startYear,
            endYear: data.recentDate
              ? parseInt(data.recentDate.split("-")[0])
              : DEFAULT_PREFS.endYear,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiClient(`/api/users/${user.userId}`, {
        method: "PUT",
        body: JSON.stringify({
          minMovie: prefs.minMovieDuration,
          maxMovie: prefs.maxMovieDuration,
          minTV: prefs.minTvDuration,
          maxTV: prefs.maxTvDuration,
          oldestDate: `${prefs.startYear}-01-01`,
          recentDate: `${prefs.endYear}-12-31`,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof MediaPreferences, value: number) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg skeleton" />
          <div className="h-6 skeleton w-40" />
        </div>
        <div className="card p-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 skeleton w-24" />
              <div className="h-4 skeleton w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight">Media Preferences</h2>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          Preferences saved
        </div>
      )}

      {/* Movie Duration */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold">Movie Duration (minutes)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Min</label>
            <input
              type="number"
              value={prefs.minMovieDuration}
              onChange={(e) => update("minMovieDuration", Number(e.target.value))}
              min={0}
              max={prefs.maxMovieDuration}
              className="input-base"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Max</label>
            <input
              type="number"
              value={prefs.maxMovieDuration}
              onChange={(e) => update("maxMovieDuration", Number(e.target.value))}
              min={prefs.minMovieDuration}
              max={600}
              className="input-base"
            />
          </div>
        </div>
      </div>

      {/* TV Episode Duration */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold">TV Episode Duration (minutes)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Min</label>
            <input
              type="number"
              value={prefs.minTvDuration}
              onChange={(e) => update("minTvDuration", Number(e.target.value))}
              min={0}
              max={prefs.maxTvDuration}
              className="input-base"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Max</label>
            <input
              type="number"
              value={prefs.maxTvDuration}
              onChange={(e) => update("maxTvDuration", Number(e.target.value))}
              min={prefs.minTvDuration}
              max={600}
              className="input-base"
            />
          </div>
        </div>
      </div>

      {/* Release Year Range */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold">Release Year Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">From</label>
            <input
              type="number"
              value={prefs.startYear}
              onChange={(e) => update("startYear", Number(e.target.value))}
              min={1900}
              max={CURRENT_YEAR}
              className="input-base"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">To</label>
            <input
              type="number"
              value={prefs.endYear}
              onChange={(e) => update("endYear", Number(e.target.value))}
              min={prefs.startYear}
              max={CURRENT_YEAR + 2}
              className="input-base"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full h-11"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </div>
  );
}
