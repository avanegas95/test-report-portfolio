import { mkdirSync, writeFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const axeReport = {
  standard: "WCAG 2.2 AA",
  violations: 0,
  statesScanned: 0,
  details: [] as Array<{ id: string; impact?: string; nodes: number }>,
};

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

async function expectNoViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags([...WCAG_TAGS])
    .analyze();
  axeReport.statesScanned += 1;
  axeReport.violations += results.violations.length;
  for (const violation of results.violations) {
    axeReport.details.push({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    });
  }
  expect(results.violations).toEqual([]);
}

// Run in one worker so afterAll sees every scanned state; otherwise each
// parallel worker writes its own partial reports/axe.json.
test.describe.configure({ mode: "default" });

test.afterAll(() => {
  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/axe.json", `${JSON.stringify(axeReport, null, 2)}\n`);
});

test("desktop default", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expectNoViolations(page);
});

test("desktop with all expandable rows open", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#suites");

  const toggle = page.getByRole("button", { name: /BD-004/i });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }

  await expect(page.locator("#story-BD-004")).toBeVisible();
  await expectNoViolations(page);
});

test("mobile default", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectNoViolations(page);
});

test("mobile with menu open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open sections menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Report sections" }),
  ).toBeVisible();
  await expectNoViolations(page);
});

test("print media", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.emulateMedia({ media: "print" });
  await expectNoViolations(page);
});

test("404 page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/404");
  await expectNoViolations(page);
});
