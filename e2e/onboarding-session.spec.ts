import { test, expect, type Page } from "@playwright/test";
import { buildBackendPreferences } from "../src/app/api/recommendations/preview/route";

const user = {
  id: 777,
  username: "tester",
  email: "tester@example.com",
  name: "Tester",
  language: "en",
  region: "US",
  roles: [],
  needsSetup: true,
};

const authResponse = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user,
};

const session = {
  user: {
    userId: 777,
    name: "Tester",
    username: "tester",
    email: "tester@example.com",
    isPrivate: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  tokenExpiresAt: Date.now() + 900_000,
  loginTimestamp: Date.now(),
  lastActivityAt: Date.now(),
};

const post = {
  postId: 1,
  tmdbId: 101,
  type: "movie",
  title: "Preview One",
  releaseDate: "2024-01-01",
  overview: "A preview title",
  posterPath: null,
  voteAverage: 8.1,
  voteCount: 100,
  originalLanguage: "en",
  originalTitle: "Preview One",
  popularity: 10,
  genreIds: "28,878",
  postLikeCount: 0,
  trailerLikeCount: 0,
  videoKey: "",
  providerIds: [],
  runtime: 100,
  contentRating: "PG-13",
};

function onboardingState(overrides: Record<string, unknown> = {}) {
  return {
    state: {
      schemaVersion: 2,
      userId: 0,
      lastStep: null,
      language: "en",
      region: "US",
      contentLanguagePreference: "ANY",
      minMovieDuration: 0,
      maxMovieDuration: 300,
      minTvDuration: 0,
      maxTvDuration: 90,
      oldestDate: "",
      recentDate: "",
      preferredGenres: [],
      avoidedGenres: [],
      genreNames: {},
      selectedProviders: [],
      selectedProvidersDetails: [],
      contentRating: 99,
      notificationsEnabled: true,
      repliesEnabled: true,
      followRequestsEnabled: true,
      messagesEnabled: true,
      releasesEnabled: true,
      sequelsEnabled: true,
      generalEnabled: true,
      subscriptionsEnabled: true,
      streamingEnabled: true,
      isPrivateAccount: false,
      vibeDeckProgress: null,
      vibeLikedGenres: [],
      vibeSoftAvoidedGenres: [],
      vibeExcludedTmdbIds: [],
      orderedSelectedProviders: [],
      orderedSelectedGenres: [],
      orderedAvoidedGenres: [],
      completedSteps: [],
      ...overrides,
    },
    version: 2,
  };
}

async function seedStorage(page: Page, overrides: Record<string, unknown> = {}, withSession = false) {
  await page.addInitScript(
    ({ onboarding, sessionData }) => {
      localStorage.setItem("bingewise-onboarding", JSON.stringify(onboarding));
      if (sessionData) {
        localStorage.setItem("bingewise-session", JSON.stringify(sessionData));
      }
    },
    { onboarding: onboardingState(overrides), sessionData: withSession ? session : null }
  );
}

async function mockApi(page: Page, refreshStatus = 200) {
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: refreshStatus,
      contentType: "application/json",
      body: JSON.stringify(refreshStatus === 200 ? authResponse : { message: "Unauthorized" }),
    })
  );
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await page.route("**/api/providers/top*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { provider_id: 8, provider_name: "Netflix", logo_path: null, display_priority: 10 },
        { provider_id: 15, provider_name: "Hulu", logo_path: null, display_priority: 20 },
        { provider_id: 337, provider_name: "Disney+", logo_path: null, display_priority: 30 },
      ]),
    })
  );
  await page.route("**/api/providers/filter*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { provider_id: 531, provider_name: "Paramount+", logo_path: null, display_priority: 80 },
      ]),
    })
  );
  await page.route("**/api/recommendations/preview*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([post]) })
  );
  await page.route("**/api/backend/api/recommendations/guest*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([post]) })
  );
  await page.route("**/api/backend/api/posts/vibe-slate", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([post]) })
  );
  await page.route("**/api/backend/api/posts/recommendations/preview*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([post]) })
  );
  await page.route("**/api/users/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await page.route("**/api/notifications/**", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "Not found" }) })
  );
  await page.route("**/complete-setup", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "Not found" }) })
  );
}

test("fresh visitor enters onboarding; first-visit marker prevents re-entry redirect", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: /Stop scrolling/i })).toBeVisible();
  expect(await page.locator(".welcome-polaroid").count()).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Skip setup" }).click();
  // Guests cannot skip into the feed; the required account/OAuth prompt opens instead.
  const dialog = page.getByRole("dialog", { name: "Create a free account" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Continue with Apple/ })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Create account with email" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
});

