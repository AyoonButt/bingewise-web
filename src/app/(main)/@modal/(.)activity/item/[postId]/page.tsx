"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { SingleItemContent } from "@/components/feed/SingleItemContent";
import { registerModalOpen, closeAllModals } from "@/lib/modal-stack";

export default function SingleItemModal() {
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
          <div className="relative w-full max-w-3xl h-full overflow-y-auto bg-background md:rounded-2xl md:my-8 animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-background/90 backdrop-blur">
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
            <SingleItemContent />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
