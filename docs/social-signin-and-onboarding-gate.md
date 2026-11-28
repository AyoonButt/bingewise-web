# Social sign-in + required account at onboarding exit

## Goal

1. Let guests create/sign in with **Google** or **Apple** instead of only email/password.
2. Remove the guest escape hatch from onboarding: both **Skip** and **Finish Setup** must open the account/OAuth prompt. A guest cannot leave onboarding into `/feed` without an account.
3. Reserve guest browsing for shared links (`invite` / `watchlistId`); generic guest CTAs start onboarding instead of jumping into the feed.

## Decisions

- **Firebase Auth handles the browser flow** (`signInWithPopup`) for both providers. The project already uses Firebase for messaging/analytics, so no second JS SDK is needed.
  - Google: `GoogleAuthProvider`.
  - Apple: `OAuthProvider("apple.com")`.
- **Our backend owns the app session.** After the popup, the client sends the provider's raw ID token to `/api/auth/social`; the Next.js route proxies it to the backend's existing `/api/auth/google` or `/api/auth/apple`, which verifies the token, finds/creates the user, and returns the same app tokens as email login. The proxy stores them in httpOnly cookies. Firebase's own token is never used as an app session.
- **Account promotion reuses existing logic**: `promoteGuestProgress(userId)` saves onboarding preferences if the guest finished `recommended-for-you`, otherwise keeps progress so setup can resume.
- **Prompt UI**: reuse `SignupPromptModal`. Add a `required` mode (no close button, no backdrop dismiss) used only by onboarding. The existing optional mode used in the main layout is unchanged.

## Phase 1 — Provider configuration (external)

### Google

1. In Google Cloud Console, create/configure an OAuth 2.0 Client ID of type **Web application** for this Firebase project.
2. Add the production domain and `http://localhost:3000` to **Authorized JavaScript origins**, and the Firebase callback URL to **Authorized redirect URIs**.
3. In Firebase Console → **Authentication → Sign-in method**, enable **Google** with that client ID. Add `bingewise.net`, `www.bingewise.net`, and any staging domains to **Authorized domains**.

### Apple

1. Reuse the mobile app's existing **App ID** (bundle ID) as the primary App ID. It must have the **Sign in with Apple** capability enabled.
2. Create a **Services ID** (e.g. `com.bingewise.web`) — this is the web `client_id`, not the bundle ID.
3. Configure the Services ID with that primary App ID, register the domain, and register the exact HTTPS return URL. Firebase supplies the redirect URL on the Apple provider setup screen.
4. Create/choose a `.p8` **Sign in with Apple key** associated with the primary App ID; note the **Key ID** and **Team ID**. The key can be reused by the existing mobile backend if it is associated with the same primary App ID.
5. Paste the Services ID, Team ID, Key ID, and `.p8` into Firebase Console → **Authentication → Sign-in method → Apple**. Add the same authorized domains.

Apple return URLs must be absolute HTTPS URLs on a registered domain — `localhost` and IP addresses are not accepted. Test locally behind an HTTPS tunnel or on a staging domain.

## Phase 2 — Backend status (checked in `REST-API`)

No new backend endpoint is needed for basic social sign-in. The backend already exposes:

- `POST /api/auth/google` and `POST /api/auth/apple` — `postgres/.../controllers/SocialAuthController.kt:51-57`.
- Provider-issued token verification — `postgres/.../services/SocialTokenVerifier.kt`: Google `GoogleIdTokenVerifier` with configured audiences; Apple identity token via Apple's JWKS (signature, `iss`, `aud`, `exp`).
- Same JSON response shape as `/api/auth/login`, with `needsSetup` set for new users (`SocialAuthController.kt:105-120`).

There is **no** `/api/auth/social`, no Firebase Admin `verifyIdToken`, and no provider-UID linking. Accounts are linked by verified email only (`SocialAuthController.kt:78-86`); Apple private-relay emails are not specially handled.

The Next.js proxy keeps a single client path (`/api/auth/social`) but forwards to `/api/auth/{provider}`. Firebase's popup gives us the provider's **raw** identity token (`OAuthCredential.idToken`), not the Firebase ID token, so the existing backend verifiers accept it. An optional `name` hint is forwarded for Apple's first authorization.

Config must line up for verification to pass:

- Firebase Google web OAuth client ID must equal backend `oauth.web-client-id` (or `oauth.mobile-client-id`).
- Firebase Apple Services ID must equal backend `apple.web-client-id` (`APPLE_WEB_CLIENT_ID`). Native iOS tokens use the bundle ID in `apple.client-id` (`APPLE_CLIENT_ID`, default `com.bingewise.app`); the verifier accepts both audiences.

