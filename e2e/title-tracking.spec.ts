import { test, expect, type Page } from "@playwright/test";

const USER_ID = 777;
const TMDB_ID = 202;

const session = {
  user: {
    userId: USER_ID,
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

const authResponse = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: {
    id: USER_ID,
    username: "tester",
    email: "tester@example.com",
    name: "Tester",
    language: "en",
    region: "US",
    roles: [],
    needsSetup: false,
  },
};

const basePost = {
  postId: 2,
  tmdbId: TMDB_ID,
  type: "tv",
  title: "Tracking Test Show",
  releaseDate: "2024-01-01",
  overview: "A title used by the tracking e2e suite",
  posterPath: null,
  voteAverage: 7.5,
  voteCount: 50,
  originalLanguage: "en",
  originalTitle: "Tracking Test Show",
  popularity: 10,
  genreIds: "18",
  postLikeCount: 0,
  trailerLikeCount: 0,
  videoKey: "",
  providerIds: [],
  runtime: 45,
  contentRating: "TV-14",
};

type Entry = {
  tmdbId: number;
  mediaType: string;
  status: "want" | "watching" | "watched";
  rating?: number | null;
  note?: string | null;
  lastSeason?: number | null;
  lastEpisode?: number | null;
  updatedAt?: number;
  title?: string;
};

interface MockOptions {
  signedIn?: boolean;
  entries?: Entry[];
  putStatus?: number | ((call: number) => number);
}

interface TrackingMock {
  entries: Entry[];
  putBodies: Record<string, unknown>[];
  trackingCalls: number;
}

function progress(entry: Entry | undefined): string | null {
  if (!entry || entry.mediaType !== "tv" || entry.status !== "watching") return null;
  if (!entry.lastSeason || !entry.lastEpisode) return null;
  return `S${entry.lastSeason} E${entry.lastEpisode}`;
}

async function seedSession(page: Page, signedIn: boolean) {
  await page.addInitScript(
    ({ sessionData, isSignedIn }) => {
      localStorage.setItem("bw-first-visit-complete", "1");
      localStorage.setItem(
        "bingewise-onboarding",
        JSON.stringify({
          state: {
            schemaVersion: 2,
            userId: isSignedIn ? 777 : 0,
            language: "en",
            region: "US",
            completedSteps: [],
          },
          version: 2,
        })
      );
      if (isSignedIn && sessionData) {
        localStorage.setItem("bingewise-session", JSON.stringify(sessionData));
      }
    },
    { sessionData: session, isSignedIn: signedIn }
  );
  if (signedIn) {
    await page.context().addCookies([
      { name: "accessToken", value: "access-token", url: "http://localhost:3000" },
    ]);
  }
}

async function mockApi(page: Page, options: MockOptions = {}): Promise<TrackingMock> {
  const signedIn = options.signedIn ?? true;
  const mock: TrackingMock = {
    entries: options.entries ? options.entries.map((e) => ({ ...e })) : [],
    putBodies: [],
    trackingCalls: 0,
  };

  await seedSession(page, signedIn);

  await page.route("**/api/backend/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    })
  );

  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: signedIn ? 200 : 401,
      contentType: "application/json",
      body: JSON.stringify(
        signedIn ? authResponse : { message: "Unauthorized" }
      ),
    })
  );

  await page.route("**/api/backend/api/recommendations/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/guest")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ posts: [basePost], hasMore: false }),
      });
    }
    const entry = mock.entries.find(
      (e) => e.tmdbId === TMDB_ID && e.mediaType === "tv"
    );
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        posts: [
          {
            ...basePost,
            trackingStatus: signedIn ? (entry?.status ?? null) : null,
            userRating: signedIn ? (entry?.rating ?? null) : null,
            hasNote: signedIn ? !!entry?.note : false,
            trackingProgress: signedIn ? progress(entry) : null,
          },
        ],
        totalCount: 1,
        recentCount: 1,
        qualityCount: 1,
        hasQualityFallback: false,
        contentType: "recommendations",
        nextCursor: null,
        hasMore: false,
        success: true,
        message: null,
      }),
    });
  });

  await page.route("**/api/backend/api/title-tracking**", async (route) => {
    mock.trackingCalls += 1;
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname.endsWith("/batch")) {
      const body = (await request.postDataJSON()) as {
        keys: { tmdbId: number; mediaType: string }[];
      };
      const items = mock.entries.filter((entry) =>
        body.keys.some(
          (key) =>
            key.tmdbId === entry.tmdbId && key.mediaType === entry.mediaType
        )
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(items),
      });
    }

    if (request.method() === "GET") {
      const status = url.searchParams.get("status");
      const items = mock.entries.filter((entry) => entry.status === status);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items,
          hasMore: false,
          totalCount: items.length,
        }),
      });
    }

    if (request.method() === "PUT") {
      const body = (await request.postDataJSON()) as Record<string, unknown>;
      mock.putBodies.push(body);
      const forced = options.putStatus;
      const putStatus =
        typeof forced === "function" ? forced(mock.putBodies.length) : (forced ?? 200);
      if (putStatus !== 200) {
        return route.fulfill({
          status: putStatus,
          contentType: "application/json",
          body: JSON.stringify({ message: "Failed" }),
        });
      }
      const entry: Entry = {
        tmdbId: body.tmdbId as number,
        mediaType: body.mediaType as string,
        status: body.status as Entry["status"],
        rating: (body.rating as number | null) ?? null,
        note: (body.note as string | null) ?? null,
        lastSeason: (body.lastSeason as number | null) ?? null,
        lastEpisode: (body.lastEpisode as number | null) ?? null,
        updatedAt: Date.now(),
        title: basePost.title,
      };
      const index = mock.entries.findIndex(
        (item) =>
          item.tmdbId === entry.tmdbId && item.mediaType === entry.mediaType
      );
      if (index >= 0) mock.entries[index] = entry;
      else mock.entries.push(entry);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(entry),
      });
    }

    if (request.method() === "DELETE") {
      const parts = url.pathname.split("/");
      const mediaType = parts[parts.length - 1];
      const tmdbId = Number(parts[parts.length - 2]);
      mock.entries = mock.entries.filter(
        (entry) => !(entry.tmdbId === tmdbId && entry.mediaType === mediaType)
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  return mock;
}

async function openFeedSheet(page: Page) {
  await page.goto("/feed");
  await expect(page.getByRole("button", { name: "Track title" })).toBeVisible();
  await page.getByRole("button", { name: "Track title" }).click();
  await expect(page.getByText("Track title", { exact: true }).last()).toBeVisible();
}

async function openTrackingTab(page: Page) {
  await page.goto("/watchlists");
  await expect(page.getByRole("heading", { name: "Lists", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /^Tracking$/ }).click();
  await expect(page.getByText(/Track what you want to watch/)).toBeVisible();
  await expect(page.getByText(/watchlist/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^watching \(/i })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });
  });
});

