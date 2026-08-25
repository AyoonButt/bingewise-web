"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { PosterDetailContent } from "@/components/post/PosterDetailContent";
import { registerModalOpen, closeAllModals } from "@/lib/modal-stack";

/**
 * Intercepting route: when navigated to `/post/[id]` from within the app (e.g.
 * from the explore reel or a feed), this renders the poster detail as a modal
 * overlaying the current screen instead of replacing it. The underlying list
 * stays mounted, so closing (router.back) returns to the exact same position
 * — including the playing trailer in the explore feed.
 */
export default function PosterDetailModal() {
  const router = useRouter();
  useEffect(() => registerModalOpen(), []);
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
          <div className="w-full max-w-3xl h-full max-h-[90vh] bg-background rounded-2xl animate-pulse" />
        </div>
      }
    >
      <div className="fixed inset-0 z-40">
        <div
          className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
          onClick={() => router.back()}
        />
        <div className="absolute inset-x-0 bottom-0 top-16 md:inset-0 flex justify-center">
          <div className="relative w-full max-w-5xl h-full overflow-y-auto bg-background md:rounded-2xl md:my-6 md:max-h-[92vh] animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-background/90 backdrop-blur border-b border-border">
              <button
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => closeAllModals()}
                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 pb-10 pt-6">
              <PosterDetailContent />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
