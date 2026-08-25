"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { SingleItemContent } from "@/components/feed/SingleItemContent";

export default function SingleItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVideo = searchParams.get("video") === "1";

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold tracking-tight brand-gradient-text flex-1 truncate">
            {isVideo ? "Trailer" : "Post"}
          </h2>
        </div>

        <SingleItemContent />
      </div>
    </Suspense>
  );
}
