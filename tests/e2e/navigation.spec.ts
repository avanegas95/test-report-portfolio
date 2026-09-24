import { test, expect } from "../fixtures/base.fixture";

test.describe("desktop navigation", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("skip link is first tab stop and moves focus to main", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("nav links update hash and section headings clear the sticky nav", async ({
    page,
  }) => {
    await page.goto("/#summary");

    const navTargets = [
      { hash: "suites", label: "Suites" },
      { hash: "environment", label: "Environment" },
      { hash: "quality", label: "Quality" },
      { hash: "signoff", label: "Sign-off" },
    ] as const;

    for (const target of navTargets) {
      await page
        .locator('header nav[aria-label="Report sections"]')
        .getByRole("link", { name: target.label })
        .click();

      await expect(page).toHaveURL(new RegExp(`#${target.hash}$`));

      const heading = page.locator(`section#${target.hash} h2`).first();
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeInViewport();

      const navBottom = await page.locator("header").evaluate((header) => {
        const rect = header.getBoundingClientRect();
        return rect.bottom;
      });

      const headingTop = await heading.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return rect.top;
      });

      expect(headingTop).toBeGreaterThanOrEqual(navBottom - 4);
    }
  });
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("menu button, navigation, Escape, and section indicator behave correctly", async ({
    page,
  }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open sections menu" });
    const box = await menuButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("navigation", { name: "Report sections" }),
    ).toBeVisible();

    await page.getByRole("link", { name: /Quality/i }).click();
    await expect(page).toHaveURL(/#quality$/);
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await menuButton.click();
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect
      .poll(async () =>
        menuButton.evaluate((element) => element === document.activeElement),
      )
      .toBe(true);

    const indicator = page
      .locator('[aria-live="polite"]')
      .filter({ hasText: "§" });
    await expect(indicator).toContainText("04");
  });
});