test("required signup prompt opens the full email registration page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Skip setup" }).click();

  const dialog = page.getByRole("dialog", { name: "Create a free account" });
  await dialog.getByRole("link", { name: "Create account with email" }).click();

  await expect(page).toHaveURL(/\/auth\/register\?.*signup=prompt/);
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByLabel("Full Name")).toBeVisible();
});

test("guest cannot finish setup without creating an account", async ({ page }) => {
  await mockApi(page, 401);
  await seedStorage(page, {
    completedSteps: [
      "welcome",
      "region-language",
      "content-rating",
      "streaming-services",
      "stay-connected",
      "vibe-check",
      "taste-calibration",
      "recommended-for-you",
    ],
  });

  await page.goto("/onboarding/recommended-for-you");
  await page.getByRole("button", { name: /Finish Setup/ }).click();

  const dialog = page.getByRole("dialog", { name: "Create a free account" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Continue with Apple/ })).toBeVisible();
  await expect(page).toHaveURL(/\/onboarding\/recommended-for-you/);
});

test("login create-account link opens onboarding welcome", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/onboarding(\?|$)/);
  await expect(page.getByRole("heading", { name: /Stop scrolling/i })).toBeVisible();
});

test("signed-in users are redirected away from onboarding", async ({ page }) => {
  await mockApi(page);
  await page.context().addCookies([
    { name: "accessToken", value: "access-token", url: "http://localhost:3000" },
  ]);

  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/feed/);
});

test("deep links skip the first-visit onboarding redirect", async ({ page }) => {
  await page.goto("/?invite=abc123&watchlistId=42");
  await expect(page).toHaveURL(/invite=abc123/);
  await expect(page).not.toHaveURL(/\/onboarding/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("bw-first-visit-complete")))
    .toBe("1");
});

test("post deep links skip the first-visit onboarding redirect", async ({ page }) => {
  await mockApi(page, 401);

  await page.goto("/post/101?type=movie");
  await expect(page).toHaveURL(/\/post\/101/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("bw-first-visit-complete")))
    .toBe("1");

  await page.evaluate(() => localStorage.removeItem("bw-first-visit-complete"));
  await page.goto("/activity/item/123");
  await expect(page).toHaveURL(/\/activity\/item\/123/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("bw-first-visit-complete")))
    .toBe("1");

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
});

test("guest and from params no longer bypass first-visit onboarding", async ({ page }) => {
  await page.goto("/?guest=1");
  await expect(page).toHaveURL(/\/onboarding$/);
  expect(
    await page.evaluate(() => localStorage.getItem("bw-first-visit-complete"))
  ).toBe("1");

  await page.evaluate(() => localStorage.removeItem("bw-first-visit-complete"));
  await page.goto("/?from=/feed");
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("login screen has no guest bypass", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("link", { name: /Continue as Guest/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
});

test("home guest CTA starts onboarding instead of skipping to the feed", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("bw-first-visit-complete", "1"));
  await mockApi(page, 401);
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "Personalize Your Feed" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("guest with saved onboarding progress sees a resume banner on the feed", async ({ page }) => {
  await mockApi(page, 401);
  await seedStorage(page, {
    completedSteps: ["welcome", "region-language", "content-rating"],
    lastStep: "content-rating",
  });

  await page.goto("/feed");
  await expect(page.getByText(/from a personalized feed/)).toBeVisible();
  await page.getByRole("link", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/onboarding\/streaming$/);
});

test("recommendation preview shows poster skeletons while loading", async ({ page }) => {
  await mockApi(page, 401);
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/backend/api/posts/recommendations/preview*", async (route) => {
    await pending;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([post]),
    });
  });

  await page.goto("/onboarding/recommended-for-you");
  await expect(
    page.locator('[aria-label="Loading your recommendations"] .skeleton').first()
  ).toBeVisible();
  release();
  await expect(page.getByText("Preview One")).toBeVisible();
});