test("want status round-trips through the API and appears in the Want view", async ({
  page,
}) => {
  const mock = await mockApi(page);

  await openFeedSheet(page);
  await page.getByRole("button", { name: "Want to watch" }).click();
  await expect.poll(() => mock.putBodies.length).toBe(1);

  const body = mock.putBodies[0];
  expect(body).toMatchObject({ tmdbId: TMDB_ID, mediaType: "tv", status: "want" });
  expect(body).not.toHaveProperty("userId");
  expect(Object.keys(body).sort()).toEqual(
    ["lastEpisode", "lastSeason", "mediaType", "note", "rating", "status", "tmdbId"].sort()
  );

  await page.keyboard.press("Escape");
  await page.reload();
  await openTrackingTab(page);
  await page.getByRole("button", { name: /^want \(1\)$/i }).click();
  await expect(page.getByText("Tracking Test Show")).toBeVisible();
});

test("TV watching progress persists and +1 increments the episode", async ({
  page,
}) => {
  const mock = await mockApi(page);

  await openFeedSheet(page);
  await page.getByRole("button", { name: "Watching" }).click();
  await page.getByLabel("Season number").fill("2");
  await page.getByLabel("Episode number").fill("4");
  await page.getByRole("button", { name: "Save progress" }).click();
  await expect.poll(() => mock.entries[0]?.lastEpisode).toBe(4);

  await page.keyboard.press("Escape");
  await page.reload();
  await openTrackingTab(page);
  const progressChip = page.getByRole("button", { name: "S2 E4" });
  await expect(progressChip).toBeVisible();
  await progressChip.click();
  await expect(page.getByText("TV progress")).toBeVisible();
  await page.getByRole("button", { name: "Increment episode" }).last().click();
  await expect.poll(() => mock.entries[0]?.lastEpisode).toBe(5);
});

