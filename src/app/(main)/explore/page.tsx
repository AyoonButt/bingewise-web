"use client";

import { TrailerFeed } from "@/components/explore/TrailerFeed";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <section
      aria-label="Trending movies and TV shows"
      className="-mt-6 lg:mt-0 lg:space-y-6"
    >
      <header className="hidden md:flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Explore</h1>
      </header>

      <div className="hidden md:block space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Browse trending trailers, new TV releases, and fan favorites. Swipe
          the full-screen feed, like titles to train the algorithm, or save
          them straight to your watchlist.
        </p>
        <p className="text-xs text-muted-foreground">
          Picks are ranked by community engagement and sharpen as you interact.
        </p>
      </div>

      <TrailerFeed />
    </section>
  );
}
