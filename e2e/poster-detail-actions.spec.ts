import { test, expect, type Page } from "@playwright/test";

const USER_ID = 778;
const POST_ID = 55;
const TMDB_ID = 202;

const session = {
  user: {
    userId: USER_ID,
    name: "Action Tester",
    username: "actiontester",
    email: "action@example.com",
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
    username: "actiontester",
    email: "action@example.com",
    name: "Action Tester",
    language: "en",
    region: "US",
    roles: [],
    needsSetup: false,
  },
};

const tvDetail = {
  id: TMDB_ID,
  name: "Poster Detail Show",
  original_name: "Poster Detail Show",
  overview: "A show used to verify poster-detail actions",
  poster_path: null,
  backdrop_path: null,
  vote_average: 8.1,
  vote_count: 42,
  first_air_date: "2024-01-01",
  original_language: "en",
  popularity: 10,
  genres: [{ id: 18, name: "Drama" }],
  videos: { results: [] },
  credits: { cast: [] },
  recommendations: { results: [] },
  number_of_seasons: 1,
  number_of_episodes: 1,
  status: "Returning Series",
  in_production: true,
};

async function seedSession(page: Page) {
  await page.addInitScript(
    ({ sessionData }) => {
      localStorage.setItem("bw-first-visit-complete", "1");
      localStorage.setItem(
        "bingewise-onboarding",
        JSON.stringify({
          state: {
            schemaVersion: 2,
            userId: sessionData.user.userId,
            language: "en",
            region: "US",
            completedSteps: [],
          },
          version: 2,
        })
      );
      localStorage.setItem("bingewise-session", JSON.stringify(sessionData));
    },
    { sessionData: session }
  );
}

interface InteractionMock {
  saveBodies: Record<string, unknown>[];
}

async function mockApi(page: Page): Promise<InteractionMock> {
  const mock: InteractionMock = { saveBodies: [] };
  let liked = [POST_ID];
  let saved = [POST_ID];

  await seedSession(page);

  await page.route("**/api/backend/api/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    })
  );

  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(authResponse),
    })
  );

  await page.route("**/api/tmdb/tv/202*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tvDetail),
    })
  );

  await page.route("**/api/tmdb/movie/202*", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: "{}" })
  );

  await page.route("**/api/backend/api/posts/by-tmdb/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          postId: POST_ID,
          tmdbId: TMDB_ID,
          type: "tv",
          title: tvDetail.name,
          releaseDate: tvDetail.first_air_date,
          overview: tvDetail.overview,
          posterPath: null,
          voteAverage: tvDetail.vote_average,
          voteCount: tvDetail.vote_count,
          originalLanguage: "en",
          originalTitle: tvDetail.original_name,
          popularity: tvDetail.popularity,
          genreIds: "18",
          postLikeCount: 0,
          trailerLikeCount: 0,
          videoKey: "",
          providerIds: [],
          runtime: 45,
          contentRating: "TV-14",
        },
      ]),
    })
  );

  await page.route("**/api/backend/api/interactions/liked/user/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(liked),
    })
  );

  await page.route("**/api/backend/api/interactions/saved/user/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(saved),
    })
  );

  await page.route("**/api/backend/api/interactions/save", async (route) => {
    const body = (await route.request().postDataJSON()) as Record<string, unknown>;
    mock.saveBodies.push(body);
    liked = body.likeState ? [POST_ID] : [];
    saved = body.saveState ? [POST_ID] : [];
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  return mock;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });
  });
});

test("poster detail loads and toggles like state without a duplicate save action", async ({
  page,
}) => {
  const mock = await mockApi(page);
  await page.goto("/post/202?type=tv");

  const unlike = page.getByRole("button", { name: "Unlike" });
  await expect(unlike).toBeVisible();
  await expect(unlike.locator("svg")).toHaveClass(/fill-\[var\(--heart-red\)\]/);
  await expect(page.getByRole("button", { name: "Track title" })).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Track title" }).locator("svg")
  ).toHaveClass(/fill-\[var\(--saved-bookmark\)\]/);
  await expect(page.getByRole("button", { name: "Save", exact: true })).toHaveCount(0);
  await expect(page.getByText("Track title", { exact: true })).toHaveCount(0);

  await unlike.click();
  const like = page.getByRole("button", { name: "Like", exact: true });
  await expect(like).toBeVisible();
  await expect(like.locator("svg")).not.toHaveClass(/fill-\[var\(--heart-red\)\]/);
  await expect.poll(() => mock.saveBodies.length).toBe(1);
  expect(mock.saveBodies[0]).toMatchObject({
    postId: POST_ID,
    likeState: false,
    saveState: true,
  });

  await like.click();
  await expect(unlike.locator("svg")).toHaveClass(/fill-\[var\(--heart-red\)\]/);
  await expect.poll(() => mock.saveBodies.length).toBe(2);
  expect(mock.saveBodies[1]).toMatchObject({
    postId: POST_ID,
    likeState: true,
    saveState: true,
  });

  const track = page.getByRole("button", { name: "Track title" });
  await track.click();
  await expect(page.getByText("Track title", { exact: true })).toHaveCount(0);
  await expect(track.locator("svg")).not.toHaveClass(
    /fill-\[var\(--saved-bookmark\)\]/
  );
  await expect.poll(() => mock.saveBodies.length).toBe(3);
  expect(mock.saveBodies[2]).toMatchObject({
    postId: POST_ID,
    likeState: true,
    saveState: false,
  });

  await track.click();
  await expect(page.getByText("Track title", { exact: true })).toBeVisible();
  await expect(track.locator("svg")).toHaveClass(/fill-\[var\(--saved-bookmark\)\]/);
  await expect.poll(() => mock.saveBodies.length).toBe(4);
  expect(mock.saveBodies[3]).toMatchObject({
    postId: POST_ID,
    likeState: true,
    saveState: true,
  });
});

test("poster detail comment failures show inline without an unhandled error", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  const insertBodies: Record<string, unknown>[] = [];

  await mockApi(page);
  await page.route("**/api/backend/api/comments/insert", async (route) => {
    insertBodies.push((await route.request().postDataJSON()) as Record<string, unknown>);
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        status: 404,
        error: "Not Found",
        message: "Not Found",
      }),
    });
  });

  await page.goto("/post/202?type=tv");
  await page.getByRole("button", { name: "View all" }).click();
  await page.getByPlaceholder("Add a comment").fill("hello");
  await page.getByRole("button", { name: "Post" }).click();

  await expect(page.getByText("Not Found", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Add a comment")).toHaveValue("hello");
  expect(insertBodies[0]).toMatchObject({ postId: POST_ID });
  expect(pageErrors).toEqual([]);
});
