"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { Header } from "@/components/layout/Header";
import { AdSense } from "@/components/ads/AdSense";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { SignupPromptModal } from "@/components/auth/SignupPromptModal";
import { GuestBanner } from "@/components/guest/GuestBanner";

export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <GuestBanner />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
      <MobileSidebar />
      <AdSense />
      <ConsentBanner />
      <SignupPromptModal />
      {modal}
    </div>
  );
}
