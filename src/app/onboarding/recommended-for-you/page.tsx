"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOnboardingPosts } from "@/lib/onboarding-preview";
import { submitOnboarding } from "@/lib/onboarding-submit";
import { tmdbImage } from "@/lib/tmdb";
import { isOnboardingAccountGateEnabled } from "@/lib/session";
import type { PostDto } from "@/types/post";
import { analytics } from "@/lib/analytics";

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values));
}

function preservedQuery(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  for (const key of ["prompt", "fresh"]) params.delete(key);
  return params.toString();
}

export default function RecommendedForYouPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);
  const openSignupPrompt = useUiStore((s) => s.openSignupPrompt);
  const store = useOnboardingStore();
  const [items, setItems] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [forcePrompt, setForcePrompt] = useState(false);
  const gateEnabled = isOnboardingAccountGateEnabled();

  const loadPreview = useCallback(async () => {
    // authStatus starts as "restoring"; a signed-in user must not fall back to
    // the guest preview endpoint before the session finishes restoring.
    if (useAuthStore.getState().authStatus === "restoring") return;
    setLoading(true);
    setError(null);
    try {
      const state = useOnboardingStore.getState();
      const posts = await fetchOnboardingPosts({
        userId: user?.userId,
        language: state.language,
        region: state.region,
        genres: uniqueNumbers([...state.preferredGenres, ...state.vibeLikedGenres]),
        providers:
          state.orderedSelectedProviders.length > 0
            ? state.orderedSelectedProviders
            : state.selectedProviders,
        // Only explicit genre-step avoids are hard exclusions. Vibe rejects
        // stay soft so the backend can demote them instead of hiding them.
        avoidGenres: uniqueNumbers(state.avoidedGenres),
        softAvoidGenreIds: state.vibeSoftAvoidedGenres,
        excludedTmdbIds: state.vibeExcludedTmdbIds,
        contentLanguagePreference: state.contentLanguagePreference,
        limit: 6,
      });
      setItems(posts.slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (authStatus === "restoring") return;
    void loadPreview();
  }, [authStatus, loadPreview, reloadKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setForcePrompt(window.location.search.includes("prompt=1"));
  }, []);

  useEffect(() => {
    if (forcePrompt && authStatus === "guest") {
      openSignupPrompt({ required: gateEnabled, destination: "/feed" });
    }
  }, [authStatus, forcePrompt, gateEnabled, openSignupPrompt]);

  const finish = async () => {
    store.markStepCompleted("recommended-for-you");
    const query = preservedQuery();
    const feedHref = query ? `/feed?${query}` : "/feed";

    // With the required gate on, guests must create an account (or sign in)
    // before finishing; account creation promotes the saved progress.
    // With the soft gate, they can keep their local progress and resume later.
    if (!user?.userId) {
      analytics.logSetupCompleted();
      if (gateEnabled) {
        openSignupPrompt({ required: true, destination: "/feed" });
        return;
      }
      analytics.logOnboardingExited("recommended-for-you", feedHref);
      router.push(feedHref);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await submitOnboarding();
      analytics.logSetupCompleted();
      store.clear();
      setSaved(true);
      router.push(feedHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">You&apos;re all set!</h2>
          <p className="text-sm text-muted-foreground">
            Your preferences are saved. Your feed is ready.
          </p>
        </div>
        <button
          onClick={() => router.push("/feed")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Start Exploring
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Recommended For You</h2>
        <p className="text-sm text-muted-foreground">
          A first look at the feed we&apos;re building from your picks.
        </p>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your preview
          </p>
        </div>
        {loading && (
          <div
            className="grid grid-cols-3 gap-2"
            role="status"
            aria-label="Loading your recommendations"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-1">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => setReloadKey((key) => key + 1)}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted/50"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No preview available yet. Your feed will fill in as you use BingeWise.
          </p>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <div key={item.postId ?? item.tmdbId} className="space-y-1">
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                  {item.posterPath ? (
                    <Image
                      src={tmdbImage(item.posterPath, "w342")}
                      alt={item.title}
                      width={200}
                      height={300}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 640px) 33vw, 160px"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <p className="line-clamp-2 text-xs font-medium leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number.isFinite(item.voteAverage) ? item.voteAverage.toFixed(1) : "N/A"} / 10
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {user?.userId ? (
        <div className="card flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Private profile</p>
            <p className="text-xs text-muted-foreground">
              Hide your watchlists and activity from other users.
            </p>
          </div>
          <button
            onClick={() => store.setPrivateAccount(!store.isPrivateAccount)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              store.isPrivateAccount ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                store.isPrivateAccount ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      ) : (
        <div className="card space-y-3 border-primary/30 bg-primary/5 p-5 text-center">
          <p className="text-sm font-semibold">Save this taste profile</p>
          <p className="text-xs text-muted-foreground">
            Create a free account or sign in to keep your vibe picks, genres, and watchlists.
          </p>
          <button
            type="button"
            onClick={() =>
              openSignupPrompt({ required: gateEnabled, destination: "/feed" })
            }
            className="btn-primary w-full h-10 flex items-center justify-center"
          >
            Create account or sign in
          </button>
        </div>
      )}

      <button
        onClick={finish}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        ) : (
          <>Finish Setup <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
    </div>
  );
}
