"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, Loader2, Check, Shield } from "lucide-react";

const RATINGS = [
  { value: 99, label: "Everyone", desc: "All content, no restrictions" },
  { value: 17, label: "Mature (17+)", desc: "Up to R-rated content" },
  { value: 13, label: "Teen (13+)", desc: "Up to PG-13 content" },
  { value: 7, label: "Family (7+)", desc: "Family-friendly content" },
  { value: 0, label: "Kids", desc: "Children's content only" },
];

export default function ContentRatingPage() {
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState<number>(99);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    apiClient<{ contentRatingAge?: number }>(
      `/api/users/${user.userId}/preferences`
    )
      .then((data) => {
        if (data?.contentRatingAge !== undefined && data.contentRatingAge !== null)
          setRating(data.contentRatingAge);
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
        body: JSON.stringify({ contentRatingAge: rating }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg skeleton" />
          <div className="h-6 skeleton w-40" />
        </div>
        <div className="card p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-xl" />
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
        <h2 className="text-xl font-bold tracking-tight">Content Rating</h2>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          Content rating saved
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Choose the maximum content rating you want to see in recommendations and
        search results.
      </p>

      <div className="space-y-2">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRating(r.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
              rating === r.value
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent/50"
            }`}
          >
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                rating === r.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {r.label}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
            {rating === r.value && (
              <Check className="h-5 w-5 text-primary shrink-0" />
            )}
          </button>
        ))}
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
