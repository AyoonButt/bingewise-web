# BingeWise Web — Title Tracking + Private Notes Plan (client-only)

Aliases used below:

- `mobile` = `/Users/ayoon/Documents/AdvancedRecommedationApp`
- `web` = `/Users/ayoon/Documents/bingewise-web` (this repo)
- `api` = `/Users/ayoon/Documents/REST-API`

Status: **proposed, not implemented**. No application files were changed while producing this plan.

---

## 0. Scope — what is and is not in this plan

This is the **web-only slice** of the title-tracking feature.

**In scope:** web types, API client, React Query hooks/cache, Zustand UI state, components,
routes/tabs, analytics, and Playwright coverage.

**Explicitly out of scope (owned by `mobile/TRACKING_NOTES_PLAN.md`):**

- no backend controller/service/entity/SQL changes
- no `REST-API` hard-exclusion or Redis work
- no `RecommendationMLModel` changes, signals, or ack changes
- no ranking/vector changes

**Parity rule:** `mobile/TRACKING_NOTES_PLAN.md` is the single source of truth for the API
contract, enum values, validation, and privacy rules. Web mirrors it; web does **not** invent a
local variant. If web needs a different contract, change that plan first and then both clients.
There is **no localStorage tracking store** in web: a web write must hit the same API a mobile
write hits, so a title marked watched on mobile is immediately watched on web and vice versa.

This plan assumes the endpoints in §1.1 are available. If they are not shipped yet, web tracking
work should land behind a feature flag and be exercised against a stub/mock only in tests — never
by silently substituting browser-local state.

---

## 1. Shared contract web must match exactly

### 1.1 Endpoints (same as mobile §4)

All calls go through `web/src/lib/api-client.ts:14-82` (`apiClient`), which prefixes
`/api/backend/` and retries once after a 401 refresh (`:28-63`), deliberately not hard-logging-out
guests (`:53-61`). The Next proxy (`src/app/api/backend/[...path]/route.ts:69-71, 104-107`) is what
injects `Authorization` from httpOnly cookies; web JS never sees a token.

| Method | Path | Purpose |
|---|---|---|
| `PUT` | `/api/title-tracking` | Upsert status/rating/note/progress |
| `DELETE` | `/api/title-tracking/{tmdbId}/{mediaType}` | Clear status, note, rating, progress |
| `POST` | `/api/title-tracking/batch` | Hydrate a page of cards |
| `GET` | `/api/title-tracking?status=...&page=...&pageSize=...` | Virtual Want/Watching/Watched view |

`userId` is **never** sent from web; the backend derives it from the session. Web reads
`useAuthStore(s => s.user?.userId)` only for query keys and gating.

### 1.2 Types (mirror of mobile `TitleTrackingModels.kt`)

New file: `web/src/types/title-tracking.ts`

```ts
export type ViewingStatus = "want" | "watching" | "watched";
export type TrackingMediaType = "movie" | "tv";

export interface TitleTrackingDto {
  tmdbId: number;
  mediaType: TrackingMediaType;
  status: ViewingStatus;
  rating?: number | null;       // 1..5, only with "watched"
  note?: string | null;         // private, owner-only, <= 500 chars
  lastSeason?: number | null;   // TV only, "watching" only
  lastEpisode?: number | null;  // TV only, "watching" only
  updatedAt?: number | null;
}

export interface TitleTrackingKey {
  tmdbId: number;
  mediaType: TrackingMediaType;
}

export interface TitleTrackingStatusPage {
  items: TitleTrackingDto[];
  hasMore: boolean;
  nextPage?: number | null;
}
```

Rules (identical to mobile):

- Key is `(userId, tmdbId, mediaType)`. TMDB IDs overlap movie/TV, so `mediaType` is mandatory.
- `mediaType` is normalized to lowercase `"movie"` / `"tv"` at the API boundary.
- Leaving `WATCHED` clears `rating`; `note` is retained.
- `lastSeason`/`lastEpisode` are valid only for `tv` + `watching`, both set or both null; moving
  to `want` or `watched` clears both.
- `DELETE` removes the row, note, rating, and progress; the confirmation copy must say so.
- Note text is private and never appears in feeds, shared lists, analytics, or ML.

### 1.3 Viewer fields on `PostDto` (mirror of mobile §4)

Extend `web/src/types/post.ts:1-22` with optional defaults:

```ts
trackingStatus?: ViewingStatus | null;
userRating?: number | null;
hasNote?: boolean;
trackingProgress?: string | null;   // e.g. "S2 E4", TV + watching only
```

Old payloads must still decode: all fields optional. `trackingProgress` is display-only; raw
integers come from `GET /api/title-tracking` / the batch endpoint. Never render note text from a
feed payload.

### 1.4 Behavior parity checklist

| Rule | Value |
|---|---|
| Statuses | `want`, `watching`, `watched` only |
| Rating | 1–5 whole stars, skippable, `watched` only |
| Note | ≤ 500 chars, optional, private, "Only you can see this" |
| Progress | `S2 E4` style, two manually entered positive ints, both-or-null, TV + `watching` only |
| `WATCHED` | Hard-excluded from recommendations (backend concern; web just never re-shows it in its own views) |
| `WANT` / `WATCHING` | Titles remain eligible; intent is not disinterest |
| Virtual views | Query by status; no stored "Watched list" |
| Guest | View-only; any write opens the existing signup prompt |
| Bookmark icon | Opens the track sheet; like/heart stays a separate toggle |

---

## 2. Web today (verified)

- **Stack:** Next.js 14 App Router + React 18 + TypeScript strict (`:7-19` tsconfig, `@/*` →
  `./src/*`), Tailwind 3 with CSS-variable tokens, npm. Scripts: `dev`, `build`, `start`, `lint`,
  `typecheck` (`package.json:5-11`). No unit-test runner; Playwright only
  (`playwright.config.ts:1-28`, `e2e/*.spec.ts`).
- **API boundary:** the browser calls same-origin `/api/backend/*`; the generic proxy at
  `src/app/api/backend/[...path]/route.ts:8-34, 69-129` injects
  `Authorization: Bearer <accessToken>` from httpOnly cookies, applies a CSRF origin guard on
  non-GET (`:96-99`), forwards query/body verbatim, and rejects guests with 401 unless the path is
  in a public allowlist (`:36-62, 87-94`). Tracking paths are **not** public today, so guests must
  never call them. `apiClient` (`src/lib/api-client.ts:14-82`) prefixes the path, handles one
  refresh-and-retry on 401 (`:28-63`), and calls `touchActivity()` on success (`:70-73`).
- **Auth/session:** JWTs are httpOnly cookies (`src/lib/session.ts:11-14`); localStorage holds
  only `bingewise-session` metadata (`src/stores/auth-store.ts:29-58`). Query-enabling pattern
  should include `authStatus !== "restoring"` (`src/hooks/use-feed.ts:15-20`). `userId` comes from
  `useAuthStore(s => s.user?.userId)` (`src/types/user.ts:1-11`).
- **Guest gate:** `useUiStore.getState().openSignupPrompt()`
  (`src/stores/ui-store.ts:6-11, 40-51`), used by `src/hooks/use-interactions.ts:94-129` and
  `src/app/(main)/watchlists/page.tsx:27-34`; global modal at `src/app/(main)/layout.tsx:33`.
- **Watchlists page:** `src/app/(main)/watchlists/page.tsx:13` has
  `type Tab = "discover" | "mine"`; switcher `:72-98`, body `:100-113`; guest defaults to
  Discover (`:21-25`); "New List" only on `mine` (`:61-69`); `MyListsTab` guest treatment
  `:210-226`.
- **Sheet/dialog templates:** bottom sheet `src/components/watchlist/AddToListSheet.tsx:36-42,
  66-199` (fixed overlay, `rounded-t-2xl`, `max-h-[85vh]`, Escape close); centered dialog
  `src/components/watchlist/CreateWatchlistDialog.tsx:55-143` with `maxLength` examples at
  `:84, 93-100`; confirm dialog `src/components/watchlist/WatchlistItemCard.tsx:127-161`.
- **No star input and no stepper exist today.** Only read-only TMDB score display
  (`src/components/post/RatingDisplay.tsx:24-56`); the new rating/stepper controls must be built.
- **Title detail:** shared `src/components/post/PosterDetailContent.tsx:98-178` is used by both
  `/post/[id]` and the intercepting modal `src/app/(main)/@modal/(.)post/[id]/page.tsx:9-57`;
  route param is TMDB id, `?type=movie|tv` supplies media type (`:104-115`). Existing
  `watchlistCandidate` snapshot at `:303-321` already carries `tmdbId`, `mediaType`, `title`,
  `posterPath`, `overview`, `releaseYear`. Placeholder Like/Save/Share live in
  `src/components/post/PosterActions.tsx:5-19, 54-61`.
