"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Heart, Bookmark, ListPlus, Loader2 } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { analytics } from "@/lib/analytics";
import { socialSignIn, type SocialProvider } from "@/lib/auth";
import { promoteGuestProgress } from "@/lib/onboarding-submit";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.6l3.3 2.6C7.2 7.8 9.4 6 12 6Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.8-.9-3-.9-1.5 0-3 .9-3.8 2.2-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 3 2.3 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.9-1.1-2.9-4.6ZM14.5 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3Z" />
    </svg>
  );
}

/**
 * Global guest-conversion prompt. Opened via uiStore.openSignupPrompt() whenever a
 * signed-out visitor tries an auth-required action (like, save, comment...), or in
 * required mode when a guest tries to leave or finish onboarding without an account.
 * Mounted once in the (main) layout and in the onboarding shell.
 */
export function SignupPromptModal() {
  const isOpen = useUiStore((s) => s.isSignupPromptOpen);
  const required = useUiStore((s) => s.isSignupPromptRequired);
  const destination = useUiStore((s) => s.signupPromptDestination);
  const close = useUiStore((s) => s.closeSignupPrompt);
  const authStatus = useAuthStore((s) => s.authStatus);
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) analytics.logSignupPromptShown(required ? "onboarding" : "action");
  }, [isOpen, required]);

  // The prompt belongs to the guest flow. Once a session exists (social popup,
  // email register/login in another route, or session restore), never leave the
  // "Create account" overlay visible on top of the signed-in app.
  useEffect(() => {
    if (isOpen && authStatus === "authenticated") close();
  }, [authStatus, close, isOpen]);

  if (!isOpen) return null;

  const target = destination || pathname || "/feed";
  const from = encodeURIComponent(target);

  const handleSocial = async (provider: SocialProvider) => {
    analytics.logSignupProviderClicked(provider);
    setBusy(provider);
    setError(null);
    try {
      const { user, tokenExpiresAt } = await socialSignIn(provider);
      useAuthStore.getState().setSession(user, tokenExpiresAt);
      try {
        await promoteGuestProgress(user.userId);
      } catch {
        // The account is live even if saving local setup preferences failed.
      }
      close();
      // New accounts (email or social) always start at the app home. `target`
      // is only used for the existing-account sign-in link below.
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={() => {
        if (!required) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Create a free account"
    >
      <div
        className="relative w-full max-w-sm card p-6 space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {!required && (
          <button
            onClick={close}
            className="absolute top-2 right-2 p-2.5 rounded-lg hover:bg-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="space-y-1">
          <h2 className="text-xl font-bold">
            {required ? "Create an account to continue" : "Join BingeWise"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {required
              ? "Save your setup and unlock your personalized feed."
              : "Create a free account to unlock the good stuff."}
          </p>
        </div>

        {!required && (
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
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void handleSocial("google")}
            disabled={busy !== null}
            className="btn-outline w-full h-10 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {busy === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => void handleSocial("apple")}
            disabled={busy !== null}
            className="btn-outline w-full h-10 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {busy === "apple" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AppleIcon />
            )}
            Continue with Apple
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or create with email
          <span className="h-px flex-1 bg-border" />
        </div>

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-2 pt-1">
          {/* Full registration page, not the inline popup. The flag lets the register
              screen stay open even when the onboarding account gate is active. */}
          <Link
            href={`/auth/register?from=${from}&signup=prompt`}
            onClick={() => analytics.logSignupProviderClicked("email")}
            className="btn-primary w-full h-10 flex items-center justify-center"
          >
            Create account with email
          </Link>
          <Link
            href={`/auth/login?from=${from}`}
            onClick={() => analytics.logSignupProviderClicked("email")}
            className="btn-outline w-full h-10 flex items-center justify-center"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
