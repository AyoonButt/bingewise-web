"use client";

import { useEffect, useRef, useState, DragEvent } from "react";
import { Check, GripVertical, Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { getLanguageRegion } from "@/lib/locale";
import { useAuthStore } from "@/stores/auth-store";
import type { StreamingProviderDto, UserSubscriptionDto } from "@/types/provider";

interface ProviderApiResponse {
  providerId: number | null;
  provider_id?: number | null;
  providerName: string;
  provider_name?: string;
  logoPath: string | null;
  logo_path?: string | null;
  displayPriority: number;
  display_priority?: number;
}

function mapProvider(p: ProviderApiResponse): StreamingProviderDto {
  const rawLogo = p.logoPath ?? p.logo_path ?? null;
  return {
    providerId: p.providerId ?? p.provider_id ?? 0,
    providerName: p.providerName || p.provider_name || "",
    logoPath: rawLogo
      ? rawLogo.startsWith("http")
        ? rawLogo
        : `https://image.tmdb.org/t/p/w92${rawLogo}`
      : null,
    displayPriority: p.displayPriority ?? p.display_priority ?? 999,
  };
}

function providerLogoUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `https://image.tmdb.org/t/p/w92${path}`;
}

interface SubscriptionPickerProps {
  userId: number;
}

export function SubscriptionPicker({ userId }: SubscriptionPickerProps) {
  const user = useAuthStore((s) => s.user);
  const region = getLanguageRegion(user).split("-")[1] ?? "US";
  const [selected, setSelected] = useState<UserSubscriptionDto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<StreamingProviderDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const baselineRef = useRef<string>("");

  const dirty = JSON.stringify(selected) !== baselineRef.current;

  // Load the user's subscriptions (returned in priority order)
  useEffect(() => {
    apiClient<UserSubscriptionDto[]>(`/api/providers/user/${userId}/subscriptions`)
      .then((subs) => {
        const initial = subs ?? [];
        setSelected(initial);
        baselineRef.current = JSON.stringify(initial);
      })
      .catch(() => {
        setSelected([]);
        baselineRef.current = "[]";
      })
      .finally(() => setLoaded(true));
  }, [userId]);

  // Debounced provider search via /api/providers/filter
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
        const data = await apiClient<ProviderApiResponse[]>(
          `/api/providers/filter?query=${encodeURIComponent(q)}&country=${region}`
        );
        setSearchResults((data ?? []).map(mapProvider));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, region]);

  const addProvider = (provider: StreamingProviderDto) => {
    if (!provider.providerId) return;
    setSelected((prev) =>
      prev.some((s) => s.providerId === provider.providerId)
        ? prev
        : [
            ...prev,
            {
              userId,
              providerId: provider.providerId!,
              providerName: provider.providerName,
              priority: prev.length + 1,
              logoPath: provider.logoPath,
            },
          ]
    );
    setSearchInput("");
    setSearchResults([]);
  };

  const removeProvider = (id: number) => {
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

  const availableResults = searchResults.filter(
    (p) => !selected.some((s) => s.providerId === p.providerId)
  );

  const save = async () => {
    setSaving(true);
    try {
      const body = selected.map((s, i) => ({ ...s, priority: i + 1 }));
      await apiClient(`/api/providers/user/${userId}/update-subscriptions`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      baselineRef.current = JSON.stringify(body);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search providers"
          className="input-base pl-10"
        />
      </div>

      {(searching || availableResults.length > 0) && (
        <div className="card border-border divide-y divide-border overflow-hidden">
          {searching ? (
            <p className="text-xs text-muted-foreground px-3 py-3">Searching…</p>
          ) : (
            availableResults.map((provider) => (
              <button
                key={provider.providerId}
                onClick={() => addProvider(provider)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-4 w-4 text-primary shrink-0" />
                {provider.logoPath ? (
                  <img
                    src={provider.logoPath}
                    alt={provider.providerName}
                    className="h-8 w-8 object-contain rounded shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted shrink-0" />
                )}
                <span className="text-sm font-medium">{provider.providerName}</span>
              </button>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Streaming data provided by JustWatch
      </p>

      {/* Subscriptions list */}
      <div>
        <p className="text-sm font-semibold mb-2">
          Your subscriptions (drag to reorder)
        </p>
        {!loaded ? (
          <div className="h-12 rounded-xl bg-muted animate-pulse" />
        ) : selected.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-4 rounded-xl bg-card border border-border">
            No subscriptions added yet. Search for your streaming services above.
          </p>
        ) : (
          <div className="space-y-1">
            {selected.map((sub, idx) => {
              const logo = providerLogoUrl(sub.logoPath);
              return (
                <div
                  key={sub.providerId}
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
                  {logo ? (
                    <img
                      src={logo}
                      alt={sub.providerName}
                      className="h-8 w-8 object-contain rounded shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted shrink-0" />
                  )}
                  <span className="flex-1 font-medium">{sub.providerName}</span>
                  <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                  <button
                    onClick={() => removeProvider(sub.providerId)}
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted shrink-0"
                    aria-label={`Remove ${sub.providerName}`}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground px-1">
              Drag to reorder. Top = highest priority
            </p>
          </div>
        )}
      </div>

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
