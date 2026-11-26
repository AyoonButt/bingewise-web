# BingeWise Web — Onboarding & Stay-Logged-In Plan

Aliases used below:

- `mobile` = `~/StudioProjects/AdvancedRecommedationApp`
- `web` = `~/projects/bingewise-web`

Status: plan approved for phased implementation. No files were changed while producing this plan.

## Phase 0 — Decisions and API contract

### Decisions applied

1. **Session policy**: keep the current 30-day refresh cookie lifetime and implement a 30-day rolling inactivity window. A 90-day window would require a coordinated backend/cookie TTL change and is deferred.
2. **Remember me**: do not add a toggle. Sessions are implicit and secure by default, matching mobile.
3. **Social sign-in**: implement the soft signup prompt with the providers the web backend already supports; if OAuth endpoints are unavailable, use an email-signup-only variant with the same progress-promotion behavior.
4. **Rollout**: gate the new wizard behind `NEXT_PUBLIC_NEW_ONBOARDING=true`.

### Backend contract to confirm

- `AuthUserInfo.needsSetup` is returned in auth responses and can be cleared after setup.
- `GET/PUT /api/users/{userId}/notification-preferences` is available for the Stay Connected step.
- Vibe feedback can be persisted via existing recommendation feedback endpoints (likes, soft avoids, excluded TMDB IDs).
- Optional: `/api/auth/google` and `/api/auth/apple` for parity with mobile's soft signup overlay.

---

## 1. Mobile behavior to copy

### Onboarding

- Active 8 steps: Welcome → Region/Language → Content Rating → Streaming → Stay Connected → Vibe Check → Taste Calibration → Recommended For You (`mobile/composeApp/src/commonMain/kotlin/com/bingewise/app/navigation/setup/SetupConfig.kt:11-37`, `mobile/shared/src/commonMain/kotlin/com/bingewise/shared/presentation/setup/SetupFlowViewModel.kt:1297-1311`).
- Fresh install enters setup; stored account, stored guest, or shared/deep link goes straight to Main (`mobile/composeApp/src/commonMain/kotlin/com/bingewise/app/navigation/RootComponent.kt:67-77,164-180`). `needsSetup` is deliberately not used for startup routing (`:126-129`).
- Welcome offers Start / Resume / Start Fresh / Skip. Login also offers Resume Setup when saved progress matches the user or is still guest-owned (`mobile/composeApp/src/commonMain/kotlin/com/bingewise/app/ui/screens/auth/LoginScreen.kt:47-116`).
- Progress is saved locally after each decision/marked step, keyed by user, and invalidated when the user changes (`mobile/shared/src/commonMain/kotlin/com/bingewise/shared/presentation/setup/SetupFlowViewModel.kt:348-509,1443-1512`, `mobile/shared/src/commonMain/kotlin/com/bingewise/shared/settings/AppSettings.kt:88-109`).
- Vibe Check uses one prefiltered slate, 6 cards normally, 8 only without a clear positive signal; rejected posters are persisted and not re-offered on resume (`mobile/composeApp/src/commonMain/kotlin/com/bingewise/app/ui/screens/setup/VibeCheckScreen.kt:61-67,91-160`).
- Taste Calibration is non-skippable, 4 stages × 250 ms = ~1 s (`mobile/composeApp/src/commonMain/kotlin/com/bingewise/app/ui/screens/setup/TasteCalibrationScreen.kt:53-58`).
- End screen previews recommendations and applies a soft signup prompt; social sign-in promotes local progress into the account, email signup saves progress then signs up (`mobile/composeApp/src/commonMain/kotlin/com/bingewise/app/ui/screens/setup/RecommendedForYouScreen.kt:95-199`).
- Completion sends a full profile/preferences update, notification preferences, then clears saved progress (`mobile/shared/src/commonMain/kotlin/com/bingewise/shared/presentation/setup/SetupFlowViewModel.kt:1207-1229,1154-1294`).

### Stay logged in