Known backend gaps to track separately: email-only linking can attach a social identity to an existing password account with the same email; Apple relay addresses are not mapped to a stable identity; JWT logout is stateless.

### Verified against source and live deployment (2026-11-27)

Backend source was checked clean at `22fbdd8 OAuth Fix`; live health at `https://api-bingewise.com/actuator/health` returned 200.

- Auth endpoints return JWTs in JSON and set **no** cookies. The web proxies are the only layer that sets httpOnly `accessToken`/`refreshToken` cookies.
- `POST /api/auth/register` accepts `username`, `email`, `password`, `name`. Social endpoints require the raw provider `idToken`; request `provider` and `email` are ignored. `POST /api/auth/refresh` takes the refresh token in `Authorization: Bearer …` with no body.
- `needsSetup` is **response-only**: `true` for register/new social users, `false` for login/refresh/restore. It is not a DB column and cannot be cleared server-side. The web client marks it `false` locally after a successful profile save and treats every new registration as `needsSetup: true` even if the deployed response omits it.
- The deployed auth responses observed in probes omit `language`, `region`, and `needsSetup` from `user`; the source includes them. Observed `roles` casing also differs between register and login/refresh. The web client defaults missing locale fields and does not depend on role values for onboarding.
- OAuth verification is done by the backend itself (Google ID-token verifier; Apple JWKS), not Firebase Admin. Google accepts only configured OAuth web/mobile client IDs; Apple accepts `APPLE_CLIENT_ID` and `APPLE_WEB_CLIENT_ID` audiences. The web Apple Services ID must be supplied as `APPLE_WEB_CLIENT_ID`; without it a `web.bingewise` audience is rejected. Real Google/Apple tokens were not available for a live success probe, so this remains configuration-dependent.
- Validation errors are `{"error":"Invalid Request","message":…}`; social verification errors are `{"error":…}`. The web proxies forward these reason strings.

## Phase 3 — Frontend (this repo, implemented)

- `src/lib/firebase-auth.ts` — `getSocialIdToken(provider)` using Firebase Auth popups and returning the provider's raw ID token plus a name hint.
- `src/lib/auth.ts` — `socialSignIn(provider)` posts the token to `/api/auth/social` and returns the same `{ user, tokenExpiresAt }` as `login()`/`register()`.
- `src/app/api/auth/social/route.ts` — origin-checked proxy that maps to the backend's `/api/auth/google` or `/api/auth/apple`, strips tokens from the JSON body, and sets httpOnly cookies.
- `src/stores/ui-store.ts` — prompt now carries `required` and `destination` state.
- `src/components/auth/SignupPromptModal.tsx` — Google/Apple buttons, error display, optional vs required mode, promotion of guest progress after social sign-in. Successful sign-up always navigates to the app home (`/feed`); the prompt's destination is only used for the existing-account sign-in link.
- `src/components/onboarding/OnboardingShell.tsx` and `src/app/onboarding/page.tsx` — **Skip** opens the required prompt for guests; authenticated users still go straight to `/feed`.
- `src/app/onboarding/recommended-for-you/page.tsx` — **Finish Setup** opens the required prompt for guests; the dismissible email-only card was replaced with a single account CTA; `?prompt=1` opens the same modal after auth restores.
- `next.config.mjs` — CSP `connect-src`/`frame-src` allow Firebase Auth, Google, and Apple origins.
- `.env.example` — note that Firebase Auth providers must be enabled.

### Entry-point and conversion changes

