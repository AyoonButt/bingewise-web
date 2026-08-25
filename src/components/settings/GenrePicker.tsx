"use client";

import { useEffect, useRef, useState, DragEvent } from "react";
import { Check, GripVertical, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { AVAILABLE_GENRES } from "@/types/genre";

interface SelectedGenre {
  id: number;
  name: string;
}

interface GenrePickerProps {
  userId: number;
  type: "preferred" | "avoid";
}

export function GenrePicker({ userId, type }: GenrePickerProps) {
  const [selected, setSelected] = useState<SelectedGenre[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const baselineRef = useRef<string>("");

  const isPreferred = type === "preferred";
  const dirty = JSON.stringify(selected) !== baselineRef.current;

  // Load the user's saved genres
  useEffect(() => {
    const endpoint = isPreferred
      ? `/api/genres/user/${userId}/genres`
      : `/api/genres/users/${userId}/avoidGenres`;
    apiClient<unknown[]>(endpoint)
      .then((data) => {
        // Accept both id/genreId + name/genreName field variants
        const initial = (data ?? [])
          .map((raw: unknown) => {
            const g = raw as Record<string, unknown>;
            return {
              id: (g.id ?? g.genreId) as number,
              name: (g.name ?? g.genreName ?? "") as string,
            };
          })
          .filter((g) => g.id != null && g.name !== "");
        setSelected(initial);
        baselineRef.current = JSON.stringify(initial);
      })
      .catch((err) => {
        console.error("[GenrePicker] failed to load genres:", err);
        setSelected([]);
        baselineRef.current = "[]";
      })
      .finally(() => setLoaded(true));
  }, [userId, isPreferred]);

  // Local search over the known genre list (the backend's catalog is the
  // same 19 genres), excluding what's already selected.
  const query = searchInput.trim().toLowerCase();
  const searchResults: SelectedGenre[] = query
    ? AVAILABLE_GENRES.filter(
        (g) =>
          g.genreName.toLowerCase().includes(query) &&
          !selected.some((s) => s.id === g.genreId)
      ).map((g) => ({ id: g.genreId, name: g.genreName }))
    : [];

  const addGenre = (genre: SelectedGenre) => {
    setSelected((prev) =>
      prev.some((g) => g.id === genre.id) ? prev : [...prev, genre]
    );
    setSearchInput("");
  };

  const removeGenre = (id: number) => {
    setSelected((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDragStart = (e: DragEvent, idx: number) => {
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const handleDrop = (e: DragEvent, toIdx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === toIdx) return;
    setSelected((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggingIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDraggingIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const availableResults = searchResults.filter(
    (r) => !selected.some((g) => g.id === r.id)
  );

  const save = async () => {
    setSaving(true);
    try {
      if (isPreferred) {
        const body = selected.map((g, i) => ({
          userId,
          genreId: g.id,
          genreName: g.name,
          priority: i + 1,
        }));
        await apiClient(`/api/genres/user/${userId}/update-genres`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      } else {
        await apiClient(`/api/genres/users/${userId}/avoidGenres/update`, {
          method: "PUT",
          body: JSON.stringify(selected.map((g) => g.id)),
        });
      }
      baselineRef.current = JSON.stringify(selected);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search-to-add */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={
            isPreferred ? "Search genres to add" : "Search genres to avoid"
          }
          className="input-base pl-10"
        />
      </div>

      {query && (
        <div className="card border-border p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isPreferred
              ? `Search Results (${searchResults.length})`
              : `Add to Avoid List (${searchResults.length})`}
          </p>
          {searchResults.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {searchResults.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => addGenre(genre)}
                  className="px-3 py-1.5 text-sm rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No matching genres</p>
          )}
        </div>
      )}

      {/* Selected genres */}
      {isPreferred ? (
        <>
          <p className="text-sm font-semibold">Your genres (drag to reorder)</p>
          {!loaded ? (
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
          ) : selected.length === 0 ? (
            <p className="text-sm text-muted-foreground">No genres selected yet</p>
          ) : (
            <div className="space-y-1">
              {selected.map((genre, idx) => (
                <div
                  key={genre.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border text-sm transition-all cursor-grab active:cursor-grabbing",
                    dragOverIdx === idx && draggingIdx !== idx
                      ? "border-primary/60 bg-primary/5"
                      : "border-border",
                    draggingIdx === idx && "opacity-40"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 font-medium">{genre.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                  <button
                    onClick={() => removeGenre(genre.id)}
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted shrink-0"
                    aria-label={`Remove ${genre.name}`}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground px-1">
                Drag to reorder. Top = highest priority
              </p>
            </div>
          )}
        </>
      ) : !loaded ? (
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
      ) : selected.length === 0 ? (
        <p className="text-sm text-muted-foreground">No genres to avoid</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selected.map((genre) => (
            <span
              key={genre.id}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-sm rounded-full font-medium bg-destructive/10 text-destructive border border-destructive/30"
            >
              {genre.name}
              <button
                onClick={() => removeGenre(genre.id)}
                className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-destructive/20"
                aria-label={`Remove ${genre.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="btn-primary h-10 px-5 inline-flex items-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
        {justSaved && (
          <span className="text-sm text-primary inline-flex items-center gap-1">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