- Tokens and user fields are stored in Android `EncryptedSharedPreferences` (AES256-SIV/GCM) and iOS Keychain (`afterFirstUnlock`) (`mobile/shared/src/commonMain/kotlin/com/bingewise/shared/platform/SecureStorage.android.kt:30-42,125-127`, `SecureStorage.ios.kt:63-112`).
- Session valid for 90 days of inactivity, activity writes throttled to 5 minutes, future timestamps invalidate on clock rollback (`mobile/shared/src/commonMain/kotlin/com/bingewise/shared/domain/auth/SessionManager.kt:33,39,76-115,143-183`).
- Cold start: 5 s restore timeout; cached user used while restore retries in background; refresh-only or access-only storage is accepted (`mobile/shared/src/commonMain/kotlin/com/bingewise/shared/presentation/auth/AuthViewModel.kt:311-384`, `AuthRepositoryImpl.kt:324-397`).
- Refresh: proactive before expiry, 401 refresh under mutex, 3 retries with backoff; `5xx/429/408/network` keep tokens, `400/401/403/404` clear them (`mobile/shared/src/commonMain/kotlin/com/bingewise/shared/data/remote/HttpClientFactory.kt:48-110,174-285`, `AuthRepositoryImpl.kt:147-208`).
- Remote logout via push clears tokens and platform session state (`mobile/shared/src/commonMain/kotlin/com/bingewise/shared/domain/auth/RemoteLogoutHandler.kt:34-102`).
- No “Remember me” toggle: persistence is implicit and always secure (`mobile/composeApp/src/commonMain/kotlin/com/bingewise/app/ui/screens/auth/LoginScreen.kt:286-288`).

## 2. Web today

- Next.js App Router + Zustand + React Query (`web/package.json:5-30`).
- Cookies: access 15 min, refresh 30 days (`web/src/lib/session.ts:5-6`); localStorage holds only session metadata (`web/src/stores/auth-store.ts:19-41`).
- Middleware refreshes on navigation when only the refresh cookie exists (`web/src/middleware.ts:85-101,103-149`); client revalidates every 10 min, on focus, and cross-tab (`web/src/components/providers.tsx:120-184`).
- Register refresh cookie is 7 days, inconsistent with login/refresh at 30 days (`web/src/app/api/auth/register/route.ts:61-67`).
- Client can force logout at 30 days from `loginTimestamp` even if cookies are valid (`web/src/stores/auth-store.ts:84-87,108-112`).
- Failed middleware refresh does not clear stale cookies (`web/src/middleware.ts:116,146-148`); refresh API collapses all failures to 401 (`web/src/app/api/auth/refresh/route.ts:29-31`).
- `needsSetup` exists in the type but is dropped when mapping auth user → session user (`web/src/types/auth.ts:9`, `web/src/lib/auth.ts:8-17`, `web/src/lib/token-refresh.ts:39-48`).
- Register always routes to `/onboarding`, login always to `/feed` (`web/src/app/auth/register/page.tsx:84`, `web/src/app/auth/login/page.tsx:77`).
- Web onboarding is 7 visible steps, not mobile's 8 (`web/src/app/onboarding/layout.tsx:7-16`); progress key is `bingewise-onboarding` (`web/src/stores/onboarding-store.ts:328-331`).
- Skip goes to `/feed` with no resume re-entry (`web/src/app/onboarding/layout.tsx:31-34`); welcome has Resume/Start Fresh but no user ownership check (`web/src/app/onboarding/page.tsx:23-28,153-183`).
- Final save only sends profile/preferences and does not persist notification categories; preview uses a separate fetch and `alert()` on failure (`web/src/app/onboarding/review/page.tsx:33-91`).

## 3. Gap → web change

| Mobile behavior | Web gap | Web change |
|---|---|---|
| Fresh-install-only onboarding | Register-only trigger; skip loses re-entry | Add explicit onboarding entry decision using stored session/guest/deep-link + `needsSetup` as metadata |
| Resume with user ownership | Local progress has no `userId` | Versioned persisted progress keyed by user |
| Vibe Check + Taste Calibration + end preview | Static 7-step form | Rebuild as 8 steps; fold web Basics/Genres into Region/Language and taste steps |
| Guest setup then soft signup | `/onboarding` blocked for guests | Allow guest onboarding; defer backend save until account exists |
| Inactivity tolerance + transient-failure tolerance | Absolute 30-day client cap; all refresh failures treated alike | Rolling activity model bounded by cookie TTL; classify retryable vs definitive failures |
| No Remember-me | No toggle already | Keep no toggle; add honest copy instead |
| Remote logout | No push equivalent | Not needed for web; browser cross-tab logout must be complete |

## 4. Implementation phases

### Phase 1 — Session/persistence foundation

Files: `web/src/lib/session.ts`, `web/src/stores/auth-store.ts`, `web/src/components/providers.tsx`, `web/src/middleware.ts`, `web/src/app/api/auth/{login,register,refresh,logout}/route.ts`, `web/src/app/api/backend/[...path]/route.ts`, `web/src/lib/token-refresh.ts`, `web/src/lib/api-client.ts`.