- **Feed/bookmark surfaces:** `useInteractions().toggleSave` (`src/hooks/use-interactions.ts:113-130`)
  with optimistic pattern at `:28-83`; bookmark buttons at
  `src/components/feed/PostCard.tsx:182-188`,
  `src/components/explore/TrailerCard.tsx:223-240`,
  `src/components/feed/SingleItemContent.tsx:88`, `src/app/(main)/feed/page.tsx:102`, and
  `src/app/(main)/activity/feed/page.tsx:152`. `PostCard` links to `/post/{tmdbId}?type=...` (`:50`).
- **State/cache:** singleton React Query `QueryClient` in `src/components/providers.tsx:27-50, 206-218`
  (`staleTime 5m`, `gcTime 30m`, `retry 1`); optimistic rollback in
  `src/hooks/use-interactions.ts:52-83` and `use-watchlists.ts:57-89`; cross-view event bus
  `src/lib/watchlist-events.ts:1-36` (mirror this for tracking).
- **Types:** hand-written interfaces in `src/types/*.ts`. `PostDto` (`src/types/post.ts:1-21`) has
  no viewer fields. camelCase/snake_case aliasing is done in normalizers
  (`src/lib/watchlist-normalize.ts:14-59`), not in components; backend uses strict Jackson so
  mis-cased keys 400 (`src/lib/backend-preferences.ts:18-44`).
- **Styling/UI primitives:** `.badge*`, `.input-base`, `.btn-*`, `.card`, `.skeleton`
  (`src/app/globals.css:202-308`), tokens incl. `--star-yellow` (`:34-45`), `EmptyState`
  (`src/components/ui/empty-state.tsx:1-27`), `SectionHeader`, `Skeleton`, `cn()`
  (`src/lib/utils.ts:11-13`).
- **Analytics:** `src/lib/analytics.ts:27-98` defines `ANALYTICS_EVENTS` using the `bw_*` taxonomy
  (explicitly mirroring mobile `AnalyticsManager`); typed helpers `:218-479`; `mediaParams()`
  `:200-212` emits `post_id`, lowercased `media_type`, `tmdb_id`; consent-gated via
  `src/components/AnalyticsInitializer.tsx:13-45`.
- **Docs convention:** plans live in `docs/*.md` with a "mobile behavior → web gap → web change"
  structure (see `docs/onboarding-and-session-plan.md:1-8, 28-70`). No README/CLAUDE.md exists.

---

## 3. Mobile behavior → web gap → web change

| Mobile behavior | Web today | Web change |
|---|---|---|
| Track sheet with Want / Watching / Watched + named lists | `AddToListSheet` only adds to named lists | Upgrade it into a `TrackSheet` with the three statuses plus the existing list rows |
| Bookmark opens sheet once | Bookmark toggles `save_state` in place | Route all save/bookmark affordances through `TrackSheet`; keep `toggleSave` underneath for the legacy signal |
| Status stored account-wide by `(tmdbId, mediaType)` | No tracking types or API calls | Add `types/title-tracking.ts`, `lib/title-tracking.ts`, `hooks/use-title-tracking.ts` |
| Virtual Want/Watching/Watched views | Watchlists page has only Discover / My Lists | Add a third **Tracking** tab and a status chip row using the same API |
| Watched triggers skippable rating + private note | No star input exists; only read-only `RatingDisplay` | Add `RatingNoteDialog` (5 star buttons + `textarea maxLength={500}`) after the status commits |
| TV `S2 E4` progress | No stepper or progress UI | Add `TvProgressEditor` shown only for TV + `watching` |
| Optimistic writes with rollback | React Query `onMutate`/`onError` already used for interactions/watchlists | Mirror that pattern; invalidate feed/watchlist queries and emit a tracking event on settle |
| Identical events and privacy rules | Web uses the same `bw_*` taxonomy as mobile | Add `ANALYTICS_EVENTS` constants + typed helpers with the **same logical names** (§4.9) |
| Guest view-only | Guest prompt already centralized; proxy rejects tracking for guests | Reuse `openSignupPrompt()`; never call `/api/title-tracking` as a guest; no browser-local fallback |

