import { test, expect } from "../fixtures/base.fixture";

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("390px has no horizontal overflow and stacked table layouts", async ({
    page,
  }) => {
    await page.goto("/");

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    await expect(page.locator("section#quality table")).toBeHidden();
    const runsList = page.locator("section#quality ul");
    if ((await runsList.locator("li").count()) > 0) {
      await expect(runsList.first()).toBeVisible();
    }

    await page.goto("/#suites");
    const suiteHeader = page
      .locator("section#suites")
      .getByText("ID", { exact: true })
      .first();
    await expect(suiteHeader).toBeHidden();
  });
});
