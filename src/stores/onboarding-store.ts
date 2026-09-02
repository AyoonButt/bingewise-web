"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StreamingProviderDto } from "@/types/provider";

// Available languages
export const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Spanish" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "it-IT", name: "Italian" },
  { code: "pt-BR", name: "Portuguese" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ru-RU", name: "Russian" },
  { code: "ar-SA", name: "Arabic" },
  { code: "hi-IN", name: "Hindi" },
];

// Available regions (ISO 3166-1 alpha-2)
export const REGIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "NZ", name: "New Zealand" },
];

// Popular streaming providers (fallback)
export const POPULAR_PROVIDERS = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime Video" },
  { id: 337, name: "Disney+" },
  { id: 384, name: "HBO Max" },
  { id: 15, name: "Hulu" },
  { id: 350, name: "Apple TV+" },
  { id: 386, name: "Peacock" },
  { id: 531, name: "Paramount+" },
];

// Movie genres (TMDB IDs)
export const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export type ContentRating = 0 | 7 | 13 | 17 | 99;

export const CONTENT_RATINGS: { value: ContentRating; label: string; description: string }[] = [
  { value: 0, label: "Kids", description: "Ages 0+" },
  { value: 7, label: "Family", description: "Ages 7+" },
  { value: 13, label: "Teen", description: "Ages 13+" },
  { value: 17, label: "Mature", description: "Ages 17+" },
  { value: 99, label: "All", description: "No filter" },
];

interface OnboardingState {
  // Basics
  language: string;
  region: string;
  minMovieDuration: number;
  maxMovieDuration: number;
  minTvDuration: number;
  maxTvDuration: number;
  oldestDate: string;
  recentDate: string;

  // Genres
  preferredGenres: number[];
  avoidedGenres: number[];
  // Names for genres added via search that aren't in the local GENRES list
  genreNames: Record<number, string>;

  // Streaming
  selectedProviders: number[];
  selectedProvidersDetails: StreamingProviderDto[];

  // Content rating
  contentRating: ContentRating;

  // Notifications
  notificationsEnabled: boolean;
  repliesEnabled: boolean;
  followRequestsEnabled: boolean;
  messagesEnabled: boolean;
  releasesEnabled: boolean;
  sequelsEnabled: boolean;
  generalEnabled: boolean;
  subscriptionsEnabled: boolean;
  streamingEnabled: boolean;

  // Privacy
  isPrivateAccount: boolean;

  // Progress
  completedSteps: string[];

  // Actions
  setLanguage: (language: string) => void;
  setRegion: (region: string) => void;
  setMovieDuration: (min: number, max: number) => void;
  setTvDuration: (min: number, max: number) => void;
  setDateRange: (oldest: string, recent: string) => void;
  togglePreferredGenre: (id: number) => void;
  toggleAvoidedGenre: (id: number) => void;
  reorderPreferredGenres: (genres: number[]) => void;
  setPreferredGenres: (genres: number[]) => void;
  setAvoidedGenres: (genres: number[]) => void;
  cacheGenreName: (id: number, name: string) => void;
  toggleProvider: (id: number) => void;
  setSelectedProviders: (ids: number[]) => void;
  setSelectedProvidersDetails: (details: StreamingProviderDto[]) => void;
  setContentRating: (rating: ContentRating) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationCategory: (key: keyof Omit<OnboardingState, 'notificationsEnabled' | 'language' | 'region' | 'minMovieDuration' | 'maxMovieDuration' | 'minTvDuration' | 'maxTvDuration' | 'oldestDate' | 'recentDate' | 'preferredGenres' | 'avoidedGenres' | 'selectedProviders' | 'contentRating' | 'isPrivateAccount' | 'completedSteps'>, enabled: boolean) => void;
  setPrivateAccount: (isPrivate: boolean) => void;
  markStepCompleted: (step: string) => void;
  getProgress: () => number;
  getSummary: () => Record<string, string>;
  clear: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      language: "en-US",
      region: "US",
      minMovieDuration: 0,
      maxMovieDuration: 300,
      minTvDuration: 0,
      maxTvDuration: 90,
      oldestDate: "",
      recentDate: "",
      preferredGenres: [],
      avoidedGenres: [],
      genreNames: {},
      selectedProviders: [],
      selectedProvidersDetails: [],
      contentRating: 99,
      notificationsEnabled: true,
      repliesEnabled: true,
      followRequestsEnabled: true,
      messagesEnabled: true,
      releasesEnabled: true,
      sequelsEnabled: true,
      generalEnabled: true,
      subscriptionsEnabled: true,
      streamingEnabled: true,
      isPrivateAccount: false,
      completedSteps: [],

      setLanguage: (language) => set({ language }),
      setRegion: (region) => set({ region }),

      setMovieDuration: (min, max) =>
        set({ minMovieDuration: min, maxMovieDuration: max }),

