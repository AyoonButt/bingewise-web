"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BingeWiseWordmark } from "@/components/ui/brand-logo";
import Image from "next/image";

// Official attribution logo URLs (same as the mobile app's About screen)
const TMDB_LOGO_URL =
  "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg";
const JUSTWATCH_LOGO_URL =
  "https://www.justwatch.com/appassets/img/logo/JustWatch-logo-large.png";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight">About</h2>
      </div>

      {/* App identity */}
      <div className="card p-6 flex flex-col items-center text-center space-y-3">
        <Image
          src="/images/bingewise_appicon.png"
          alt="BingeWise"
          width={80}
          height={80}
          className="object-contain rounded-2xl"
        />
        <span className="text-2xl font-bold tracking-tight">
          <BingeWiseWordmark />
        </span>
        <p className="text-sm text-muted-foreground max-w-xs">
          Discover your next favorite. Curate your watchlist. Connect with fans.
        </p>
      </div>

      {/* Version info */}
      <div className="card divide-y divide-border">
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium">Version</span>
          <span className="text-sm text-muted-foreground tabular-nums">0.1.0</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium">Platform</span>
          <span className="text-sm text-muted-foreground">Web</span>
        </div>
      </div>

      {/* Legal */}
      <div className="card divide-y divide-border">
        <Link
          href="/legal/terms"
          className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors first:rounded-t-xl"
        >
          <span className="text-sm font-medium">Terms of Service</span>
          <span className="text-xs text-muted-foreground">View</span>
        </Link>
        <Link
          href="/legal/privacy"
          className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors last:rounded-b-xl"
        >
          <span className="text-sm font-medium">Privacy Policy</span>
          <span className="text-xs text-muted-foreground">View</span>
        </Link>
      </div>

      {/* Credits */}
      <div className="card p-4 flex flex-col items-center text-center space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <Image src={TMDB_LOGO_URL} alt="TMDB Logo" width={176} height={40} unoptimized className="object-contain" />
      </div>

      <div className="card p-4 flex flex-col items-center text-center space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Streaming availability data provided by JustWatch.
        </p>
        <Image src={JUSTWATCH_LOGO_URL} alt="JustWatch Logo" width={144} height={32} unoptimized className="object-contain" />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        © 2026 BingeWise. All rights reserved.
      </p>
    </div>
  );
}
