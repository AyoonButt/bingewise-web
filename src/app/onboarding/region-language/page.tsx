"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  FULL_LANGUAGES,
  FULL_REGIONS,
  getLanguageName,
  getRegionName,
} from "@/lib/locales";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useOnboardingStore, type ContentLanguagePreference } from "@/stores/onboarding-store";

const CONTENT_LANGUAGE_OPTIONS: {
  value: ContentLanguagePreference;
  label: string;
  description: (languageName: string) => string;
}[] = [
  {
    value: "ANY",
    label: "Any language",
    description: () => "No language preference. All original languages can be recommended.",
  },
  {
    value: "PREFER_SELECTED",
    label: "Mostly my language",
    description: (languageName) =>
      `We’ll prioritize titles originally made in ${languageName}, but still include other languages.`,
  },
  {
    value: "ONLY_SELECTED",
    label: "Only my language",
    description: (languageName) =>
      `Only titles originally made in ${languageName} will be shown. Titles in other languages are hidden even if subtitles or dubs are available.`,
  },
];

export default function RegionLanguagePage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [language, setLanguage] = useState(() => {
    const code = store.language.split(/[-_]/)[0] || "en";
    return getLanguageName(code) === code ? "en" : code;
  });
  const [region, setRegion] = useState(() =>
    getRegionName(store.region) === store.region ? "US" : store.region
  );
  const [contentLanguagePreference, setContentLanguagePreference] =
    useState<ContentLanguagePreference>(store.contentLanguagePreference);

  const languageName = getLanguageName(language);

  const handleContinue = () => {
    store.setLanguage(language || "en");
    store.setRegion(region || "US");
    store.setContentLanguagePreference(contentLanguagePreference);
    store.markStepCompleted("region-language");
    router.push("/onboarding/ratings");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Where are you watching from?</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ll use this to find the right releases and streaming services.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="text-sm font-semibold">Language</label>
          <SearchableSelect
            className="mt-1"
            value={language}
            onChange={setLanguage}
            placeholder="Search languages..."
            searchPlaceholder="Search languages..."
            options={FULL_LANGUAGES.map((l) => ({
              value: l.code,
              label: l.name,
              keywords: l.name,
            }))}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Country/Region</label>
          <SearchableSelect
            className="mt-1"
            value={region}
            onChange={setRegion}
            placeholder="Search countries/regions..."
            searchPlaceholder="Search countries/regions..."
            options={FULL_REGIONS.map((r) => ({
              value: r.code,
              label: r.name,
              keywords: r.name,
            }))}
          />
        </div>

        <div className="space-y-2.5">
          <div>
            <p className="text-sm font-semibold">Original language content</p>
            <p className="text-xs text-muted-foreground">
              Choose how strongly we prioritize titles originally made in your language.
            </p>
          </div>
          {CONTENT_LANGUAGE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/40 transition-colors"
            >
              <input
                type="radio"
                name="content-language-preference"
                value={option.value}
                checked={contentLanguagePreference === option.value}
                onChange={() => setContentLanguagePreference(option.value)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description(languageName)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
