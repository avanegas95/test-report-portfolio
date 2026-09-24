import { test, expect } from "../fixtures/base.fixture";

test("prefers-reduced-motion disables smooth scroll and cursor animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const scrollBehavior = await page.evaluate(() => {
    return window.getComputedStyle(document.documentElement).scrollBehavior;
  });
  expect(scrollBehavior).toBe("auto");

  const cursorAnimation = await page
    .locator(".terminal-cursor")
    .first()
    .evaluate((element) => window.getComputedStyle(element).animationName);
  expect(cursorAnimation).toBe("none");
});