test("watched opens the rating/note prompt and skip keeps the status", async ({
  page,
}) => {
  const mock = await mockApi(page);

  await openFeedSheet(page);
  await page.getByRole("button", { name: "Watched" }).click();
  await expect(page.getByText("Rate & note")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect.poll(() => mock.entries[0]?.status).toBe("watched");
});

test("rating and note save with camelCase keys and no userId", async ({ page }) => {
  const mock = await mockApi(page);

  await openFeedSheet(page);
  await page.getByRole("button", { name: "Watched" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect.poll(() => mock.entries[0]?.status).toBe("watched");

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Track title" }).click();
  await page.getByRole("button", { name: "Add rating / note" }).click();
  await page.getByRole("button", { name: "4 stars" }).click();
  await page.locator("#tracking-note").fill("private note text");
  await expect(page.locator("#tracking-note")).toHaveAttribute("maxLength", "500");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect.poll(() => mock.putBodies.length).toBe(2);
  const body = mock.putBodies[1];
  expect(body).toMatchObject({
    tmdbId: TMDB_ID,
    mediaType: "tv",
    status: "watched",
    rating: 4,
    note: "private note text",
  });
  expect(body).not.toHaveProperty("userId");
  await expect(page.getByText("private note text")).toHaveCount(0);
});

test("clear status removes the row, note, and progress", async ({ page }) => {
  const mock = await mockApi(page, {
    entries: [
      {
        tmdbId: TMDB_ID,
        mediaType: "tv",
        status: "watched",
        rating: 5,
        note: "old note",
        lastSeason: null,
        lastEpisode: null,
        title: basePost.title,
      },
    ],
  });

  await openFeedSheet(page);
  await page.getByRole("button", { name: "Clear status" }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect.poll(() => mock.entries.length).toBe(0);

  await page.reload();
  await openTrackingTab(page);
  await expect(page.getByText("Nothing here yet")).toBeVisible();
});

test("guest bookmark opens signup prompt and never calls tracking", async ({
  page,
}) => {
  const mock = await mockApi(page, { signedIn: false });

  await page.goto("/feed");
  await page.getByRole("button", { name: "Track title" }).click();
  await expect(
    page.getByRole("dialog", { name: "Create a free account" })
  ).toBeVisible();
  expect(mock.trackingCalls).toBe(0);
});

test("a failed PUT rolls the optimistic status back", async ({ page }) => {
  const mock = await mockApi(page, { putStatus: 500 });

  await openFeedSheet(page);
  await page.getByRole("button", { name: "Watching" }).click();
  await expect.poll(() => mock.putBodies.length).toBe(1);

  await page.keyboard.press("Escape");
  await page.reload();
  await openTrackingTab(page);
  await expect(page.getByText("Nothing here yet")).toBeVisible();
  expect(mock.entries.length).toBe(0);
});

test("a camelCase entry written by another client appears in the web view", async ({
  page,
}) => {
  await mockApi(page, {
    entries: [
      {
        tmdbId: 303,
        mediaType: "movie",
        status: "want",
        rating: null,
        note: null,
        lastSeason: null,
        lastEpisode: null,
        title: "Mobile Created Title",
      },
    ],
  });

  await page.goto("/watchlists");
  await openTrackingTab(page);
  await page.getByRole("button", { name: /^want \(1\)$/i }).click();
  await expect(page.getByText("Mobile Created Title")).toBeVisible();
});
