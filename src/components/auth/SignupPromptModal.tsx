"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Heart, Bookmark, ListPlus } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

/**
 * Global guest-conversion prompt. Opened via uiStore.openSignupPrompt() whenever a
 * signed-out visitor tries an auth-required action (like, save, comment...).
 * Mounted once in the (main) layout.
 */
export function SignupPromptModal() {
  const isOpen = useUiStore((s) => s.isSignupPromptOpen);
  const close = useUiStore((s) => s.closeSignupPrompt);
  const pathname = usePathname();

  if (!isOpen) return null;

  const from = encodeURIComponent(pathname || "/feed");

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Create a free account"
    >
      <div
        className="relative w-full max-w-sm card p-6 space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold">Join BingeWise</h2>
        <p className="text-sm text-muted-foreground">
          Create a free account to unlock the good stuff.
        </p>

        <ul className="space-y-2 text-sm text-left">
          <li className="flex items-center gap-2.5">
            <Heart className="h-4 w-4 text-primary shrink-0" />
            Like and save trailers and posts
          </li>
          <li className="flex items-center gap-2.5">
            <ListPlus className="h-4 w-4 text-primary shrink-0" />
            Build shareable watchlists with story cards
          </li>
          <li className="flex items-center gap-2.5">
            <Bookmark className="h-4 w-4 text-primary shrink-0" />
            Get recommendations that learn what you watch
          </li>
        </ul>

        <div className="space-y-2 pt-1">
          <Link
            href={`/auth/register?from=${from}`}
            className="btn-primary w-full h-10 flex items-center justify-center"
          >
            Sign up free
          </Link>
          <Link
            href={`/auth/login?from=${from}`}
            className="btn-outline w-full h-10 flex items-center justify-center"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
