import type { Metadata } from "next";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
