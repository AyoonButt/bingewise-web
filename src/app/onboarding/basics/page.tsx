"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FULL_LANGUAGES, FULL_REGIONS } from "@/lib/locales";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useOnboardingStore } from "@/stores/onboarding-store";

const MOVIE_MIN_OPTIONS = [
  { value: 0, label: "Any length" },
  { value: 60, label: "1+ hour" },
  { value: 90, label: "1.5+ hours" },
  { value: 120, label: "2+ hours" },
];

const MOVIE_MAX_OPTIONS = [
  { value: 90, label: "Up to 1.5h" },
  { value: 120, label: "Up to 2h" },
  { value: 180, label: "Up to 3h" },
  { value: 240, label: "Up to 4h" },
  { value: 300, label: "No limit" },
];

const TV_MIN_OPTIONS = [
  { value: 0, label: "Any length" },
  { value: 15, label: "15+ min" },
  { value: 30, label: "30+ min" },
  { value: 45, label: "45+ min" },
  { value: 60, label: "1+ hour" },
];

const TV_MAX_OPTIONS = [
  { value: 30, label: "Up to 30 min" },
  { value: 45, label: "Up to 45 min" },
  { value: 60, label: "Up to 1 hour" },
  { value: 90, label: "No limit" },
];

const OLDEST_YEARS = ["", "1950", "1970", "1980", "1990", "2000", "2010", "2015", "2020"];
const RECENT_YEARS = ["", "CURRENT", "2025", "2024", "2023", "2020", "2015", "2010"];

export default function OnboardingBasicsPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [language, setLanguage] = useState(store.language);
  const [region, setRegion] = useState(store.region);
  const [minMovie, setMinMovie] = useState(store.minMovieDuration);
  const [maxMovie, setMaxMovie] = useState(store.maxMovieDuration);
  const [minTv, setMinTv] = useState(store.minTvDuration);
  const [maxTv, setMaxTv] = useState(store.maxTvDuration);
  const [oldestYear, setOldestYear] = useState(store.oldestDate.slice(0, 4));
  const [recentYear, setRecentYear] = useState(
    store.recentDate === "CURRENT" ? "CURRENT" : store.recentDate.slice(0, 4)
  );

  const handleContinue = () => {
    store.setLanguage(language);
    store.setRegion(region);
    store.setMovieDuration(minMovie, maxMovie);
    store.setTvDuration(minTv, maxTv);
    const oldest = oldestYear ? `${oldestYear}-01-01` : "";
    const recent = recentYear === "CURRENT" ? "CURRENT" : recentYear ? `${recentYear}-12-31` : "";
    store.setDateRange(oldest, recent);
    store.markStepCompleted("basics");
    router.push("/onboarding/genres");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight">Set your basics</h2>
        <p className="text-sm text-muted-foreground">
          Language, region, and content format preferences.
        </p>
      </div>

      {/* Language & Region */}
      <div className="card p-5 space-y-4">
        <h3 className="text-base font-semibold">Language & Region</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Language</label>
            <SearchableSelect
              className="mt-1"
              value={language}
              onChange={setLanguage}
              placeholder="Select language"
              searchPlaceholder="Search languages…"
              options={FULL_LANGUAGES.map((l) => ({
                value: l.code,
                label:
                  l.nativeName !== l.name
                    ? `${l.name} (${l.nativeName})`
                    : l.name,
                keywords: `${l.name} ${l.nativeName ?? ""}`,
              }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Country/Region</label>
            <SearchableSelect
              className="mt-1"
              value={region}
              onChange={setRegion}
              placeholder="Select country"
              searchPlaceholder="Search countries…"
              options={FULL_REGIONS.map((r) => ({
                value: r.code,
                label: r.name,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Movie Duration */}
      <div className="card p-5 space-y-4">
        <h3 className="text-base font-semibold">Movie Length</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Minimum</label>
            <select
              value={minMovie}
              onChange={(e) => setMinMovie(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MOVIE_MIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Maximum</label>
            <select
              value={maxMovie}
              onChange={(e) => setMaxMovie(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MOVIE_MAX_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TV Duration */}
      <div className="card p-5 space-y-4">
        <h3 className="text-base font-semibold">TV Episode Length</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Minimum</label>
            <select
              value={minTv}
              onChange={(e) => setMinTv(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TV_MIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Maximum</label>
            <select
              value={maxTv}
              onChange={(e) => setMaxTv(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TV_MAX_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="card p-5 space-y-4">
        <h3 className="text-base font-semibold">Release Date Range</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">From (oldest)</label>
            <select
              value={oldestYear}
              onChange={(e) => setOldestYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Any year</option>
              {OLDEST_YEARS.filter(Boolean).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">To (newest)</label>
            <select
              value={recentYear}
              onChange={(e) => setRecentYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Any year</option>
              <option value="CURRENT">Up to today</option>
              {RECENT_YEARS.filter((y): boolean => !!y && y !== "CURRENT").map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