---

## 4. Web implementation plan

### 4.1 Types and API boundary

New files:

- `src/types/title-tracking.ts` — §1.2, plus request/response types for PUT/DELETE/batch/page.
- `src/lib/title-tracking.ts` — typed wrapper over `apiClient`, mirroring `src/lib/watchlist.ts`:

```ts
getTracking(userId, status, page, pageSize)
batchGetTracking(keys: TitleTrackingKey[])
upsertTracking(input: TitleTrackingDto)
clearTracking(key: TitleTrackingKey)
```

- If the backend emits snake_case aliases, add `normalizeTitleTrackingDto()` in the style of
  `src/lib/watchlist-normalize.ts:14-59`. Do not handle aliases in components. Backend Jackson is
  strict (`src/lib/backend-preferences.ts:18-44`), so request keys must be exactly camelCase.

Normalize `mediaType` to lowercase at this boundary. Do not add a new fetch helper or a new Next
route handler: the generic `src/app/api/backend/[...path]/route.ts:8-34, 69-129` already supports
GET/POST/PUT/DELETE, cookie injection, and CSRF guarding. `apiClient` keeps refresh/guest handling
identical to every other web call.

### 4.2 Cache and mutations

New files:

- `src/hooks/use-title-tracking.ts`:
  - `useQuery` keys `["titleTracking", userId, status, page]` and
    `["titleTrackingTitle", userId, tmdbId, mediaType]`; enable with
    `!!userId && authStatus !== "restoring"` (`src/hooks/use-feed.ts:15-20`).
  - `useMutation` for upsert/delete with `onMutate` → cancel → snapshot → optimistic patch →
    `onError` rollback → `onSettled` invalidate. Copy `src/hooks/use-interactions.ts:28-83` and
    `src/hooks/use-watchlists.ts:57-89`.
  - On settle invalidate `["savedPosts", userId]`, feed queries, and watchlist detail queries so
    badges refresh without a manual reload.
  - `useTrackingForTitle(userId, tmdbId, mediaType)` lets the sheet and detail row share one cache
    entry. No Zustand mirror of tracking data.
- `src/lib/title-tracking-events.ts` — small listener bus mirroring
  `src/lib/watchlist-events.ts:1-36` so the detail row, Tracking tab, and feed badges stay in sync
  across surfaces without prop drilling.
- `src/stores/tracking-sheet-store.ts` (Zustand) — **UI state only**: which title's sheet is open
  and which sub-dialog (rating/note or progress) is active. Data lives in React Query.

### 4.3 Upgrade `AddToListSheet` → `TrackSheet`

Change `src/components/watchlist/AddToListSheet.tsx` (keep the filename/export as an alias for
compatibility, or rename and re-export from `src/components/tracking/TrackSheet.tsx`):

```text
TRACK "DUNE"
────────────────────────────
[ ✓ Want to watch ]   → status want
[ ✓ Watching       ]   → status watching (TV: reveal S/E row)
[ ✓ Watched        ]   → status watched
────────────────────────────
ADD TO A LIST
 [ ] Weekend picks      +
 [ ] Sci-fi             +
 [ + Create new list ]
```

- `Want to watch` → upsert `status: "want"`, call existing `toggleSave` logic underneath,
  toast *"Added to Want to watch"*.
- `Watching` → upsert `status: "watching"`; for `mediaType === "tv"` reveal the progress row.
- `Watched` → upsert `status: "watched"`, clears progress server-side, then open
  `RatingNoteDialog`. Status commits first; skipping the dialog never undoes `WATCHED`.
- Named-list rows keep existing behavior; they set `want` only when no status exists.
- Existing status promotes the next action (`want` → Watching/Watched; `watching` → `+1` /
  Watched / Edit progress; `watched` → Edit rating / note).
- **Clear status** uses `DELETE` with a confirmation that mentions note + progress removal.

Update the render site at `src/components/post/PosterDetailContent.tsx:596-606`.

### 4.4 `RatingNoteDialog`

New file: `src/components/tracking/RatingNoteDialog.tsx`, adapted from the centered-dialog markup
in `src/components/watchlist/CreateWatchlistDialog.tsx:55-143`.

- New 1–5 star input using lucide `Star` and the `--star-yellow` token; no star input exists today
  (`RatingDisplay.tsx:24-56` is read-only).
