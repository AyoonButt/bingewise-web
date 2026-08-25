import { create } from "zustand";

export interface PushToast {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceId: number;
  senderName: string;
}

interface PushToastState {
  toasts: PushToast[];
  push: (toast: Omit<PushToast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const usePushToastStore = create<PushToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: nextId++ }].slice(-3),
    })),
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));