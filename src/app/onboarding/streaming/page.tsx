"use client";

import { useState, useEffect, useCallback, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Search, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import type { StreamingProviderDto } from "@/types/provider";

interface ProviderApiResponse {
  providerId: number | null;
  providerIdInt?: number;
  providerName: string;
  providerNameStr?: string;
  logoPath: string | null;
  logoPathStr?: string | null;
  displayPriority: number;
  displayPriorityInt?: number;
}

function mapProvider(p: ProviderApiResponse): StreamingProviderDto {
  return {
    providerId: p.providerId ?? p.providerIdInt ?? 0,
    providerName: p.providerName || p.providerNameStr || "",
    logoPath: p.logoPath
      ? `https://image.tmdb.org/t/p/w92${p.logoPath}`
      : null,
    displayPriority: p.displayPriority ?? p.displayPriorityInt ?? 999,
  };
}

export default function OnboardingStreamingPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [providers, setProviders] = useState<StreamingProviderDto[]>([]);
  const [selected, setSelected] = useState<StreamingProviderDto[]>(
    store.selectedProvidersDetails.length > 0
      ? store.selectedProvidersDetails
      : []
  );
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<StreamingProviderDto[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // Debounce search + fetch
  useEffect(() => {
    const timer = setTimeout(async () => {
      const region = store.region;
      const q = searchInput.trim();

      if (!q) {
        setSearch("");
        setSearchResults(null);
        return;
      }

      setSearch(q);
      setSearching(true);
      try {
        const data = await apiClient<ProviderApiResponse[]>(
          `/api/providers/filter?query=${encodeURIComponent(q)}&country=${region}`
        );
        setSearchResults((data ?? []).map(mapProvider));
      } catch (err) {
        console.error("[streaming] /api/providers/filter error:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, store.region]);

  // Initial top providers fetch
  useEffect(() => {
    const region = store.region;
    apiClient<ProviderApiResponse[]>(`/api/providers/top?country=${region}`)
      .then((data) => {
        setProviders((data ?? []).map(mapProvider));
      })
      .catch(() => {
        setProviders([]);
      })
      .finally(() => setLoading(false));
  }, [store.region]);

  const toggle = (provider: StreamingProviderDto) => {
    if (!provider.providerId) return;
    if (selected.some((s) => s.providerId === provider.providerId)) {
      setSelected((prev) => prev.filter((s) => s.providerId !== provider.providerId));
    } else {
      setSelected((prev) => [...prev, provider]);
    }
  };

  const remove = (id: number) => {
    setSelected((prev) => prev.filter((s) => s.providerId !== id));
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

  const filtered = providers.filter(
    (p) =>
      (p.providerName?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  const handleContinue = () => {
    store.setSelectedProviders(selected.map((p) => p.providerId!).filter(Boolean));
    store.setSelectedProvidersDetails(selected);
    store.markStepCompleted("streaming");
    router.push("/onboarding/ratings");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">What do you watch on?</h2>
        <p className="text-sm text-muted-foreground">
          Select and reorder services by importance.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search services…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Search results dropdown */}
          {search && (
            <div className="card border-border overflow-hidden">
              {searching ? (
                <p className="text-xs text-muted-foreground px-3 py-3">Searching…</p>
              ) : searchResults !== null && searchResults.length > 0 ? (
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {searchResults.map((provider) => {
                    if (!provider.providerId) return null;
                    return (
                      <button
                        key={provider.providerId}
                        onClick={() => toggle(provider)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                      >
                        {provider.logoPath ? (
                          <img
                            src={provider.logoPath}
                            alt={provider.providerName}
                            className="h-6 w-6 object-contain rounded shrink-0"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted shrink-0" />
                        )}
                        <span className="text-sm font-medium">{provider.providerName}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {selected.some((s) => s.providerId === provider.providerId)
                            ? "Already added"
                            : "Tap to add"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-3 py-3">No results for "{search}"</p>
              )}
            </div>
          )}

          {/* Selected — reorderable list */}
          {selected.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Your priority order
              </p>
              <div className="space-y-1">
                {selected.map((provider, idx) => (
                  <div
                    key={provider.providerId}
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
                    {provider.logoPath ? (
                      <img
                        src={provider.logoPath}
                        alt={provider.providerName}
                        className="h-6 w-6 object-contain rounded shrink-0"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-muted shrink-0" />
                    )}
                    <span className="flex-1 font-medium">{provider.providerName}</span>
                    <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                    <button
                      onClick={() => remove(provider.providerId!)}
                      className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted shrink-0"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground px-1">Drag to reorder. Top = highest priority</p>
            </div>
          )}

          {/* All providers grid — hidden while searching */}
          {!search && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.slice(0, 18).map((provider) => {
                if (!provider.providerId) return null;
                const pid = provider.providerId;
                const isSelected = selected.some((s) => s.providerId === pid);
                return (
                  <button
                    key={pid}
                    onClick={() => toggle(provider)}
                    className={cn(
                      "p-3 rounded-xl border text-sm font-medium text-center transition-all flex flex-col items-center gap-1.5 relative",
                      isSelected
                        ? "bg-primary/10 border-primary/60 text-primary"
                        : "bg-card border-border hover:border-primary/40 text-foreground"
                    )}
                  >
                    {provider.logoPath ? (
                      <img
                        src={provider.logoPath}
                        alt={provider.providerName}
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted" />
                    )}
                    <span className="text-xs leading-tight">{provider.providerName}</span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {selected.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {selected.length} service{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/genres")}
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
