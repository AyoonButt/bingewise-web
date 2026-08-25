import { create } from "zustand";

interface UnreadState {
  count: number;
  setCount: (count: number) => void;
  bump: () => void;
}

export const useUnreadStore = create<UnreadState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
  bump: () => set((state) => ({ count: state.count + 1 })),
}));