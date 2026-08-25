# BingeWise Ad Revenue Strategy

Maximize revenue across mobile (KMP: Android + iOS) and web (Next.js), ordered by
setup simplicity. Each item is tagged:

- **[CODE]** — implementation work in this repo (mobile app / web app / REST-API)
- **[SETUP]** — console/account configuration, no partnerships
- **[PARTNER]** — external applications, approvals, or business relationships

Current state this builds on:
- Mobile: AdMob native ads (home + trailer feed), rewarded gate on story-card
  regeneration (3 free/session, +5 per rewarded view). **Test ad unit IDs still
  configured — real units must be created before launch.**
- Web: no ads yet; Next.js explore feed + detail pages.
- Analytics: Firebase `bw_*` events live on both platforms (auth, trailer engagement,
  watchlist/story/reward funnel) — use these to validate every step below.
- ML: view-duration data already feeds the backend recommendation pipeline.

---

## Tier 1 — Days. Do first (pure code/console, zero approvals)

### 1.1 [SETUP + CODE] Real AdMob ad units (mobile)
Create production native + rewarded units in the AdMob console for both apps, then fill
`REAL_REWARDED_AD_UNIT` in `AdPlatformConfig.android.kt` / `.ios.kt` and the home/trailer
native unit IDs in `AdConfig`. App IDs are already real. Test with the Google test IDs,
flip at release. **No launch without this — test IDs earn $0.**

### 1.2 [CODE] More native placements on mobile (highest-value inventory)
Natives are your best mobile eCPM ($2–8 US vs $0.5–2 banners). Add placements to:
- Explore feed interstitial cards (already have "trailer" placement — tune density)
- Watchlist detail bottom ("More like this" area)
- Media detail screen footer
Reuse `NativeAdManager` — each new placement is a named instance + a composable slot.
Track with `bw_ad_impression(placement)` which is already wired.

### 1.3 [CODE] Rewarded-ad expansion (mobile)
The story-card gate proves rewarded UX works (funnel instrumented: `bw_reward_ad_shown`
→ `bw_reward_earned` → `bw_story_regen_rewarded`). Add rewarded unlocks for:
- Extra AI/processing features or faster processing queue position
- Premium card variants locked behind one ad view
- "Boost" a post/list visibility if that feature exists
Rewarded eCPMs run $10–40 US — one engaged user watching 2 ads/day ≫ all display revenue.

### 1.4 [SETUP] AdMob settings hygiene
Enable paid-eCPM reporting in AdMob, set ad content rating, verify UMP consent message
is published for EEA (ConsentManager already integrates UMP).

---

## Tier 2 — Weeks. Web foundation + affiliate start

### 2.1 [CODE + SETUP] Web consent + AdSense base (web)
Prerequisite for ALL web monetization:
1. Privacy policy, terms, about/contact pages (AdSense requires them)
2. Google certified CMP via **Funding Choices** (free) → TCF consent string; wire the
   CMP script in `next.config.mjs`/_document, gate personalized ads on consent state
3. AdSense site verification snippet + auto/display units between feed items and on
   detail pages
Web display RPMs are modest ($1–5), but it's passive once set up.

### 2.2 [PARTNER] JustWatch affiliate (biggest non-ads web/mobile lever)
Apply to the JustWatch affiliate program. Once approved:
- Streaming-provider buttons ("Watch on Netflix") across web AND mobile become
  affiliate deep links
- Pays per click/signup; movie/TV intent traffic converts well
- Code change is small (link builder + tracking param), the wait is approval
Fallback/complement: TMDB watch-provider links you already show can carry it.

### 2.3 [CODE] Affiliate link infrastructure (both platforms)
Central link-builder util (utm + affiliate ID params), click tracking event
(`bw_affiliate_click(provider)`) added to AnalyticsManager taxonomy. Build now so every
future partner is config-only.

---

## Tier 3 — 1–2 months. Scale display + more partners

### 3.1 [PARTNER] Amazon Associates
Entertainment-adjacent conversions (hardware, Prime signups). 3-sale approval threshold;
low effort once 2.3's link infra exists.

### 3.2 [SETUP + CODE] Google Ad Manager (GAM) replacing plain AdSense
When web traffic is meaningful (~100k pageviews/mo): GAM gives direct line-item control,
floor pricing, and header bidding readiness. GPT tag swap where AdSense tags were.

### 3.3 [CODE] Interstitials on mobile (careful, natural breaks only)
Between processing-completion → results screen, or after N list actions. Never mid-feed.
Instrument close-rate; kill if session length drops (`bw_session_*` events).

### 3.4 [PARTNER] Second mediation source for mobile rewarded/native
Add Meta Audience Network or Unity Ads as AdMob mediation networks (console setup +
adapter SDK deps per platform). Competition lifts rewarded eCPM 20–50%.

---

## Tier 4 — Quarter+. Requires scale or bigger lifts

### 4.1 [CODE] IMA SDK video ads on web feed (web)
Once web has a YouTube-style trailer feed, pre-roll/mid-roll via IMA SDK mirrors the
mobile experience. Needs sales-worthy volume first.

### 4.2 [PARTNER] Native ad networks on web (MGID early, Taboola/Outbrain at ~500k visits/mo)

### 4.3 [PARTNER] Direct sponsorships / newsletter deals
Needs audience numbers; keep an impressions deck updated from Firebase/GA4.

### 4.4 [CODE + PARTNER] Premium ad-free tier (IAP/subscription)
Hybrid model: heavy users pay to remove ads; ads remain for free users. Requires
entitlement checks server-side (REST-API user subscription tables exist already).

---

## Measurement loop (all tiers)

| Metric | Source | Target signal |
|---|---|---|
| Reward funnel conversion | `bw_reward_*`, `bw_story_*` | >60% earned/shown on gate |
| Ad load health | `bw_ad_load_success/failure` | <10% failure per placement |
| Engagement feeds rec quality | view-duration API → ML | session/recall growth |
| eCPM by placement | AdMob reports | prune bottom placements |
| Affiliate CTR | `bw_affiliate_click` + partner dashboard | provider-button CTR |

Rule of thumb ordering: rewarded > native > interstitial > banner on mobile;
affiliate (intent-matched) > display > native widgets on web.

## Explicit dependency notes
- Nothing in Tier 1 blocks anything else — do all four in parallel.
- 2.1 blocks all other web monetization (consent is legally required for EEA traffic).
- 2.3 should land before any affiliate approval arrives (2.2, 3.1).
- Mediation (3.4) only after real-unit eCPM baseline exists (1.1 + 2 weeks of data).
