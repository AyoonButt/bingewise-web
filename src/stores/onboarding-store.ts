"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StreamingProviderDto } from "@/types/provider";
import { analytics } from "@/lib/analytics";
import { getLanguageName, getRegionName } from "@/lib/locales";
import {
  ONBOARDING_SCHEMA_VERSION,
  nextOnboardingRoute,
  onboardingProgressPercent,
  type VibeDeckProgress,
} from "@/lib/onboarding-progress";

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
export type ContentLanguagePreference = "ANY" | "PREFER_SELECTED" | "ONLY_SELECTED";

export const CONTENT_RATINGS: { value: ContentRating; label: string; description: string }[] = [
  { value: 0, label: "Kids", description: "Ages 0+" },
  { value: 7, label: "Family", description: "Ages 7+" },
  { value: 13, label: "Teen", description: "Ages 13+" },
  { value: 17, label: "Mature", description: "Ages 17+" },
  { value: 99, label: "All", description: "No filter" },
];

type NotificationCategoryKey =
  | "repliesEnabled"
  | "followRequestsEnabled"
  | "messagesEnabled"
  | "releasesEnabled"
  | "sequelsEnabled"
  | "generalEnabled"
  | "subscriptionsEnabled"
  | "streamingEnabled";

interface OnboardingState {
  // Resume metadata
  schemaVersion: number;
  userId: number;
  lastStep: string | null;

  // Basics
  language: string;
  region: string;
  contentLanguagePreference: ContentLanguagePreference;
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

  // Vibe / adaptive taste signal
  vibeDeckProgress: VibeDeckProgress | null;
  vibeLikedGenres: number[];
  vibeSoftAvoidedGenres: number[];
  vibeExcludedTmdbIds: number[];

  // Priority ordering
  orderedSelectedProviders: number[];
  orderedSelectedGenres: number[];
  orderedAvoidedGenres: number[];

  // Progress
  completedSteps: string[];

