"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Sparkles } from "lucide-react";

const IOS_URL =
  "https://apps.apple.com/us/app/bingewise-movies-and-tv/id6785883525";
const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=com.bingewise.app";
const DISMISS_KEY = "bw-mobile-app-banner-dismissed";

function getPlatform(): "ios" | "android" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return null;
}

export function MobileAppBanner() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const p = getPlatform();
    if (!p) return;
    setPlatform(p);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!platform || dismissed) return null;

  const storeUrl = platform === "ios" ? IOS_URL : ANDROID_URL;
  const storeLabel = platform === "ios" ? "App Store" : "Google Play";

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:hidden">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden">
            <Image
              src="/images/bingewise_appicon.png"
              alt="BingeWise"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">
              Get the BingeWise app
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create story cards from your watchlists and share them on social
            </p>
          </div>
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem(DISMISS_KEY, "1");
            }}
            className="p-1.5 -mt-1 -mr-1 rounded-lg hover:bg-accent transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2">
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary h-10 px-4 text-sm font-semibold flex-1 flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Get on {storeLabel}
          </a>
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem(DISMISS_KEY, "1");
            }}
            className="btn-outline h-10 px-4 text-sm"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