- `src/components/OnboardingEntryRedirect.tsx` — now mounted globally in `src/app/layout.tsx`. Shared watchlist links (`invite` / `watchlistId`) and post links (`/post/[id]`, `/activity/item/[postId]`) mark the first visit complete and open their target without onboarding. `guest` and `from` no longer bypass onboarding (`from` is an internal auth-return parameter, not a shared link). The home-page redirect is unchanged for everyone else.
- `src/app/page.tsx` — the two generic guest CTAs now open `/onboarding` instead of `/feed?guest=1`.
- `src/app/auth/login/page.tsx` — removed **Continue as Guest**; email sign-in, sign-up, and the shared-link invite flow remain.
- `src/components/auth/SignupPromptModal.tsx` — the **Create account with email** action opens the full `/auth/register` page with `signup=prompt`; `src/app/auth/register/page.tsx` recognizes that flag and does not bounce the guest back into onboarding, while normal register entries still do. A successful email registration ignores `from` and always lands on `/feed`, matching the OAuth path.
- `src/lib/onboarding-submit.ts` — the profile payload uses the backend's `UserUpdate` field names exactly; the client-only `vibe*` store names were being silently dropped by Jackson. Vibe rejects are no longer merged into hard `avoidGenres`: they are sent as `softAvoidGenreIds`, while rejected posters are sent as `excludedTmdbIds`. The dead `complete-setup` and notification-settings calls were removed (the backend has neither endpoint); the web alert choice is preserved in `src/lib/notification-preferences.ts` until backend persistence exists.
- `src/app/onboarding/stay-connected/page.tsx` and `src/app/(main)/settings/notifications/page.tsx` — redesigned around what web can actually enforce: one per-device master toggle plus browser permission and device (un)registration. The mobile-style category toggles were removed because neither the backend nor the web service worker suppresses by category; the legacy `/onboarding/notifications` route now redirects to `Stay Connected`.
- `src/lib/onboarding-preview.ts`, `src/app/api/recommendations/preview/route.ts` — signed-in and guest previews now send the full `UserPreferencesDto` in the POST body, including dates, runtimes, rating, `softAvoidGenreIds` and `excludedTmdbIds`, with the backend's `minTV`/`maxTV` casing. The public backend preview/vibe-slate POSTs are no longer blocked for signed-in users by a stale cookie.
- `src/app/onboarding/genres/page.tsx` — genre search accepts both backend `genreId`/`genreName` and legacy `id`/`name` responses, so search-added genres no longer save as `undefined`.
- `src/lib/api-client.ts` and `src/app/auth/register/page.tsx` — backend error bodies (`message` or `error`) are surfaced verbatim. If promoting guest progress fails after registration, the account and session are kept, the reason is shown, and a **Continue without saving** action lets the user reach the app and retry setup from the resume banner instead of being stranded on the form.
- `src/components/guest/GuestBanner.tsx` — guests with saved onboarding progress see a **Finish setup** resume banner on guest-browsable pages; others see the original create-account banner. Dismissal is persisted separately per variant.
- `src/app/onboarding/recommended-for-you/page.tsx` — loading state is now a six-tile poster skeleton matching the final grid; poster URLs use `tmdbImage()` so a missing `NEXT_PUBLIC_TMDB_IMAGE_BASE` cannot produce `/undefined/...` URLs.
- `src/lib/analytics.ts` — new events `bw_onboarding_step_viewed`, `bw_onboarding_exited`, `bw_signup_prompt_shown`, `bw_signup_provider_clicked`; `bw_onboarding_started` now carries an acquisition `source` (UTM/referrer).
- `src/lib/session.ts` / `.env.example` — `NEXT_PUBLIC_ONBOARDING_ACCOUNT_GATE` (default on) A/B switch. Set to `false` for a soft gate: Skip and Finish Setup let guests into `/feed`, with the resume banner as the nudge to come back.

Remaining before the buttons work end-to-end: provider config and matching token audiences (Phase 1/2). No backend code change is needed for the basic flow; until config matches, the buttons surface the backend error message.

## Phase 4 — Tests / acceptance

`e2e/onboarding-session.spec.ts`:

- Guest **Skip setup** opens the required dialog instead of navigating to `/feed?guest=1`.
- The required dialog has Google, Apple, full-page email sign-up, and sign-in actions, and no close affordance. Its email action opens the real registration form instead of looping back to onboarding.
- Guest **Finish Setup** opens the required dialog and does not navigate.
- `guest` / `from` query params no longer skip onboarding; `invite` / `watchlistId` and post deep links (`/post/[id]`, `/activity/item/[postId]`) still do.
- Login has no guest bypass; home guest CTAs enter onboarding.
- A guest with saved progress sees the resume banner on `/feed`, linking to the correct next step.
- The recommendation preview renders poster skeletons while loading.
- Existing signed-in flows (resume, register-from-final-step, refresh failure) still pass.

Manual checks once credentials exist:

- Google popup on desktop and mobile browsers.
- Apple popup on Safari (native sheet) and Chrome (appleid.apple.com page); first sign-in returns the name, later sign-ins do not.
- Apple "Hide My Email" relay address creates/links the right account.
- Social sign-in mid-onboarding resumes at the correct step; sign-in at the final step saves preferences and lands on `/feed`.

## Rollout

1. Merge UI/gate behind the existing `NEXT_PUBLIC_NEW_ONBOARDING` switch (defaults on).
2. Configure providers and align OAuth client IDs / Services ID with backend audiences.
3. Verify on staging with real Google/Apple accounts before enabling in production.
4. Monitor `/api/auth/social` failures, step-level funnel events, and sign-up conversion; keep email/password as fallback.
5. A/B test `NEXT_PUBLIC_ONBOARDING_ACCOUNT_GATE=true` (required) against `false` (soft gate + resume banner); compare `bw_setup_completed` and sign-up rate separately.
