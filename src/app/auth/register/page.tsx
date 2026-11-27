"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { register as registerUser } from "@/lib/auth";
import { acceptWatchlistInvite } from "@/lib/watchlist";
import { useAuthStore } from "@/stores/auth-store";
import { promoteGuestProgress } from "@/lib/onboarding-submit";
import { isNewOnboardingEnabled } from "@/lib/session";
import { analytics } from "@/lib/analytics";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const authStatus = useAuthStore((s) => s.authStatus);
  const [error, setError] = useState("");
  const [saveFailure, setSaveFailure] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteWatchlistId, setInviteWatchlistId] = useState<number | null>(null);
  const [processingInvite, setProcessingInvite] = useState(false);

  const from = searchParams.get("from");
  // The signup popup offers this page as the full email sign-up UI. Don't bounce
  // those guests back into onboarding; the gate still applies to normal entries.
  const fromSignupPrompt = searchParams.get("signup") === "prompt";
  const accountStep = from === "/onboarding/recommended-for-you" || fromSignupPrompt;
  const waitingForAuth =
    isNewOnboardingEnabled() && !accountStep && authStatus === "restoring";
  const onboardingGate =
    isNewOnboardingEnabled() && !accountStep && authStatus === "guest";

  useEffect(() => {
    if (!onboardingGate) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("fresh", "1");
    router.replace(`/onboarding?${params.toString()}`);
  }, [onboardingGate, router, searchParams]);

  useEffect(() => {
    const token = searchParams.get("invite");
    const watchlistId = searchParams.get("watchlistId");
    if (token && watchlistId) {
      setInviteToken(token);
      setInviteWatchlistId(Number(watchlistId));
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    analytics.registerAttempt();
    try {
      setError("");
      setSaveFailure("");
      const { user, tokenExpiresAt } = await registerUser(data);

      if (!user.userId) {
        setError("Registration failed. Please try again.");
        return;
      }

      setSession(user, tokenExpiresAt);
      analytics.registerSuccess(user.userId);

      // Handle invite token after successful registration
      if (inviteToken && inviteWatchlistId) {
        setProcessingInvite(true);
        try {
          await acceptWatchlistInvite(inviteWatchlistId, inviteToken);
        } catch (e) {
          console.error("Failed to accept invite:", e);
        } finally {
          setProcessingInvite(false);
        }
      }

      try {
        await promoteGuestProgress(user.userId);
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        console.error("Failed to promote guest setup:", e);
        // The account already exists and the session is live. Never strand the
        // user on this form — let them continue and retry setup from the resume
        // banner, with the underlying backend reason visible for support.
        setSaveFailure(reason);
        return;
      }

      // A successful sign-up always starts at the app home, no matter which
      // page or prompt opened the form (email or social go through this rule).
      router.push("/feed");
    } catch (err: any) {
      const message = err?.message ?? "Registration failed";
      const code = Number(message.match?.(/\d{3}/)?.[0]) || 0;
      analytics.registerFailure(code, message);
      if (err.message?.includes("409") || err.message?.includes("already")) {
        setError("An account with this username or email already exists");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    }
  };

  if (waitingForAuth || onboardingGate) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/feed" className="lg:hidden block mb-6">
          <BrandLogo />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground">
          Join BingeWise to discover and share movies
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {saveFailure && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm space-y-2">
            <p>
              Your account is ready, but your setup preferences could not be
              saved ({saveFailure}). Your progress is still on this device.
            </p>
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="font-medium text-primary hover:underline"
            >
              Continue without saving &rarr;
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name
          </label>
          <input
            id="name"
            {...register("name")}
            placeholder="John Doe"
            autoComplete="name"
            className="input-base"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            {...register("username")}
            placeholder="johndoe"
            autoComplete="username"
            className="input-base"
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            {...register("email")}
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            className="input-base"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              autoComplete="new-password"
              className="input-base pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full h-11"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          You&rsquo;ll stay signed in until you sign out.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
