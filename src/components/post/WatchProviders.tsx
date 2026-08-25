"use client";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface RegionProviders {
  link?: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

interface WatchProvidersProps {
  regionProviders?: RegionProviders;
}

function JustWatchLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 24"
      className={className}
      role="img"
      aria-label="JustWatch"
    >
      <circle cx="11" cy="12" r="6" fill="#EE0000" />
      <text
        x="24"
        y="17"
        fontSize="17"
        fontWeight={700}
        fontFamily="Arial, Helvetica, sans-serif"
        fill="currentColor"
      >
        justwatch
      </text>
    </svg>
  );
}

function ProviderRow({
  label,
  providers,
  tmdbLink,
}: {
  label: string;
  providers: Provider[];
  tmdbLink?: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm font-semibold text-muted-foreground shrink-0 min-w-[48px]">
        {label}:
      </span>
      <div className="flex gap-2">
        {providers.map((p) => (
          <a
            key={p.provider_id}
            href={tmdbLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={p.provider_name}
            className="w-9 h-9 rounded-lg overflow-hidden bg-muted border border-border hover:border-primary/50 transition-colors shrink-0"
          >
            <img
              src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
              alt={p.provider_name}
              className="w-full h-full object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export function WatchProviders({ regionProviders }: WatchProvidersProps) {
  if (!regionProviders) return null;

  const hasAny =
    (regionProviders.flatrate && regionProviders.flatrate.length > 0) ||
    (regionProviders.rent && regionProviders.rent.length > 0) ||
    (regionProviders.buy && regionProviders.buy.length > 0);

  if (!hasAny) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      {regionProviders.flatrate && regionProviders.flatrate.length > 0 && (
        <ProviderRow
          label="Stream"
          providers={regionProviders.flatrate}
          tmdbLink={regionProviders.link}
        />
      )}
      {regionProviders.rent && regionProviders.rent.length > 0 && (
        <ProviderRow
          label="Rent"
          providers={regionProviders.rent}
          tmdbLink={regionProviders.link}
        />
      )}
      {regionProviders.buy && regionProviders.buy.length > 0 && (
        <ProviderRow
          label="Buy"
          providers={regionProviders.buy}
          tmdbLink={regionProviders.link}
        />
      )}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={regionProviders.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/70 hover:text-muted-foreground transition-colors shrink-0"
          aria-label="JustWatch"
        >
          <JustWatchLogo className="h-4 w-auto" />
        </a>
        <span className="text-xs text-muted-foreground/60">
          Data provided by JustWatch
        </span>
      </div>
    </div>
  );
}
