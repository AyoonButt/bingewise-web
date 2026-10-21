"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { text: "text-sm", box: "h-7 w-7" },
  md: { text: "text-xl", box: "h-9 w-9" },
  lg: { text: "text-3xl", box: "h-14 w-14" },
};

// "Binge" in blue, "Wise" in orange — matches the mobile app wordmark.
// Colors are theme-aware: vibrant for light mode, softer for dark mode.
const wordmark = {
  binge: "text-[#0D47A1] dark:text-[#64B5F6]",
  wise: "text-[#FF6D00] dark:text-[#FFB74D]",
};

export function BingeWiseWordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className={wordmark.binge}>Binge</span>
      <span className={wordmark.wise}>Wise</span>
    </span>
  );
}

export function BrandLogo({ size = "md", showText = true, className }: BrandLogoProps) {
  const s = sizes[size];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder that matches the final layout to avoid hydration mismatch
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className={`relative ${s.box}`}>
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
            <span className="text-2xl font-bold text-primary">B</span>
          </div>
        </div>
        {showText && (
          <span className={`${s.text} font-bold tracking-tight`}>
            <BingeWiseWordmark />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${s.box}`}>
        {/* Single app-icon logo used for both light and dark themes */}
        <Image
          src="/images/bingewise_appicon.png"
          alt="BingeWise"
          fill
          className="object-contain"
        />
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight`}>
          <BingeWiseWordmark />
        </span>
      )}
    </div>
  );
}
