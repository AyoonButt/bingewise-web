"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Film } from "lucide-react";
import { tmdbImage } from "@/lib/tmdb";

interface PosterTileProps {
  href: string;
  title: string;
  subtitle?: string;
  posterPath?: string | null;
  sizes?: string;
}

/**
 * Search/trending poster card. Falls back to a title-initial placeholder if
 * the image fails to load (offline, TMDB hiccup, dead path).
 */
export function PosterTile({
  href,
  title,
  subtitle,
  posterPath,
  sizes = "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw",
}: PosterTileProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!posterPath && !imgFailed;

  return (
    <Link href={href} className="group">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-muted">
        {showImage ? (
          <Image
            src={tmdbImage(posterPath, "w342")}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes={sizes}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-2 text-center">
            <Film className="h-8 w-8 opacity-50" />
            <span className="text-xs font-medium line-clamp-3">{title}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm font-medium truncate">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </Link>
  );
}
