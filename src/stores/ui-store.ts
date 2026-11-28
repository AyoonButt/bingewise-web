import { create } from "zustand";

interface UiState {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  /** Global "sign up to continue" prompt for guest-mode action gating. */
  isSignupPromptOpen: boolean;
  /** True when leaving the prompt is not allowed (e.g. onboarding exit/finish). */
  isSignupPromptRequired: boolean;
  /** Where to send the user after a successful sign-up/sign-in. */
  signupPromptDestination: string;
  /**
   * Incremented when the user taps the nav icon of the page they're already on
   * (feed/explore). Pages subscribe and treat it as a "refresh content" signal.
   */
  contentRefreshSignal: number;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openSignupPrompt: (options?: {
    required?: boolean;
    destination?: string;
  }) => void;
  closeSignupPrompt: () => void;
  triggerContentRefresh: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDarkMode: true,
  isSidebarOpen: false,
  isSignupPromptOpen: false,
  isSignupPromptRequired: false,
  signupPromptDestination: "",
  contentRefreshSignal: 0,
  toggleDarkMode: () =>
    set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openSignupPrompt: (options) =>
    set({
      isSignupPromptOpen: true,
      isSignupPromptRequired: options?.required ?? false,
      signupPromptDestination: options?.destination ?? "",
    }),
  closeSignupPrompt: () =>
    set({
      isSignupPromptOpen: false,
      isSignupPromptRequired: false,
      signupPromptDestination: "",
    }),
  triggerContentRefresh: () =>
    set((state) => ({ contentRefreshSignal: state.contentRefreshSignal + 1 })),
}));
