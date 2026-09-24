import { test, expect } from "../fixtures/base.fixture";

test("every status badge has a visible text label", async ({ page }) => {
  await page.goto("/");

  const badges = page.locator(
    "span.inline-flex.items-center.rounded-full.font-mono.font-semibold.uppercase",
  );
  const count = await badges.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const badge = badges.nth(index);
    const text = (await badge.innerText()).replace(/\s+/g, " ").trim();
    expect(text.length).toBeGreaterThan(0);
    expect(text).toMatch(/[A-Z0-9: ·]/);
  }
});
