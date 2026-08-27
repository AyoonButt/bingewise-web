import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your BingeWise account settings, preferences, and appearance.",
  openGraph: {
    title: "Settings",
    description:
      "Manage your BingeWise account settings, preferences, and appearance.",
    siteName: "BingeWise",
    type: "website",
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