- Optional `<textarea className="input-base min-h-[70px] resize-none" maxLength={500}>` with a
  live 500-char counter.
- Copy *"Only you can see this"*; **Save** / **Skip**.
- `react-hook-form` + `zod` (already dependencies) enforce `1..5` and `max(500)`.
- Reopenable from the detail page status row and the Tracking tab.
- On save: upsert with `rating` + `note`; on skip: no extra call (status already committed).

### 4.5 `TvProgressEditor`

New file: `src/components/tracking/TvProgressEditor.tsx` — TV + `watching` only.

```text
Progress:  S [ 2 ]  E [ 4 ]    [+1]   [Edit]
```

- Two number inputs/steppers with positive-integer validation, both-or-null.
- `[+1]` increments `lastEpisode`; it does not auto-cross seasons — the user edits season.
- No episode titles, no TMDB episode fetch, no total-episode count, no percentage, no specials.
- Emits an upsert with `lastSeason`/`lastEpisode`; clearing both sets them to `null`.
- Display helper `formatTrackingProgress(dto): string | null` in `src/lib/title-tracking.ts`
  returns `"S2 E4"` only when `mediaType === "tv" && status === "watching"` and both ints are
  present. Web must not reformat or localize this string — parity depends on it.

### 4.6 Tracking tab

Change `src/app/(main)/watchlists/page.tsx`:

- `type Tab = "discover" | "mine" | "tracking"` (`:13`).
- Guest default stays `discover` (`:21-25`); a guest clicking Tracking sees the existing
  `MyListsTab`-style guest treatment / `openSignupPrompt()` (`:210-226`) and no tracking request.
- Add a third tab button in the switcher (`:72-98`) with a `ListChecks`/`Clapperboard` icon and the
  same `cn(...)` active/inactive classes.
- **New List** remains only on `mine` (`:61-69`). Also avoid calling `usePublicWatchlists` while
  Tracking is active (`:25`).
- New file `src/components/tracking/TrackingTab.tsx`:
  - status chips `[ Want (n) ] [ Watching (n) ] [ Watched (n) ]`, default `watching` (mobile §5.5),
    styled with `.badge*` / `cn()` from `src/lib/utils.ts:11-13`.
  - calls `getTracking(userId, status, page, pageSize)`; responsive grid
    `grid-cols-1 sm:grid-cols-2` like the existing watchlist grids
    (`watchlists/page.tsx:148, 173, 250`).
  - new `src/components/tracking/TrackingTitleCard.tsx` adapts `WatchlistItemCard`'s presentational
    structure but drops reorder/remove props; link to `/post/{tmdbId}?type={mediaType}`.
  - resolve posters/titles from the batch endpoint or `PostDto` viewer fields — never per-card
    TMDB requests. Use `EmptyState` (`src/components/ui/empty-state.tsx:1-27`) and `Skeleton` for
    loading.
  - `WATCHING` TV cards show the `S2 E4` chip; tap chip → `TvProgressEditor`, tap card → detail,
    overflow → `TrackSheet`.
  - No Share/Clone/Collaborators/Reorder actions; this view is derived.
  - Sorting: `want`/`watching` by `updatedAt` desc; `watched` by `updatedAt` desc, rating desc.
  - Empty states match mobile verbatim:
    - Want: "Tap the bookmark on any title to add it here."
    - Watching: "Nothing in progress. Pick something from Want to watch."
    - Watched: "Finished titles will show up here."

### 4.7 Entry points

| File | Change |
|---|---|
| `src/hooks/use-interactions.ts:113-130` | Keep `toggleSave` as the underlying legacy signal; wire `TrackSheet` at call sites rather than changing the hook contract |
| `src/components/feed/PostCard.tsx:182-188` | Bookmark button opens `TrackSheet`; render viewer-only status badge |
| `src/components/feed/FeedList.tsx:17-41, 83-94` | Pass the new track handler through to `PostCard` |
| `src/components/explore/TrailerCard.tsx:223-240` | Same bookmark → `TrackSheet` behavior |
| `src/components/feed/SingleItemContent.tsx:81-94`, `src/app/(main)/feed/page.tsx:95-106`, `src/app/(main)/activity/feed/page.tsx:152` | Wire `onTrack` + guest gate |
| `src/components/post/PosterActions.tsx:5-19, 54-61` | Replace placeholder Save/Add-to-Watchlist action with `TrackSheet`; keep Like separate |
| `src/components/post/PosterDetailContent.tsx:287-321, 421-427, 505-518, 596-606` | Use `watchlistCandidate` as the tracking key source; add status/rating/note row and `S2 E4 [+1] [Edit]` when `watching` |
| `src/components/watchlist/WatchlistItemCard.tsx:74-115` | Add viewer-only status badge + `S2 E4` chip; never show them for other users' lists |
| `src/types/post.ts:1-21` | Add the four optional viewer fields from §1.3 |