- Replace hardcoded register TTLs with `ACCESS_TOKEN_MAX_AGE` / `REFRESH_TOKEN_MAX_AGE` (`src/app/api/auth/register/route.ts:54-67`).
- Re-set refresh cookie on every successful refresh, even when backend does not rotate it, to create a rolling window (`src/app/api/auth/refresh/route.ts:45-53`, `src/middleware.ts:136-144`).
- Introduce `LAST_ACTIVITY_KEY`/`SESSION_INACTIVITY_MS`; update on authenticated requests/focus/navigation with throttling; reject future timestamps; align with mobile `SessionManager`.
- Stop treating `loginTimestamp` as the only authority. If cookies refresh successfully, keep the user authenticated; localStorage becomes a cache, not the session owner (`src/stores/auth-store.ts:84-87`).
- Classify refresh failures: definitive → clear cookies + localStorage + redirect; retryable → keep session and retry later (`src/lib/token-refresh.ts:32-67`, `src/app/api/auth/refresh/route.ts:29-31`).
- On definitive middleware refresh failure, clear `accessToken`/`refreshToken` before redirect (`src/middleware.ts:85-101`).
- Add refresh attempt on public auth paths when a refresh cookie exists, avoiding stale login screens (`src/middleware.ts:67-72`).
- Add CSRF origin guard to logout for parity with other auth routes (`src/lib/request-guard.ts:12-24`).
- Add `authStatus: "restoring" | "authenticated" | "guest"` gate in `AuthInitializer` to prevent auth/guest flashes (`src/components/providers.tsx:120-184`).
- Keep no Remember-me checkbox; add copy: “You’ll stay signed in until you sign out.”

Acceptance: no forced logout while refresh is healthy; transient 5xx keeps session; definitive 401 clears everything; register and login have identical 30-day refresh TTL.

### Phase 2 — Onboarding state model and resume

Files: `web/src/stores/onboarding-store.ts`, new `web/src/lib/onboarding-progress.ts`, `web/src/app/onboarding/page.tsx`.

- Add `schemaVersion`, `userId`, `startedAt`, `lastStep`, `vibeDeckProgress`, `vibeLikedGenres`, `vibeSoftAvoidedGenres`, `vibeExcludedTmdbIds`, and ordered provider/genre priority to the persisted store.
- Add `loadForUser(userId)`, `saveForUser(userId)`, `clearTrackingOnly()`, `markStepCompleted(step)`, `completeSetup(userId)`, and `isOwnedBy(userId)`.
- Invalidate/reset when `userId` changes or schema version mismatches, mirroring `mobile SetupFlowViewModel.kt:348-397`.
- Build a `stepFromCompleted()` mapper equivalent to `mobile SetupConfig.kt:64-74` so Resume lands on the correct route, not just `completedSteps.length`.
- Update progress math from 7 to 8 steps (`src/stores/onboarding-store.ts:249-252`).

Acceptance: reload at any step resumes exactly; login with matching progress offers Resume; login with another user's progress clears it; Start Fresh resets all fields.

### Phase 3 — Entry/routing changes

Files: `web/src/lib/auth.ts`, `web/src/lib/token-refresh.ts`, `web/src/app/auth/login/page.tsx`, `web/src/app/auth/register/page.tsx`, `web/src/middleware.ts`, `web/src/app/page.tsx`.

- Preserve `needsSetup` in `UserDto`/session mapping (`src/lib/auth.ts:8-17`, `src/lib/token-refresh.ts:39-48`).
- Routing rules matching mobile:
  - Fresh visitor with no session/guest/deep link → `/onboarding`.
  - Stored account or guest → `/feed`; never auto-replay setup.
  - Register → `/onboarding?fresh=1`.
  - Login → `/feed`, but if owned partial progress exists show Resume Setup dialog → `/onboarding?resume=1`.
  - Shared watchlist/post deep links → target page as guest, no setup interruption.
- Preserve `invite`, `watchlistId`, and `from` params through auth/setup (`src/app/auth/login/page.tsx:34-41`, `src/app/auth/register/page.tsx:40-47`).
- Allow `/onboarding` in `guestPaths` only if all steps are guest-safe and no user-scoped calls happen before signup (`src/middleware.ts:11`).

Acceptance: returning user never sees setup; deep links never bounce to setup; invite flow survives auth + setup.

### Phase 4 — Rebuild the 8-step wizard

Files: `web/src/app/onboarding/**`, `web/src/components/onboarding/**`, `web/src/stores/onboarding-store.ts`.

