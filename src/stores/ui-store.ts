import { create } from "zustand";

interface UiState {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  /** Global "sign up to continue" prompt for guest-mode action gating. */
  isSignupPromptOpen: boolean;
  /**
   * Incremented when the user taps the nav icon of the page they're already on
   * (feed/explore). Pages subscribe and treat it as a "refresh content" signal.
   */
  contentRefreshSignal: number;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openSignupPrompt: () => void;
  closeSignupPrompt: () => void;
  triggerContentRefresh: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDarkMode: true,
  isSidebarOpen: false,
  isSignupPromptOpen: false,
  contentRefreshSignal: 0,
  toggleDarkMode: () =>
    set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openSignupPrompt: () => set({ isSignupPromptOpen: true }),
  closeSignupPrompt: () => set({ isSignupPromptOpen: false }),
  triggerContentRefresh: () =>
    set((state) => ({ contentRefreshSignal: state.contentRefreshSignal + 1 })),
}));