Like/heart remains a separate `toggleLike` action.

### 4.8 Guest and ownership

- Every mutation entry point checks `useAuthStore.getState().user`; guests call
  `useUiStore.getState().openSignupPrompt()` and make **no** request. This mirrors
  `src/hooks/use-interactions.ts:94-129` and `src/app/(main)/watchlists/page.tsx:27-34`.
- The backend proxy rejects guests for non-public paths
  (`src/app/api/backend/[...path]/route.ts:36-62, 87-94`), and tracking is not allowlisted. A
  guest request would be a 401, not a useful empty state — so gate before the call.
- Never send a `userId` in a tracking request body; the proxy injects the JWT-derived identity.
- Badges and notes from public/collaborative lists are rendered only when the item belongs to the
  signed-in viewer. The tracking batch call is scoped by the session anyway.

### 4.9 Analytics parity

Add constants to `ANALYTICS_EVENTS` (`src/lib/analytics.ts:27-98`) with the repo's `bw_` prefix,
plus typed helpers in the `analytics` object (`:218-479`). Use `mediaParams()` (`:200-212`) for
`post_id`, lowercased `media_type`, and `tmdb_id`.

```text
TRACK_SHEET_OPENED     → bw_track_sheet_opened
TITLE_STATUS_SET       → bw_title_status_set       // status value allowed
TITLE_RATING_SET       → bw_title_rating_set       // bucket only
TITLE_NOTE_SAVED       → bw_title_note_saved       // length bucket only
TV_PROGRESS_SAVED      → bw_tv_progress_saved      // season/episode bucket only
TRACKING_TAB_VIEWED    → bw_tracking_tab_viewed    // status subview only
```

Never log note text, raw titles, or tmdb ids in a way mobile does not. `logEvent` already truncates
string values to 100 chars (`:24-25, 169-185`); do not rely on truncation for privacy. Existing
consent gating in `src/components/AnalyticsInitializer.tsx:13-45` applies unchanged.

### 4.10 Tests

- No unit-test runner exists; add one only if the repo adopts one. Primary coverage is Playwright
  (`playwright.config.ts:1-28`, `testDir: ./e2e`, chromium, `webServer: npm run dev`):
  - new `e2e/title-tracking.spec.ts` following `e2e/onboarding-session.spec.ts:4-168` conventions
    (inline fixtures, `page.addInitScript` storage seeding at `:104-114`, cookie seeding at
    `:331-339`, `page.route("**/api/...", route => route.fulfill(...))` API mocking at `:116-168`,
    payload capture at `:478-545`):
    - set `want` → appears in Want view on a fresh page load (proves server round-trip, no local state)
    - set `watching` on a TV title → `S2 E4` persists after reload; `+1` → `S2 E5`
    - set `watched` → rating/note prompt; skip keeps `watched`; note ≤ 500 chars
    - clear status → row and note/progress gone; title eligible again
    - guest taps bookmark → signup prompt, no `/api/title-tracking` request (assert network)
    - optimistic rollback on a mocked 500 from `PUT /api/title-tracking`
    - same title via mobile API call appears in web Tracking view (contract parity check)
  - Mock `**/api/backend/api/title-tracking*` and `**/api/backend/api/interactions/save`; assert the
    PUT body uses exactly camelCase keys (strict Jackson) and no `userId` or note text leaks into
    analytics payloads.
  - `npm run typecheck` and `npm run lint` must pass; extend Playwright only, no test-framework churn.

---

## 5. Parity matrix (mobile → web)

