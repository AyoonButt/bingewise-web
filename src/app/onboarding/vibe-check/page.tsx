"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Heart, X, Loader2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { GENRES, useOnboardingStore } from "@/stores/onboarding-store";
import {
  fetchGuestVibeSlate,
  fetchOnboardingPosts,
  parseGenreIds,
} from "@/lib/onboarding-preview";
import type { PostDto } from "@/types/post";
import { analytics } from "@/lib/analytics";

function genreLabel(id: number): string {
  return GENRES.find((g) => g.id === id)?.name ?? String(id);
}

export default function VibeCheckPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.userId);
  const progress = useOnboardingStore((s) => s.vibeDeckProgress);
  const language = useOnboardingStore((s) => s.language);
  const region = useOnboardingStore((s) => s.region);
  const preferredGenres = useOnboardingStore((s) => s.preferredGenres);
  const selectedProviders = useOnboardingStore((s) => s.selectedProviders);
  const contentRating = useOnboardingStore((s) => s.contentRating);
  const contentLanguagePreference = useOnboardingStore((s) => s.contentLanguagePreference);
  const [pool, setPool] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const state = useOnboardingStore.getState();
      const posts = userId
        ? await fetchOnboardingPosts({
            userId,
            language,
            region,
            genres: preferredGenres,
            providers: selectedProviders,
            contentLanguagePreference,
            limit: 25,
          })
        : await fetchGuestVibeSlate();
      const filtered = contentRating < 99
        ? posts.filter((post) => {
            const rating = Number(post.contentRating);
            return !Number.isFinite(rating) || rating <= contentRating;
          })
        : posts;
      setPool(filtered);
      if (!state.vibeDeckProgress?.deck.length && filtered.length > 0) {
        state.setVibeDeckProgress({
          deck: filtered.slice(0, 6).map((post) => post.tmdbId),
          cursor: 0,
          decisions: {},
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vibeCheck");
    } finally {
      setLoading(false);
    }
  }, [contentLanguagePreference, contentRating, language, preferredGenres, region, selectedProviders, userId]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const current = useMemo(() => {
    if (!progress) return null;
    const tmdbId = progress.deck[progress.cursor];
    return pool.find((post) => post.tmdbId === tmdbId) ?? null;
  }, [pool, progress]);

  const decisions = progress?.decisions ?? {};
  const likedCount = Object.values(decisions).filter(
    (decision) => decision === "liked"
  ).length;
  const cursor = Math.min(progress?.cursor ?? 0, progress?.deck.length ?? 0);
  const deckSize = progress?.deck.length ?? 6;

  const decide = (decision: "liked" | "soft-avoid") => {
    if (!current || !progress) return;
    const state = useOnboardingStore.getState();
    analytics.logVibeCardDecision(decision);
    state.recordVibeDecision(
      current.tmdbId,
      decision,
      parseGenreIds(current.genreIds)
    );

    const next = useOnboardingStore.getState().vibeDeckProgress;
    if (!next || next.cursor < next.deck.length) return;

    const nextLikedCount = Object.values(next.decisions).filter(
      (value) => value === "liked"
    ).length;
    const extra = pool
      .filter((post) => !next.deck.includes(post.tmdbId))
      .slice(0, 2);

    if (nextLikedCount < 2 && next.deck.length < 8 && extra.length > 0) {
      state.setVibeDeckProgress({
        ...next,
        deck: [...next.deck, ...extra.map((post) => post.tmdbId)],
      });
      return;
    }

    state.markStepCompleted("vibe-check");
    router.push("/onboarding/taste-calibration");
  };

  const skip = () => {
    const state = useOnboardingStore.getState();
    state.markStepCompleted("vibe-check");
    state.markStepCompleted("taste-calibration");
    router.push("/onboarding/recommended-for-you?prompt=1");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Vibe Check</h2>
        <p className="text-sm text-muted-foreground">
          Pick what you&apos;d watch. Two extras appear if your taste is still unclear.
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => setReloadKey((key) => key + 1)}
            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted/50"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && progress && cursor >= deckSize && (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium">Vibe locked in</p>
          <button
            onClick={() => router.push("/onboarding/taste-calibration")}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Continue
          </button>
        </div>
      )}

      {!loading && !error && progress && cursor < deckSize && !current && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This title is no longer available. Refresh your deck to continue.
          </p>
          <button
            onClick={() => {
              const state = useOnboardingStore.getState();
              state.setVibeDeckProgress(null);
              setReloadKey((key) => key + 1);
            }}
            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted/50"
          >
            Refresh deck
          </button>
        </div>
      )}

      {!loading && !error && current && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="relative aspect-[16/10] bg-muted">
              {current.posterPath && (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${current.posterPath}`}
                  alt={current.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <p className="text-base font-semibold text-white">{current.title}</p>
                {current.releaseDate && (
                  <p className="text-xs text-white/70">
                    {current.releaseDate.slice(0, 4)}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap gap-1.5">
                {parseGenreIds(current.genreIds)
                  .slice(0, 4)
                  .map((id) => (
                    <span
                      key={id}
                      className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                    >
                      {genreLabel(id)}
                    </span>
                  ))}
              </div>
              <p className="line-clamp-3 text-xs text-muted-foreground">
                {current.overview || "No synopsis available."}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => decide("soft-avoid")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
              Not for me
            </button>
            <button
              onClick={() => decide("liked")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Heart className="h-4 w-4" />
              I&apos;d watch
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button onClick={skip} className="hover:text-foreground">
              Skip vibe check
            </button>
            <span>
              {cursor + 1} / {deckSize} · {likedCount} liked
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => router.push("/onboarding/stay-connected")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
    </div>
  );
}
