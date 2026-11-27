"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import type { StreamingProviderDto } from "@/types/provider";

interface ProviderApiResponse {
  provider_id?: number;
  providerId?: number;
  provider_name?: string;
  providerName?: string;
  logo_path?: string | null;
  logoPath?: string | null;
  display_priority?: number;
  displayPriority?: number;
}

function mapProvider(p: ProviderApiResponse): StreamingProviderDto {
  const rawLogo = p.logo_path ?? p.logoPath ?? null;
  return {
    providerId: p.provider_id ?? p.providerId ?? null,
    providerName: p.provider_name ?? p.providerName ?? "",
    logoPath: rawLogo
      ? rawLogo.startsWith("http")
        ? rawLogo
        : `https://image.tmdb.org/t/p/w92${rawLogo}`
      : null,
    displayPriority: p.display_priority ?? p.displayPriority ?? 999,
  };
}

function dedupeProviders(providers: StreamingProviderDto[]): StreamingProviderDto[] {
  const seen = new Set<number>();
  return providers.filter((provider) => {
    if (provider.providerId === null || seen.has(provider.providerId)) return false;
    seen.add(provider.providerId);
    return true;
  });
}

interface ProviderTileProps {
  provider: StreamingProviderDto;
  selected: boolean;
  priority?: number;
  compact?: boolean;
  dragging?: boolean;
  dragOver?: boolean;
  onClick: () => void;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

function ProviderTile({
  provider,
  selected,
  priority,
  compact = false,
  dragging = false,
  dragOver = false,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ProviderTileProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={provider.providerName}
      aria-pressed={selected}
      draggable={Boolean(onDragStart)}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "relative flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-all select-none",
        compact && "h-[72px]",
        selected
          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
          : "border-border bg-card hover:border-primary/40",
        dragging && "opacity-40",
        dragOver && "border-primary bg-primary/15"
      )}
    >
      {provider.logoPath ? (
        <Image
          src={provider.logoPath}
          alt={provider.providerName}
          width={compact ? 24 : 32}
          height={compact ? 24 : 32}
          className="object-contain"
        />
      ) : (
        <div className={cn("rounded bg-muted", compact ? "h-6 w-6" : "h-8 w-8")} />
      )}
      <span className="line-clamp-1 w-full text-xs font-medium leading-tight">
        {provider.providerName}
      </span>
      {priority !== undefined && (
        <span className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
          {priority}
        </span>
      )}
    </div>
  );
}