| Mobile (`TRACKING_NOTES_PLAN.md`) | Web (`docs/title-tracking-web-plan.md`) |
|---|---|
| `TitleTrackingModels.kt` | `src/types/title-tracking.ts` |
| `TitleTrackingApi.kt` | `src/lib/title-tracking.ts` (over `src/lib/api-client.ts` + generic proxy) |
| `TitleTrackingRepository` / `TitleTrackingViewModel` | `src/hooks/use-title-tracking.ts` + `src/lib/title-tracking-events.ts` + `src/stores/tracking-sheet-store.ts` |
| `AddToListBottomSheet.kt` | `src/components/watchlist/AddToListSheet.tsx` → `src/components/tracking/TrackSheet.tsx` |
| `PosterDetailScreen.kt` status/progress row | `src/components/post/PosterDetailContent.tsx:287-321, 596-606` |
| rating/note sheet | `src/components/tracking/RatingNoteDialog.tsx` |
| TV progress editor | `src/components/tracking/TvProgressEditor.tsx` + `src/lib/title-tracking.ts` |
| `MyWatchlistsScreen.kt` Tracking tab | `src/app/(main)/watchlists/page.tsx` + `src/components/tracking/TrackingTab.tsx` |
| `WatchlistItemCard` badge | `src/components/watchlist/WatchlistItemCard.tsx` / `src/components/tracking/TrackingTitleCard.tsx` |
| `PostDto` viewer fields | `src/types/post.ts` |
| `AnalyticsManager` events | `src/lib/analytics.ts` (`bw_*` constants + helpers) |
| `WatchlistDetailViewModel` optimistic rollback | `src/hooks/use-interactions.ts:28-83` / `use-watchlists.ts:57-89` pattern |

**Parity gate for release:** run the same user journey on mobile and web and compare the JSON
payloads for PUT/DELETE, the rendered status/progress strings, the guest behavior, and the
analytics event names. Any difference is a bug in one of the two clients, not a platform nuance.

---

## 6. Sequencing

| Milestone | Scope | Effort |
|---|---|---|
| W0 | Confirm backend endpoints from the mobile plan are scheduled; add a `NEXT_PUBLIC_TITLE_TRACKING` flag using the `src/lib/session.ts:24-30` convention | 0.5 day |
| W1 | Types, normalizer, API wrapper, React Query hooks, event bus, sheet store | 1–1.5 days |
| W2 | `TrackSheet`, `RatingNoteDialog`, `TvProgressEditor` | 2 days |
| W3 | Tracking tab, card badges, feed/detail entry points | 2 days |
| W4 | Analytics, Playwright parity suite, cross-client verification | 1–2 days |

W0 must not be skipped: without the shared endpoints there is no parity, only a browser-local
imitation. W2/W3 can proceed with mocked API responses in tests but must not ship unflagged.

---

## 7. Guardrails / anti-divergence

- No localStorage, IndexedDB, cookie, or Zustand persistence of tracking data. React Query cache
  is a cache, not a source of truth.
- No web-only status values, rating scales, note lengths, or progress rules.
- No episode database, episode titles, percentages, or air-date notifications on web either.
- No note text in DOM attributes, analytics, URLs, or feed payloads.
- No private status/progress shown on another user's public watchlist.
- No change to the like/heart toggle; bookmark is the only repurposed affordance.
- Do not add a per-card network request; use the batch endpoint or `PostDto` viewer fields.
- Do not introduce a second API client. All tracking calls use `apiClient`.
- If the web needs a contract change, update `mobile/TRACKING_NOTES_PLAN.md` first.

---

## 8. Open dependencies on the cross-repo plan

1. Endpoint shapes and pagination response (`TitleTrackingStatusPage`) must be confirmed against
   the backend DTOs before W1, including exact camelCase keys — the backend uses strict Jackson and
   mis-cased keys return 400.
2. Whether `PostDto` viewer fields are hydrated on **all** feed surfaces (feed, preview, vibe,
   rescore, degraded) determines whether web can avoid extra batch calls; the mobile plan lists
   the hydration points.
3. `trackingProgress` format is fixed as `S{season} E{episode}`; web must not localize or reformat
   it, or parity breaks.
4. Rate limits (`interactions` 30/min for writes, `read` 200/min for reads) are enforced by the
   backend; web should avoid batching more than a viewport of cards per request.
5. If the backend ships the compat flag for named-watchlist hard exclusion, web behavior is
   unchanged — that is a ranking concern, not a client concern.
6. If the backend ever wants guest-readable tracking views, the generic proxy's public-path
   allowlist (`src/app/api/backend/[...path]/route.ts:36-62`) must change in a separate backend
   plan. This web plan keeps tracking account-only.