test("preview route forwards every backend preference field with correct casing", () => {
  expect(
    buildBackendPreferences({
      userId: 777,
      language: "fr",
      region: "FR",
      minMovie: 30,
      maxMovie: 120,
      minTV: 10,
      maxTV: 45,
      oldestDate: "1990-01-01",
      recentDate: "2025-06-15",
      isPrivate: true,
      contentRatingAge: 13,
      contentLanguagePreference: "ONLY_SELECTED",
      subscriptions: [8],
      genreIds: [28, 878],
      avoidGenreIds: [18],
      softAvoidGenreIds: [35],
      excludedTmdbIds: [999],
      // Client-only/mis-cased keys must never reach the strict backend mapper.
      vibeSoftAvoidedGenres: [35],
      minTv: 10,
    })
  ).toEqual({
    userId: 777,
    language: "fr",
    region: "FR",
    minMovie: 30,
    maxMovie: 120,
    minTV: 10,
    maxTV: 45,
    oldestDate: "1990-01-01",
    recentDate: "2025-06-15",
    isPrivate: true,
    contentRatingAge: 13,
    contentLanguagePreference: "ONLY_SELECTED",
    subscriptions: [8],
    genreIds: [28, 878],
    avoidGenreIds: [18],
    softAvoidGenreIds: [35],
    excludedTmdbIds: [999],
  });
});

test("signed-in preview sends the full backend preference DTO", async ({ page }) => {
  let previewPayload: Record<string, unknown> | null = null;
  await mockApi(page);
  await page.route("**/api/recommendations/preview*", (route) => {
    previewPayload = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([post]),
    });
  });
  await seedStorage(
    page,
    {
      userId: 0,
      language: "fr-FR",
      region: "FR",
      minMovieDuration: 30,
      maxMovieDuration: 120,
      minTvDuration: 10,
      maxTvDuration: 45,
      oldestDate: "1990-01-01",
      recentDate: "2025-06-15",
      contentRating: 13,
      contentLanguagePreference: "ONLY_SELECTED",
      selectedProviders: [8],
      preferredGenres: [28],
      avoidedGenres: [18],
      vibeLikedGenres: [878],
      // Vibe rejects must arrive as softAvoidGenreIds, not avoidGenreIds.
      vibeSoftAvoidedGenres: [35],
      vibeExcludedTmdbIds: [999],
      isPrivateAccount: true,
    },
    true
  );

  // The middleware redirects any document request with an accessToken cookie
  // away from /onboarding, so load the page first and add the cookie afterwards.
  await page.goto("/onboarding/recommended-for-you");
  await page.context().addCookies([
    { name: "accessToken", value: "access-token", url: "http://localhost:3000" },
  ]);
  await expect(page.getByText("Preview One")).toBeVisible();

  expect(previewPayload).toMatchObject({
    userId: 777,
    language: "fr",
    region: "FR",
    minMovie: 30,
    maxMovie: 120,
    minTV: 10,
    maxTV: 45,
    oldestDate: "1990-01-01",
    recentDate: "2025-06-15",
    isPrivate: true,
    contentRatingAge: 13,
    contentLanguagePreference: "ONLY_SELECTED",
    subscriptions: [8],
    genreIds: [28, 878],
    avoidGenreIds: [18],
    softAvoidGenreIds: [35],
    excludedTmdbIds: [999],
  });
  expect(previewPayload).not.toHaveProperty("minTv");
  expect(previewPayload).not.toHaveProperty("maxTv");
  expect(previewPayload).not.toHaveProperty("vibeSoftAvoidedGenres");
});

