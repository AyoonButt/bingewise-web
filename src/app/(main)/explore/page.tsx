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
      <TrailerFeed />
    </section>
  );
}
