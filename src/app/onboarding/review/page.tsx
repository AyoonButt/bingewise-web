"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, ArrowRight, Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { useOnboardingStore, LANGUAGES, REGIONS, GENRES, CONTENT_RATINGS } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";

const STEPS = [
  { label: "Basics", href: "/onboarding/basics" },
  { label: "Genres", href: "/onboarding/genres" },
  { label: "Streaming", href: "/onboarding/streaming" },
  { label: "Ratings", href: "/onboarding/ratings" },
  { label: "Alerts", href: "/onboarding/notifications" },
  { label: "Privacy", href: "/onboarding/privacy" },
];

export default function OnboardingReviewPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const user = useAuthStore((s) => s.user);
  const summary = store.getSummary();
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user?.userId) return;
    setSaving(true);
    try {
      const state = useOnboardingStore.getState();
      const body = {
        language: state.language.split("-")[0],
        region: state.region,
        minMovie: state.minMovieDuration || null,
        maxMovie: state.maxMovieDuration < 300 ? state.maxMovieDuration : null,
        minTV: state.minTvDuration || null,
        maxTV: state.maxTvDuration < 90 ? state.maxTvDuration : null,
        oldestDate: state.oldestDate || "1900-01-01",
        recentDate: state.recentDate === "CURRENT" ? new Date().toISOString().split("T")[0] : state.recentDate || "2099-12-31",
        isPrivate: state.isPrivateAccount,
        contentRatingAge: state.contentRating,
        subscriptions: state.selectedProviders,
        genres: state.preferredGenres,
        avoidGenres: state.avoidedGenres,
      };
      await apiClient(`/api/users/${user.userId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      store.clear();
      setSaved(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!user?.userId) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const state = useOnboardingStore.getState();
      const params = new URLSearchParams({
        userId: String(user.userId),
        language: state.language.split("-")[0],
        region: state.region,
        genres: state.preferredGenres.join(","),
        subscriptions: state.selectedProviders.join(","),
        limit: "6",
      });
      const res = await fetch(`/api/recommendations/preview?${params}`);
      if (!res.ok) throw new Error("Failed to load preview");
      const data = await res.json();
      console.log("[review] preview response:", JSON.stringify(data, null, 2));
      setPreviewItems(Array.isArray(data) ? data : (data.results ?? []));
      setShowPreview(true);
    } catch (err: any) {
      setPreviewError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">You&apos;re all set!</h2>
          <p className="text-sm text-muted-foreground">
            Your preferences are saved. Your feed is ready.
          </p>
        </div>
        <button
          onClick={() => router.push("/feed")}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
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
        <h2 className="text-xl font-bold tracking-tight">Review Your Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Take a moment to review before finishing.
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        {/* Basics */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basics</p>
            <button onClick={() => router.push("/onboarding/basics")} className="text-xs text-primary hover:underline flex items-center gap-0.5">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language</span>
              <span className="font-medium">{summary.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Region</span>
              <span className="font-medium">{summary.region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Movies</span>
              <span className="font-medium">{summary.movieDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TV</span>
              <span className="font-medium">{summary.tvDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Release Years</span>
              <span className="font-medium">{summary.dateRange}</span>
            </div>
          </div>
        </div>

        {/* Genres */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Genres</p>
            <button onClick={() => router.push("/onboarding/genres")} className="text-xs text-primary hover:underline flex items-center gap-0.5">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">Preferred: </span>
            <span className="font-medium">{summary.preferredGenres}</span>
          </p>
          {summary.avoidedGenres !== "None" && (
            <p className="text-sm mt-1">
              <span className="text-muted-foreground">Avoiding: </span>
              <span className="font-medium text-red-400">{summary.avoidedGenres}</span>
            </p>
          )}
        </div>

        {/* Streaming + Rating + Privacy */}
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streaming &amp; Rating</p>
            <button onClick={() => router.push("/onboarding/streaming")} className="text-xs text-primary hover:underline flex items-center gap-0.5">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Services</span>
            <span className="font-medium">{summary.providers}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Max Rating</span>
            <span className="font-medium">{summary.contentRating}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Privacy</span>
            <span className="font-medium">{summary.privacy}</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <button
        onClick={handlePreview}
        disabled={previewLoading}
        className="w-full py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors flex items-center justify-center gap-2"
      >
        {previewLoading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Loading preview…</>
        ) : (
          <><Eye className="h-4 w-4" /> Preview Recommendations</>
        )}
      </button>

      {previewError && (
        <p className="text-center text-xs text-red-400">{previewError}</p>
      )}

      {/* Preview modal */}
      {showPreview && previewItems.length > 0 && (
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Personalized Feed
          </p>
          <div className="grid grid-cols-3 gap-2">
            {previewItems.slice(0, 6).map((item: any) => (
              <div key={item.postId ?? item.tmdbId} className="space-y-1">
                <div className="aspect-[2/3] rounded-lg bg-muted overflow-hidden">
                  {item.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
                      alt={item.title}
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <p className="text-xs font-medium line-clamp-2 leading-tight">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.voteAverage?.toFixed(1) ?? "N/A"} / 10
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowPreview(false)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Close preview
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/onboarding/privacy")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <>Finish Setup <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