1. **Welcome** — Start / Resume / Start Fresh / Skip; show saved progress %. `web/src/app/onboarding/page.tsx`.
2. **Region/Language** — language, region, content language; fold current duration/date filters here or into an expandable “advanced taste” block.
3. **Content Rating** — reuse current ratings UI (`web/src/app/onboarding/ratings/page.tsx`).
4. **Streaming** — reuse provider picker and add ordering (`web/src/app/onboarding/streaming/page.tsx`).
5. **Stay Connected** — browser `Notification.requestPermission()`, device registration via existing `NotificationInitializer`, category toggles, and backend notification-preferences save.
6. **Vibe Check** — new screen: fetch one prefiltered slate, 6 cards, widen to 8 when no positive signal, persist each decision, never fall back to unrelated trending posters on failure (`mobile VibeCheckScreen.kt:91-160`).
7. **Taste Calibration** — new screen: fixed 250 ms × 4 stages, `prefers-reduced-motion` fallback, non-skippable (`mobile TasteCalibrationScreen.kt:53-58`).
8. **Recommended For You** — prefetch preview, timed trending fallback, soft signup prompt for guests, promote guest progress to the new account on signup, then mark setup complete (`mobile RecommendedForYouScreen.kt:95-199`).

Also:

- Move `<head>` metadata out of the client layout into server metadata handling (`web/src/app/onboarding/layout.tsx:26-30`).
- Replace `alert()` with inline retryable errors that preserve progress (`web/src/app/onboarding/review/page.tsx:59-61`).
- Remove debug `console.log` from preview (`web/src/app/onboarding/review/page.tsx:83`).
- Make Skip mark the current step complete and expose a persistent “Finish setup” entry for guests/incomplete users instead of silently dropping progress.

Acceptance: all 8 steps work on mobile viewport; resume is exact; vibe rejections are not re-shown; keyboard/focus/reduced-motion pass.

### Phase 5 — Completion and save

Files: `web/src/app/onboarding/review/page.tsx`, new `web/src/lib/onboarding-submit.ts`, `web/src/app/api/users/**` as needed.

- Build one submit payload containing profile preferences + notification preferences + vibe signals.
- For accounts: `PUT /api/users/{userId}`, save notification prefs, call complete-setup, refresh auth store with updated `needsSetup`, clear local progress, redirect to intended destination.
- For guests: mark local completion only; on later signup/social login promote progress by calling the same submit path before redirecting to `/feed`.
- Retry policy: keep local progress until every required save succeeds; partial success must not clear the store.

Acceptance: no data loss on failed save; completion clears progress exactly once; guest progress is promoted after signup.

### Phase 6 — Tests and verification

Add Playwright e2e coverage in `web/e2e/`:

- fresh visitor → onboarding → skip → re-entry banner → resume
- register → onboarding → reload mid-step → resume → finish → `/feed`
- login with matching progress → Resume dialog; with stale user progress → cleared
- returning account → `/feed`, no setup flash
- shared watchlist deep link as guest → no setup
- refresh-token-only cookie → navigation refreshes and stays signed in
- upstream 500 during refresh → still signed in; 401 → cookies/localStorage cleared
- register refresh cookie `Max-Age` equals login refresh cookie
- cross-tab logout updates all tabs
- vibe deck resume excludes rejected TMDB IDs
- invite token survives auth + setup

Verification commands:

```bash
npm run lint
npm run typecheck
npm run build
npx playwright test
```

### Phase 7 — Rollout

- Ship behind `NEXT_PUBLIC_NEW_ONBOARDING` with analytics parity: `onboarding_started`, `step_completed`, `resume_used`, `vibe_card_decision`, `setup_completed`, `session_restored`, `refresh_retryable_failure`.
- Monitor setup completion rate, resume rate, refresh failure rate, logout-on-transient-error rate, and `/onboarding` bounce rate.
- Remove legacy 7-step routes after one stable release or keep them as redirects for bookmarks.

## Suggested execution order

1. Fix register TTL + refresh failure classification + auth hydration gate.
2. Version onboarding store and add user ownership/resume mapping.
3. Change routing and preserve `needsSetup`.
4. Build 8-step UI, Vibe, Taste Calibration, and soft signup.
5. Unify completion save and guest progress promotion.
6. Add e2e matrix, then flag rollout.

## Execution status

Phases 0–7 are implemented. Rollout is enabled unless `NEXT_PUBLIC_NEW_ONBOARDING=false`.

Verification completed:

- `npm run typecheck` passed.
- `npm run lint` passed with the pre-existing `src/app/(main)/notifications/page.tsx:141` `<img>` warning.
- `npm run build` passed.
- `npx playwright test e2e/onboarding-session.spec.ts` passed 6/6.
