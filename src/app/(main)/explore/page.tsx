"use client";

import { TrailerFeed } from "@/components/explore/TrailerFeed";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div className="hidden md:flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Explore</h2>
      </div>
      <TrailerFeed />
    </div>
  );
}
