import { test, expect } from "../fixtures/base.fixture";
import { SECTIONS } from "../helpers/expected";

test("page loads with no console or page errors", async ({
  page,
  errorLog,
}) => {
  await page.goto("/");
  await expect(page.locator("main#main")).toBeVisible();
  expect(errorLog).toEqual([]);
});

test("five sections render in order with eyebrows and page landmarks exist", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("nav")).toBeVisible();
  await expect(page.locator("main#main")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();

  for (const section of SECTIONS) {
    const region = page.locator(`section#${section.id}`);
    await expect(region).toBeVisible();
    await expect(
      region.getByText(section.eyebrow, { exact: true }),
    ).toBeVisible();
  }

  const sectionIds = await page
    .locator("main section[id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(sectionIds).toEqual(SECTIONS.map((section) => section.id));
});