test("partial progress resumes at the next incomplete step after reload", async ({ page }) => {
  await mockApi(page);
  await seedStorage(
    page,
    {
      userId: 0,
      completedSteps: ["welcome", "region-language"],
      lastStep: "region-language",
    }
  );

  await page.goto("/onboarding");
  await page.getByRole("button", { name: /Resume Setup/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/ratings$/);
  await expect(page.getByRole("heading", { name: "Content Rating" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Content Rating" })).toBeVisible();
});

test("interrupted vibe check resumes to the vibe screen, not the next step", async ({ page }) => {
  await mockApi(page);
  await seedStorage(
    page,
    {
      userId: 0,
      completedSteps: [
        "welcome",
        "region-language",
        "content-rating",
        "streaming-services",
        "stay-connected",
      ],
      lastStep: "vibe-check",
    }
  );

  await page.goto("/onboarding");
  await page.getByRole("button", { name: /Resume Setup/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/vibe-check$/);
});

test("guest vibe check posts mobile-shaped vibe-slate preferences", async ({ page }) => {
  let payload: Record<string, any> | null = null;
  await mockApi(page);
  await page.route("**/api/backend/api/posts/vibe-slate", (route) => {
    payload = route.request().postDataJSON() as Record<string, any>;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([post]),
    });
  });
  await seedStorage(page, {
    userId: 0,
    vibeExcludedTmdbIds: [999],
    contentRating: 13,
    selectedProviders: [8],
    preferredGenres: [28],
    avoidedGenres: [18],
    vibeSoftAvoidedGenres: [35],
    contentLanguagePreference: "ONLY_SELECTED",
  });

  await page.goto("/onboarding/vibe-check");
  await expect(page.getByRole("heading", { name: "Vibe Check" })).toBeVisible();

  expect(payload).toMatchObject({
    limit: 48,
    excludedTmdbIds: [999],
    preferences: {
      userId: 0,
      language: "en",
      region: "US",
      contentRatingAge: 13,
      contentLanguagePreference: "ONLY_SELECTED",
      subscriptions: [8],
      genreIds: [28],
      avoidGenreIds: [18],
      // Vibe rejects stay soft; they must not move into avoidGenreIds.
      softAvoidGenreIds: [35],
      excludedTmdbIds: [999],
    },
  });
});

test("create account after guest setup saves the exact backend payload and lands on feed", async ({ page }) => {
  let profileSaved = false;
  let profilePayload: Record<string, unknown> | null = null;
  const removedEndpointCalls: string[] = [];
  await mockApi(page);
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authResponse),
    })
  );
  await page.route("**/api/users/777", (route) => {
    if (route.request().method() === "PUT") {
      profileSaved = true;
      profilePayload = route.request().postDataJSON() as Record<string, unknown>;
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
  await page.route("**/api/notifications/777/settings", (route) => {
    removedEndpointCalls.push(route.request().url());
    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
  await page.route("**/complete-setup", (route) => {
    removedEndpointCalls.push(route.request().url());
    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
  await seedStorage(page, {
    userId: 0,
    language: "fr-FR",
    region: "FR",
    minMovieDuration: 30,
    maxMovieDuration: 300,
    minTvDuration: 10,
    maxTvDuration: 90,
    oldestDate: "1990-01-01",
    recentDate: "2025-06-15",
    contentRating: 13,
    contentLanguagePreference: "PREFER_SELECTED",
    selectedProviders: [8],
    preferredGenres: [28],
    avoidedGenres: [18],
    vibeLikedGenres: [878],
    // 18 is already a hard avoid and must not be duplicated as soft.
    vibeSoftAvoidedGenres: [35, 18],
    vibeExcludedTmdbIds: [999, 999],
    notificationsEnabled: false,
    isPrivateAccount: true,
    completedSteps: [
      "welcome",
      "region-language",
      "content-rating",
      "streaming-services",
      "stay-connected",
      "vibe-check",
      "taste-calibration",
      "recommended-for-you",
    ],
  });

  await page.goto("/auth/register?from=/onboarding/recommended-for-you");
  await page.getByLabel("Full Name").fill("Tester");
  await page.getByLabel("Username").fill("tester");
  await page.getByLabel("Email").fill("tester@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /Create Account|Sign Up|Register/i }).click();

  await expect(page).toHaveURL(/\/feed/);
  expect(profileSaved).toBe(true);
  // Exact match: no extra/mis-cased keys are accepted by the strict backend
  // ObjectMapper, and no value may be dropped or moved into the wrong field.
  expect(profilePayload).toEqual({
    language: "fr",
    region: "FR",
    // The backend treats null as "no change", so unbounded sentinels are sent
    // explicitly rather than dropped.
    minMovie: 30,
    maxMovie: 300,
    minTV: 10,
    maxTV: 90,
    oldestDate: "1990-01-01",
    recentDate: "2025-06-15",
    isPrivate: true,
    contentRatingAge: 13,
    contentLanguagePreference: "PREFER_SELECTED",
    subscriptions: [8],
    genres: [28, 878],
    avoidGenres: [18],
    softAvoidGenreIds: [35],
    excludedTmdbIds: [999],
  });
  // These endpoints do not exist on the backend; no request should be made.
  expect(removedEndpointCalls).toEqual([]);
  const localNotifications = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bingewise-notification-preferences") ?? "{}")
  );
  expect(localNotifications["777"]).toEqual({ masterEnabled: false });
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bingewise-onboarding") ?? "{}")
  );
  expect(stored.state?.completedSteps ?? []).toEqual([]);
});

test("email sign-up from a shared link still lands on the app home", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authResponse),
    })
  );

  await page.goto("/auth/register?from=/post/101&signup=prompt");
  await page.getByLabel("Full Name").fill("Tester");
  await page.getByLabel("Username").fill("tester");
  await page.getByLabel("Email").fill("tester@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /Create Account|Sign Up|Register/i }).click();

  await expect(page).toHaveURL(/\/feed$/);
});

test("fresh create account redirects guests to onboarding before account fields", async ({ page }) => {
  await mockApi(page);

  await page.goto("/auth/register?from=/feed");
  await expect(page).toHaveURL(/\/onboarding\?.*fresh=1/);
  await expect(page.getByRole("heading", { name: /Stop scrolling/i })).toBeVisible();
  await expect(page.getByLabel("Full Name")).toHaveCount(0);
});

test("create account shows save error with backend reason and a way forward", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authResponse),
    })
  );
  await page.route("**/api/users/777", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Profile save failed" }),
    })
  );
  await seedStorage(page, {
    userId: 0,
    completedSteps: [
      "welcome",
      "region-language",
      "content-rating",
      "streaming-services",
      "stay-connected",
      "vibe-check",
      "taste-calibration",
      "recommended-for-you",
    ],
  });

  await page.goto("/auth/register?from=/onboarding/recommended-for-you");
  await page.getByLabel("Full Name").fill("Tester");
  await page.getByLabel("Username").fill("tester");
  await page.getByLabel("Email").fill("tester@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /Create Account|Sign Up|Register/i }).click();

  await expect(page).toHaveURL(/\/auth\/register/);
  await expect(page.getByText(/Profile save failed/)).toBeVisible();
  await expect(page.getByText(/Your account is ready/)).toBeVisible();
  await page.getByRole("button", { name: /Continue without saving/ }).click();
  await expect(page).toHaveURL(/\/feed/);
});

