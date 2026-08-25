"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { FULL_LANGUAGES, FULL_REGIONS } from "@/lib/locales";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ChevronLeft, Loader2, Check } from "lucide-react";

export default function PreferencesPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("US");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    apiClient<{ language?: string; region?: string }>(
      `/api/users/${user.userId}/preferences`
    )
      .then((prefs) => {
        if (prefs.language) setLanguage(prefs.language);
        if (prefs.region) setRegion(prefs.region);
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
        body: JSON.stringify({ language, region }),
      });
      setUser({ ...user, ...({ language, region } as Partial<typeof user>) });
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
        <div className="card p-6 space-y-4">
          <div className="h-4 skeleton w-20" />
          <div className="h-10 skeleton w-full" />
          <div className="h-4 skeleton w-20" />
          <div className="h-10 skeleton w-full" />
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
        <h2 className="text-xl font-bold tracking-tight">Language & Region</h2>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          Preferences saved
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="language" className="text-sm font-medium">
            Language
          </label>
          <SearchableSelect
            value={language}
            onChange={setLanguage}
            placeholder="Select language"
            searchPlaceholder="Search languages…"
            options={FULL_LANGUAGES.map((l) => ({
              value: l.code,
              label:
                l.nativeName !== l.name ? `${l.name} (${l.nativeName})` : l.name,
              keywords: `${l.name} ${l.nativeName ?? ""}`,
            }))}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="region" className="text-sm font-medium">
            Region
          </label>
          <SearchableSelect
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
