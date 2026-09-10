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
          Scroll through trending movie trailers, new TV show releases, and
          fan-picked recommendations. Swipe through the full-screen feed to
          discover titles worth watching — tap &quot;like&quot; to let the algorithm
          learn your taste, or save a title straight to your watchlist.
        </p>
        <p className="text-xs text-muted-foreground">
          Titles are ranked by community engagement and personalized to your
          viewing preferences. The more you interact, the better the picks
          become.
        </p>
      </div>

      <TrailerFeed />
    </section>
  );
}
