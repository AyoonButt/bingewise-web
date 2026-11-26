import { test, expect, type Page } from "@playwright/test";

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
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
}

test("fresh visitor enters onboarding; first-visit marker prevents re-entry redirect", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: /Stop scrolling/i })).toBeVisible();
  expect(await page.locator(".welcome-polaroid").count()).toBeGreaterThan(0);

  await page.getByRole("link", { name: "Skip setup" }).click();
  await expect(page).toHaveURL(/\/feed\?guest=1/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
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
  expect(
    await page.evaluate(() => localStorage.getItem("bw-first-visit-complete"))
  ).toBe("1");
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
    vibeSoftAvoidedGenres: [18],
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
      subscriptions: [8],
      genreIds: [28],
      softAvoidGenreIds: [18],
      excludedTmdbIds: [999],
    },
  });
});

test("create account after guest setup saves progress and lands on feed", async ({ page }) => {
  let profileSaved = false;
  await mockApi(page);
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authResponse),
    })
  );
  await page.route("**/api/users/777", (route) => {
    if (route.request().method() === "PUT") profileSaved = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
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

  await expect(page).toHaveURL(/\/feed/);
  expect(profileSaved).toBe(true);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bingewise-onboarding") ?? "{}")
  );
  expect(stored.state?.completedSteps ?? []).toEqual([]);
});

test("fresh create account redirects guests to onboarding before account fields", async ({ page }) => {
  await mockApi(page);

  await page.goto("/auth/register?from=/feed");
  await expect(page).toHaveURL(/\/onboarding\?.*fresh=1/);
  await expect(page.getByRole("heading", { name: /Stop scrolling/i })).toBeVisible();
  await expect(page.getByLabel("Full Name")).toHaveCount(0);
});

test("create account shows save error without reopening onboarding", async ({ page }) => {
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
  await expect(page.getByText(/could not be saved/i)).toBeVisible();
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

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bingewise-onboarding") ?? "{}")
  );
  expect(stored.state?.selectedProviders).toEqual([15, 8]);
  expect(stored.state?.orderedSelectedProviders).toEqual([15, 8]);
});

test("definitive refresh failure clears the local session", async ({ page }) => {
  await mockApi(page, 401);
  await seedStorage(page, {}, true);

  await page.goto("/feed");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("bingewise-session")))
    .toBeNull();
});
