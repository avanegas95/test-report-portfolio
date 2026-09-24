import { test, expect } from "../fixtures/base.fixture";

test.describe("expandable test case rows", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("BD-004 is open by default with synced ARIA and visible panel", async ({
    page,
  }) => {
    await page.goto("/#suites");

    const toggle = page.getByRole("button", { name: /BD-004/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const controls = await toggle.getAttribute("aria-controls");
    expect(controls).toBeTruthy();

    const panel = page.locator(`#${controls}`);
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("role", "region");
  });

  test("clicking toggles a row and keeps aria-expanded and hidden in sync", async ({
    page,
  }) => {
    await page.goto("/#suites");

    const toggle = page.getByRole("button", { name: /BD-004/i });
    const panelId = await toggle.getAttribute("aria-controls");
    const panel = page.locator(`#${panelId}`);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
  });

  test("Enter and Space toggle a row; keyboard focus shows a visible outline", async ({
    page,
  }) => {
    await page.goto("/#suites");

    const toggle = page.getByRole("button", { name: /BD-004/i });
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // Ensure the client:visible island is hydrated before keyboard checks.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    // Step off and back on with the keyboard so :focus-visible applies in
    // every engine (Firefox keeps mouse-focus modality after the click above).
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(toggle).toBeFocused();

    const outlineWidth = await toggle.evaluate((element) => {
      return window.getComputedStyle(element).outlineWidth;
    });
    expect(outlineWidth).not.toBe("0px");
  });

  test("rows without a story are not buttons", async ({ page }) => {
    await page.goto("/#suites");

    await expect(page.getByRole("button", { name: /BD-001/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /SN-001/i })).toHaveCount(0);
    await expect(page.getByText("BD-001").first()).toBeVisible();
  });
});