export default function OnboardingStreamingPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  // The starting slate must come from the region-aware /providers/top endpoint.
  const [providers, setProviders] = useState<StreamingProviderDto[]>([]);
  const [selected, setSelected] = useState<StreamingProviderDto[]>(() => {
    const ids =
      store.orderedSelectedProviders.length > 0
        ? store.orderedSelectedProviders
        : store.selectedProviders;
    return ids
      .map((id) =>
        store.selectedProvidersDetails.find((p) => p.providerId === id) ??
        { providerId: id, providerName: `Provider ${id}`, logoPath: null, displayPriority: 999 }
      )
      .filter((provider) => provider.providerId !== null);
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<StreamingProviderDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const selectedIds = useMemo(
    () => new Set(selected.map((provider) => provider.providerId).filter((id): id is number => id !== null)),
    [selected]
  );
  const popularIds = useMemo(
    () => new Set(providers.map((provider) => provider.providerId).filter((id): id is number => id !== null)),
    [providers]
  );

  const loadProviders = useCallback(async (region: string) => {
    setLoading(true);
    setLoadError(false);
    try {
      // apiClient prefixes /api/backend; backend contract is
      // GET /api/providers/top?country=<region>.
      const data = await apiClient<ProviderApiResponse[]>(
        `/api/providers/top?country=${encodeURIComponent(region)}`
      );
      const mapped = dedupeProviders((data ?? []).map(mapProvider));
      setProviders(mapped);
      // Persisted selections may only contain IDs; hydrate their names/logos
      // from the same region endpoint rather than a hardcoded fallback list.
      setSelected((prev) =>
        prev.map((item) => {
          const match = mapped.find((p) => p.providerId === item.providerId);
          return match ?? item;
        })
      );
    } catch {
      setProviders([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProviders(store.region || "US");
  }, [loadProviders, store.region]);

  useEffect(() => {
    const query = searchInput.trim();
    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await apiClient<ProviderApiResponse[]>(
          `/api/providers/filter?query=${encodeURIComponent(query)}&country=${store.region || "US"}`
        );
        if (!active) return;
        setSearchResults(
          dedupeProviders((data ?? []).map(mapProvider))
            .filter((provider) => {
              const id = provider.providerId;
              return id !== null && !selectedIds.has(id) && !popularIds.has(id);
            })
            .slice(0, 3)
        );
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchInput, store.region, selectedIds, popularIds]);

  const toggle = (provider: StreamingProviderDto) => {
    const id = provider.providerId;
    if (id === null) return;
    setSelected((prev) =>
      prev.some((item) => item.providerId === id)
        ? prev.filter((item) => item.providerId !== id)
        : [...prev, provider]
    );
  };

  const handleDrop = (toId: number) => {
    if (draggingId === null || draggingId === toId) return;
    setSelected((prev) => {
      const fromIndex = prev.findIndex((item) => item.providerId === draggingId);
      const toIndex = prev.findIndex((item) => item.providerId === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDraggingId(null);
    setDragOverId(null);
  };

  const visibleProviders = useMemo(
    () => [...selected, ...providers.filter((provider) => {
      const id = provider.providerId;
      return id !== null && !selectedIds.has(id);
    })],
    [providers, selected, selectedIds]
  );

  const handleContinue = () => {
    store.setSelectedProviders(selected.map((provider) => provider.providerId).filter((id): id is number => id !== null));
    store.setSelectedProvidersDetails(selected);
    store.markStepCompleted("streaming-services");
    router.push("/onboarding/stay-connected");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">What do you watch on?</h2>
        <p className="text-sm text-muted-foreground">Select your streaming services</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Add another service"
          placeholder="Add another service"
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {searchInput.trim() && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Matches</p>
          {searching ? (
            <p className="text-xs text-muted-foreground">Searching…</p>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {searchResults.map((provider) => (
                <ProviderTile
                  key={provider.providerId}
                  provider={provider}
                  selected={false}
                  compact
                  onClick={() => {
                    toggle(provider);
                    setSearchInput("");
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No matches for &quot;{searchInput.trim()}&quot;
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Popular in your region</p>
        <p className="text-right text-xs text-muted-foreground">
          {selected.length === 0
            ? "Tap a logo to select"
            : `${selected.length} selected · drag to set priority`}
        </p>
      </div>

      {!loading && loadError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs text-muted-foreground">
          Couldn&apos;t load providers for this region.{" "}
          <button
            type="button"
            onClick={() => void loadProviders(store.region || "US")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && visibleProviders.length === 0 && (
        <p className="rounded-xl border border-border p-4 text-center text-xs text-muted-foreground">
          No providers are available for this region yet. Search above to add one.
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {visibleProviders.map((provider) => {
            if (provider.providerId === null) return null;
            const id = provider.providerId;
            const isSelected = selectedIds.has(id);
            const priorityIndex = selected.findIndex((item) => item.providerId === id);
            return (
              <ProviderTile
                key={id}
                provider={provider}
                selected={isSelected}
                priority={priorityIndex >= 0 ? priorityIndex + 1 : undefined}
                dragging={draggingId === id}
                dragOver={dragOverId === id && draggingId !== id}
                onClick={() => toggle(provider)}
                onDragStart={isSelected ? (event) => {
                  setDraggingId(id);
                  event.dataTransfer.effectAllowed = "move";
                } : undefined}
                onDragOver={isSelected ? (event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverId(id);
                } : undefined}
                onDrop={isSelected ? (event) => {
                  event.preventDefault();
                  handleDrop(id);
                } : undefined}
                onDragEnd={isSelected ? () => {
                  setDraggingId(null);
                  setDragOverId(null);
                } : undefined}
              />
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/ratings")}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