test("region-language step asks locale and original-language preference only", async ({ page }) => {
  await page.goto("/onboarding/region-language");
  await expect(page.getByRole("heading", { name: "Where are you watching from?" })).toBeVisible();
  await expect(page.getByText("Original language content")).toBeVisible();
  await expect(page.getByText("Format preferences")).toHaveCount(0);

  await page.getByRole("radio", { name: /Mostly my language/ }).check();
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/ratings$/);

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bingewise-onboarding") ?? "{}")
  );
  expect(stored.state?.contentLanguagePreference).toBe("PREFER_SELECTED");
});

test("genre search accepts backend genreId/genreName fields", async ({ page }) => {
  await mockApi(page, 401);
  await page.route("**/api/genres/filter*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ genreId: 10765, genreName: "Sci-Fi & Fantasy" }]),
    })
  );

  await page.goto("/onboarding/genres");
  await page.getByPlaceholder("Search for genre").fill("fantasy");
  await expect(page.getByRole("button", { name: "Sci-Fi & Fantasy" })).toBeVisible();
  await page.getByRole("button", { name: "Sci-Fi & Fantasy" }).click();
  await page.getByRole("button", { name: /Next/ }).click();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bingewise-onboarding") ?? "{}")
  );
  expect(stored.state?.preferredGenres).toContain(10765);
  expect(stored.state?.genreNames?.["10765"]).toBe("Sci-Fi & Fantasy");
});

test("streaming step loads region providers and reorders selected services", async ({ page }) => {
  await mockApi(page);
  await seedStorage(page, {
    completedSteps: ["welcome", "region-language", "content-rating"],
    lastStep: "streaming-services",
  });

  await page.goto("/onboarding/streaming");
  await expect(page.getByRole("heading", { name: "What do you watch on?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Netflix" })).toBeVisible();

  await page.getByRole("button", { name: "Netflix" }).click();
  await page.getByRole("button", { name: "Hulu" }).click();
  await expect(page.getByText("2 selected · drag to set priority")).toBeVisible();

  await page.getByRole("button", { name: "Hulu" }).dragTo(page.getByRole("button", { name: "Netflix" }));
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/stay-connected$/);
  await expect(page.getByRole("heading", { name: "Stay Connected" })).toBeVisible();
  await expect(page.getByText("This setting applies to this browser only.")).toBeVisible();
  // Web cannot honor per-category suppression without backend support.
  await expect(page.getByRole("button", { name: "Replies" })).toHaveCount(0);

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bingewise-onboarding") ?? "{}")
  );
  expect(stored.state?.selectedProviders).toEqual([15, 8]);
  expect(stored.state?.orderedSelectedProviders).toEqual([15, 8]);
});

test("definitive refresh failure clears the local session", async ({ page }) => {
  await mockApi(page, 401);
  // addInitScript runs on every navigation, so guard against reseeding the
  // session when forceLogout redirects to /auth/login.
  await page.addInitScript((sessionData) => {
    if (!sessionStorage.getItem("bw-test-session-seeded")) {
      localStorage.setItem("bingewise-session", JSON.stringify(sessionData));
      sessionStorage.setItem("bw-test-session-seeded", "1");
    }
  }, session);

  await page.goto("/feed");
  // The dev server can be busy after a full suite, so allow enough time for
  // hydration plus the mocked refresh failure to force the redirect.
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
  expect(await page.evaluate(() => localStorage.getItem("bingewise-session"))).toBeNull();
});