  // Actions
  loadForUser: (userId: number) => void;
  setUserId: (userId: number) => void;
  isOwnedBy: (userId: number) => boolean;
  getResumeRoute: () => string;
  setLanguage: (language: string) => void;
  setRegion: (region: string) => void;
  setContentLanguagePreference: (preference: ContentLanguagePreference) => void;
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
  setNotificationCategory: (key: NotificationCategoryKey, enabled: boolean) => void;
  setPrivateAccount: (isPrivate: boolean) => void;
  setVibeDeckProgress: (progress: VibeDeckProgress | null) => void;
  recordVibeDecision: (
    tmdbId: number,
    decision: "liked" | "soft-avoid",
    genreIds: number[]
  ) => void;
  markStepCompleted: (step: string) => void;
  clearTrackingOnly: () => void;
  getProgress: () => number;
  getSummary: () => Record<string, string>;
  clear: () => void;
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values));
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      schemaVersion: ONBOARDING_SCHEMA_VERSION,
      userId: 0,
      lastStep: null,

      language: "en",
      region: "US",
      contentLanguagePreference: "ANY",
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

      vibeDeckProgress: null,
      vibeLikedGenres: [],
      vibeSoftAvoidedGenres: [],
      vibeExcludedTmdbIds: [],

      orderedSelectedProviders: [],
      orderedSelectedGenres: [],
      orderedAvoidedGenres: [],

      completedSteps: [],

      loadForUser: (userId) => {
        const state = get();
        if (state.userId !== 0 && state.userId !== userId) {
          state.clear();
        }
        set({ userId });
      },

      setUserId: (userId) => set({ userId }),

      isOwnedBy: (userId) => {
        const owner = get().userId;
        return owner === 0 || owner === userId;
      },

      getResumeRoute: () =>
        nextOnboardingRoute(get().completedSteps, get().lastStep),

      setLanguage: (language) => set({ language }),
      setRegion: (region) => set({ region }),
      setContentLanguagePreference: (preference) =>
        set({ contentLanguagePreference: preference }),

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

      reorderPreferredGenres: (genres) => set({ preferredGenres: genres }),
      setPreferredGenres: (genres) => set({ preferredGenres: genres }),
      setAvoidedGenres: (genres) => set({ avoidedGenres: genres }),

      cacheGenreName: (id, name) =>
        set((state) => ({ genreNames: { ...state.genreNames, [id]: name } })),

      toggleProvider: (id) =>
        set((state) => ({
          selectedProviders: state.selectedProviders.includes(id)
            ? state.selectedProviders.filter((p) => p !== id)
            : [...state.selectedProviders, id],
        })),

      setSelectedProviders: (ids) =>
        set({ selectedProviders: uniqueNumbers(ids), orderedSelectedProviders: uniqueNumbers(ids) }),

      setSelectedProvidersDetails: (details) =>
        set({ selectedProvidersDetails: details }),

      setContentRating: (rating) => set({ contentRating: rating }),

      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),

      setNotificationCategory: (key, enabled) =>
        set({ [key]: enabled } as Partial<OnboardingState>),

      setPrivateAccount: (isPrivate) => set({ isPrivateAccount: isPrivate }),

      setVibeDeckProgress: (progress) => set({ vibeDeckProgress: progress }),

      recordVibeDecision: (tmdbId, decision, genreIds) =>
        set((state) => {
          const progress = state.vibeDeckProgress ?? {
            deck: [],
            cursor: 0,
            decisions: {},
          };
          return {
            vibeDeckProgress: {
              ...progress,
              cursor: Math.min(progress.cursor + 1, progress.deck.length),
              decisions: { ...progress.decisions, [tmdbId]: decision },
            },
            vibeLikedGenres:
              decision === "liked"
                ? uniqueNumbers([...state.vibeLikedGenres, ...genreIds])
                : state.vibeLikedGenres,
            vibeSoftAvoidedGenres:
              decision === "soft-avoid"
                ? uniqueNumbers([...state.vibeSoftAvoidedGenres, ...genreIds])
                : state.vibeSoftAvoidedGenres,
            vibeExcludedTmdbIds:
              decision === "soft-avoid"
                ? uniqueNumbers([...state.vibeExcludedTmdbIds, tmdbId])
                : state.vibeExcludedTmdbIds,
            lastStep: "vibe-check",
          };
        }),

      markStepCompleted: (step) => {
        analytics.logOnboardingStepCompleted(step);
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
          lastStep: step,
        }));
      },

      clearTrackingOnly: () =>
        set({ completedSteps: [], lastStep: null, vibeDeckProgress: null }),

      getProgress: () => onboardingProgressPercent(get().completedSteps),

      getSummary: () => {
        const state = get();
        const langName = getLanguageName(state.language);
        const regionName = getRegionName(state.region);

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
          schemaVersion: ONBOARDING_SCHEMA_VERSION,
          userId: 0,
          lastStep: null,
          language: "en",
          region: "US",
          contentLanguagePreference: "ANY",
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
          vibeDeckProgress: null,
          vibeLikedGenres: [],
          vibeSoftAvoidedGenres: [],
          vibeExcludedTmdbIds: [],
          orderedSelectedProviders: [],
          orderedSelectedGenres: [],
          orderedAvoidedGenres: [],
          completedSteps: [],
        }),
    }),
    {
      name: "bingewise-onboarding",
      version: ONBOARDING_SCHEMA_VERSION,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<OnboardingState>;
        return {
          ...state,
          schemaVersion: ONBOARDING_SCHEMA_VERSION,
          userId: state.userId ?? 0,
          lastStep: state.lastStep ?? null,
          contentLanguagePreference: state.contentLanguagePreference ?? "ANY",
          vibeDeckProgress: state.vibeDeckProgress ?? null,
          vibeLikedGenres: state.vibeLikedGenres ?? [],
          vibeSoftAvoidedGenres: state.vibeSoftAvoidedGenres ?? [],
          vibeExcludedTmdbIds: state.vibeExcludedTmdbIds ?? [],
          orderedSelectedProviders: state.orderedSelectedProviders ?? [],
          orderedSelectedGenres: state.orderedSelectedGenres ?? [],
          orderedAvoidedGenres: state.orderedAvoidedGenres ?? [],
        };
      },
    }
  )
);