      setTvDuration: (min, max) =>
        set({ minTvDuration: min, maxTvDuration: max }),

      setDateRange: (oldest, recent) =>
        set({ oldestDate: oldest, recentDate: recent }),

      togglePreferredGenre: (id) =>
        set((state) => ({
          preferredGenres: state.preferredGenres.includes(id)
            ? state.preferredGenres.filter((g) => g !== id)
            : [...state.preferredGenres, id],
          avoidedGenres: state.avoidedGenres.filter((g) => g !== id),
        })),

      toggleAvoidedGenre: (id) =>
        set((state) => ({
          avoidedGenres: state.avoidedGenres.includes(id)
            ? state.avoidedGenres.filter((g) => g !== id)
            : [...state.avoidedGenres, id],
          preferredGenres: state.preferredGenres.filter((g) => g !== id),
        })),

      reorderPreferredGenres: (genres: number[]) => set({ preferredGenres: genres }),

      setPreferredGenres: (genres: number[]) => set({ preferredGenres: genres }),
      setAvoidedGenres: (genres: number[]) => set({ avoidedGenres: genres }),

      cacheGenreName: (id, name) =>
        set((state) => ({ genreNames: { ...state.genreNames, [id]: name } })),

      toggleProvider: (id) =>
        set((state) => ({
          selectedProviders: state.selectedProviders.includes(id)
            ? state.selectedProviders.filter((p) => p !== id)
            : [...state.selectedProviders, id],
        })),

      setSelectedProviders: (ids: number[]) => set({ selectedProviders: ids }),

      setSelectedProvidersDetails: (details: StreamingProviderDto[]) =>
        set({ selectedProvidersDetails: details }),

      setContentRating: (rating) => set({ contentRating: rating }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setNotificationCategory: (key, enabled) => set({ [key]: enabled } as Partial<OnboardingState>),

      setPrivateAccount: (isPrivate) => set({ isPrivateAccount: isPrivate }),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      getProgress: () => {
        const { completedSteps } = get();
        return (completedSteps.length / 7) * 100;
      },

      getSummary: () => {
        const state = get();
        const langName = LANGUAGES.find((l) => l.code === state.language)?.name ?? state.language;
        const regionName = REGIONS.find((r) => r.code === state.region)?.name ?? state.region;

        const formatDuration = (min: number, max: number, anyMax: number) => {
          if (min === 0 && max >= anyMax) return "Any length";
          if (max >= anyMax) return `${min}+ min`;
          return `${min}–${max} min`;
        };

        const movieRange = formatDuration(state.minMovieDuration, state.maxMovieDuration, 300);
        const tvRange = formatDuration(state.minTvDuration, state.maxTvDuration, 90);

        const dateRange = (() => {
          if (!state.oldestDate && !state.recentDate) return "Any Date";
          const oldest = state.oldestDate ? state.oldestDate.slice(0, 4) : "Any";
          const recent = state.recentDate === "CURRENT" ? "Today" : state.recentDate ? state.recentDate.slice(0, 4) : "Any";
          return `${oldest} – ${recent}`;
        })();

        const preferred = state.preferredGenres
          .map((id) => GENRES.find((g) => g.id === id)?.name ?? state.genreNames[id])
          .filter(Boolean);
        const avoided = state.avoidedGenres
          .map((id) => GENRES.find((g) => g.id === id)?.name ?? state.genreNames[id])
          .filter(Boolean);

        return {
          language: langName,
          region: regionName,
          movieDuration: movieRange,
          tvDuration: tvRange,
          dateRange,
          preferredGenres: preferred.length > 0 ? preferred.join(", ") : "None",
          avoidedGenres: avoided.length > 0 ? avoided.join(", ") : "None",
          providers: state.selectedProviders.length > 0
            ? `${state.selectedProviders.length} service(s) selected`
            : "None",
          contentRating: CONTENT_RATINGS.find((r) => r.value === state.contentRating)?.label ?? "All",
          privacy: state.isPrivateAccount ? "Private" : "Public",
          notifications: state.notificationsEnabled ? "Enabled" : "Disabled",
        };
      },

      clear: () =>
        set({
          language: "en-US",
          region: "US",
          minMovieDuration: 0,
          maxMovieDuration: 300,
          minTvDuration: 0,
          maxTvDuration: 90,
          oldestDate: "",
          recentDate: "",
          preferredGenres: [],
          avoidedGenres: [],
          genreNames: {},
          selectedProviders: [],
          selectedProvidersDetails: [],
          contentRating: 99,
          notificationsEnabled: true,
          repliesEnabled: true,
          followRequestsEnabled: true,
          messagesEnabled: true,
          releasesEnabled: true,
          sequelsEnabled: true,
          generalEnabled: true,
          subscriptionsEnabled: true,
          streamingEnabled: true,
          isPrivateAccount: false,
          completedSteps: [],
        }),
    }),
    {
      name: "bingewise-onboarding",
    }
  )
);
