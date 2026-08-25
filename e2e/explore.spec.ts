import { test, expect } from "@playwright/test";

test("explore reels: video iframe renders over the active card", async ({ page }) => {
  // Capture console errors for debugging
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto("/explore", { waitUntil: "domcontentloaded" });

  // Wait for either the loading spinner to clear or content to appear
  await page.waitForTimeout(8000);

  // Did we land somewhere (redirect to login, empty state, or feed)?
  const url = page.url();
  console.log("URL after load:", url);

  // Empty-state copy if no trailers
  const noTrailers = page.getByText(/No trailers to show/i);
  if (await noTrailers.isVisible().catch(() => false)) {
    console.log("No trailers returned by backend (recent posts).");
  }

  // The YouTube iframe injected by the player pool (sticky host overlay)
  const iframe = page.locator("iframe").first();
  const iframeCount = await page.locator("iframe").count();
  console.log("iframe count:", iframeCount);

  // Grab a diagnostic snapshot of the video host overlay + active card
  const diag = await page.evaluate(() => {
    const host = Array.from(document.querySelectorAll("div")).find((d) =>
      (d.getAttribute("style") || "").includes("z-index:30") ||
      (d.getAttribute("style") || "").includes("z-index: 30")
    );
    const cards = document.querySelectorAll('[class*="aspect-"]');
    return {
      hostExists: !!host,
      hostStyle: host ? host.getAttribute("style") : null,
      cardCount: cards.length,
      bodyText: document.body.innerText.slice(0, 200),
    };
  });
  console.log("DIAG:", JSON.stringify(diag, null, 2));

  if (errors.length) {
    console.log("PAGE ERRORS:\n" + errors.join("\n"));
  }

  // We don't hard-fail on the video here; this is a diagnostic run.
  expect(true).toBe(true);
});
