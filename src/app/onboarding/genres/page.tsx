"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, GripVertical, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useOnboardingStore, GENRES } from "@/stores/onboarding-store";

interface GenreFilterResult {
  id: number;
  name: string;
}

export default function OnboardingGenresPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [mode, setMode] = useState<"prefer" | "avoid">("prefer");
  const [preferred, setPreferred] = useState<number[]>(store.preferredGenres);
  const [avoided, setAvoided] = useState<number[]>(store.avoidedGenres);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<GenreFilterResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Debounced search against the backend genre filter
  useEffect(() => {
    const q = searchInput.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient<GenreFilterResult[]>(
          `/api/genres/filter?query=${encodeURIComponent(q)}`
        );
        setSearchResults(data ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const togglePreferred = (id: number) => {
    setPreferred((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
    setAvoided((prev) => prev.filter((g) => g !== id));
  };

  const toggleAvoided = (id: number) => {
    setAvoided((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
    setPreferred((prev) => prev.filter((g) => g !== id));
  };

  // Add a genre found via search (not in the popular list). Cache the name so
  // the review step can display it.
  const addFromSearch = (genre: GenreFilterResult) => {
    store.cacheGenreName(genre.id, genre.name);
    if (mode === "prefer") {
      setPreferred((prev) =>
        prev.includes(genre.id) ? prev : [...prev, genre.id]
      );
      setAvoided((prev) => prev.filter((g) => g !== genre.id));
    } else {
      setAvoided((prev) =>
        prev.includes(genre.id) ? prev : [...prev, genre.id]
      );
      setPreferred((prev) => prev.filter((g) => g !== genre.id));
    }
    setSearchInput("");
    setSearchResults([]);
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const updated = [...preferred];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(idx, 0, moved);
    setPreferred(updated);
    setDraggedIdx(idx);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  const handleContinue = () => {
    store.setPreferredGenres(preferred);
    store.setAvoidedGenres(avoided);
    store.markStepCompleted("genres");
    router.push("/onboarding/streaming");
  };

  const genreName = (id: number) =>
    GENRES.find((g) => g.id === id)?.name ?? store.genreNames[id] ?? "";

  const preferredNames = preferred.map(genreName);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">What do you love to watch?</h2>
        <p className="text-sm text-muted-foreground">
          Select genres you want more of, and some you&apos;d like to avoid.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setMode("prefer")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors",
            mode === "prefer"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          Prefer
        </button>
        <button
          onClick={() => setMode("avoid")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors",
            mode === "avoid"
              ? "bg-red-500 text-white"
              : "bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          Avoid
        </button>
      </div>

      {/* Genre chips */}
      <div className="card p-4">
        <p className="text-xs text-muted-foreground mb-3">
          {mode === "prefer"
            ? "Tap genres you want to see more of:"
            : "Tap genres you want to hide:"}
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => {
            const isPreferred = preferred.includes(genre.id);
            const isAvoided = avoided.includes(genre.id);
            const isActive = mode === "prefer" ? isPreferred : isAvoided;
            return (
              <button
                key={genre.id}
                onClick={() => mode === "prefer" ? togglePreferred(genre.id) : toggleAvoided(genre.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  isActive
                    ? mode === "prefer"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-red-500 text-white border-red-500"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                )}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Find More Genres — backend search */}
      <div className="card p-4 space-y-3">
        <p className="text-sm font-semibold text-primary">Find More Genres</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for genre"
            className="input-base pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
              aria-label="Clear"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {searching && (
          <p className="text-xs text-muted-foreground">Searching…</p>
        )}
        {!searching &&
          searchInput.trim() &&
          (() => {
            const results = searchResults
              .filter((r) => !GENRES.some((g) => g.id === r.id))
              .filter(
                (r) => !preferred.includes(r.id) && !avoided.includes(r.id)
              )
              .slice(0, 5);
            return results.length > 0 ? (
              <div className="space-y-1">
                {results.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => addFromSearch(genre)}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors text-sm"
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No more genres found</p>
            );
          })()}
      </div>

      {/* Preferred ordered list */}
      {preferred.length > 0 && (
        <div className="card p-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Drag to reorder. Top = most important.
          </p>
          <div className="space-y-1">
            {preferred.map((id, idx) => {
              const genre = genreName(id);
              if (!genre) return null;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-grab active:cursor-grabbing select-none",
                    draggedIdx === idx && "opacity-50"
                  )}
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-bold text-primary w-5">{idx + 1}</span>
                  <span className="text-sm flex-1">{genre}</span>
                  <button
                    onClick={() => togglePreferred(id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Avoided list */}
      {avoided.length > 0 && (
        <div className="card p-4 space-y-2 border-red-500/20">
          <p className="text-xs text-red-400">These genres will be filtered out:</p>
          <div className="flex flex-wrap gap-1.5">
            {avoided.map((id) => {
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20"
                >
                  {genreName(id)}
                  <button onClick={() => toggleAvoided(id)}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/basics")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
