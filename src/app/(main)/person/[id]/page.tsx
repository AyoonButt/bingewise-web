"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { PersonDetailContent } from "@/components/person/PersonDetailContent";

export default function PersonDetailPage() {
  const router = useRouter();
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-muted-foreground">Loading…</div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => router.push("/feed")}
            className="p-2 rounded-lg hover:bg-accent transition-colors ml-auto"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <PersonDetailContent />
      </div>
    </Suspense>
  );
}
