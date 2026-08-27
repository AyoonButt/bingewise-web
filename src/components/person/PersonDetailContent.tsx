"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { tmdbImage, getPersonDetail } from "@/lib/tmdb";
import { getLanguageRegion } from "@/lib/locale";
import { decodeHtmlEntities } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useViewDurationTracker } from "@/hooks/use-view-duration-tracker";
import { Loader2 } from "lucide-react";
import type { TmdbPersonCredit, TmdbPersonDetail } from "@/types/tmdb";

/**
 * Shared person-detail body used by both the full page (`/person/[id]`) and the
 * intercepting modal (`@modal/(.)person/[id]`). Owns its own data loading.
 */
export function PersonDetailContent() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const languageRegion = getLanguageRegion(user);
  const id = Number(params.id);

  // Track viewing duration for person detail screen (matches Android InfoDto / POST /api/info/save)
  useViewDurationTracker(id, "person");

  const [person, setPerson] = useState<TmdbPersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPersonDetail(id, languageRegion);
        setPerson(data);
      } catch {
        setError("Failed to load person");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, languageRegion]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-6 items-start">
          <div className="w-32 h-44 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-7 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">{error || "Person not found"}</p>
        <button onClick={() => router.back()} className="btn-primary inline-flex">
          Go Back
        </button>
      </div>
    );
  }

  const name = decodeHtmlEntities(person.name);
  const biography = decodeHtmlEntities(person.biography || "");
  const credits = person.combined_credits?.cast ?? [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
        <div className="relative w-36 sm:w-44 h-52 sm:h-60 rounded-xl overflow-hidden bg-muted border border-border shrink-0 shadow-sm">
          {person.profile_path && (
            <Image
              src={tmdbImage(person.profile_path, "w342")}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 144px, 176px"
              priority
            />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-3 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{name}</h1>
          <p className="text-sm font-medium text-primary">
            {person.known_for_department}
          </p>
          {person.birthday && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Born:</span>{" "}
              {person.birthday}
            </p>
          )}
          {person.place_of_birth && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">From:</span>{" "}
              {person.place_of_birth}
            </p>
          )}
        </div>
      </div>

      {biography && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Biography</h2>
          <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-prose">
            {biography}
          </p>
        </div>
      )}

      {credits.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Known For</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {credits.slice(0, 12).map((credit: TmdbPersonCredit) => {
              const title = credit.title ?? credit.name ?? "Untitled";
              return (
                <button
                  key={`${credit.media_type}-${credit.id}`}
                  onClick={() =>
                    router.push(
                      `/post/${credit.id}?type=${credit.media_type}`
                    )
                  }
                  className="text-left space-y-1.5 group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted border border-border shadow-sm group-hover:border-primary/40 transition-colors">
                    {credit.poster_path && (
                      <Image
                        src={tmdbImage(credit.poster_path, "w342")}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 33vw, 180px"
                      />
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{title}</p>
                  {credit.character && (
                    <p className="text-xs text-muted-foreground truncate">
                      {credit.character}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
