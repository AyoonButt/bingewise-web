import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConsentState {
  adConsent: boolean | null;
  analyticsConsent: boolean | null;
  setConsent: (ad: boolean, analytics: boolean) => void;
  resetConsent: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      adConsent: null,
      analyticsConsent: null,
      setConsent: (ad, analytics) =>
        set({ adConsent: ad, analyticsConsent: analytics }),
      resetConsent: () => set({ adConsent: null, analyticsConsent: null }),
    }),
    { name: "bw-consent" }
  )
);
