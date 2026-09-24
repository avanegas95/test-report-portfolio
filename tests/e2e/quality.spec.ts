import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect } from "../fixtures/base.fixture";

function loadExpectedReport() {
  const reportPath =
    process.env.QUALITY_REPORT ??
    resolve("src/data/quality-report.sample.json");
  return JSON.parse(readFileSync(reportPath, "utf8")) as {
    latest: {
      number: number;
      lighthouse: { performance: number };
      playwright: { passed: number; total: number };
      axe: { statesScanned: number };
    };
    runs: Array<{ message: string; status: string }>;
  };
}

const sampleReport = loadExpectedReport();

test(
  "@quality section 04 values match the injected report",
  { tag: "@quality" },
  async ({ page }) => {
    await page.goto("/#quality");

    const { latest } = sampleReport;

    await expect(
      page
        .locator("section#quality")
        .getByText(`run #${latest.number}`)
        .first(),
    ).toBeVisible();
    const qualitySection = page.locator("section#quality");
    await expect(qualitySection).toContainText(
      String(latest.playwright.passed),
    );
    await expect(qualitySection).toContainText(
      `${latest.playwright.total} passed`,
    );
    await expect(
      page.getByText(`${latest.axe.statesScanned} states scanned`),
    ).toBeVisible();

    await expect(
      page.getByRole("img", {
        name: `Performance: ${latest.lighthouse.performance} out of 100`,
      }),
    ).toBeVisible();

    await expect(
      qualitySection.getByRole("link", { name: `#${latest.number}` }),
    ).toBeVisible();
    expect(sampleReport.runs.length).toBeLessThanOrEqual(10);

    const failRows = sampleReport.runs.filter((run) => run.status === "fail");
    const warnRows = sampleReport.runs.filter((run) => run.status === "warn");
    for (const run of failRows) {
      const row = qualitySection
        .locator("table tbody tr")
        .filter({ hasText: run.message });
      await expect(row).toBeVisible();
      await expect(row.getByText("FAIL", { exact: true })).toBeVisible();
    }
    for (const run of warnRows) {
      const row = qualitySection
        .locator("table tbody tr")
        .filter({ hasText: run.message });
      await expect(row).toBeVisible();
      await expect(row.getByText("WARN", { exact: true })).toBeVisible();
    }

    const deployStage = page
      .locator("section#quality")
      .locator("li")
      .filter({ hasText: "Deploy" });
    await expect(deployStage.getByText("live", { exact: true })).toBeVisible();
  },
);
