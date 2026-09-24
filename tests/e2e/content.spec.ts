import { test, expect } from "../fixtures/base.fixture";
import {
  COMPUTED,
  EXPECTED_REPORT_ID,
  EXPECTED_VERSION,
} from "../helpers/expected";

test("computed values match content files", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(EXPECTED_VERSION).first()).toBeVisible();
  await expect(page.getByText(EXPECTED_REPORT_ID)).toBeVisible();
  await expect(page.getByText(COMPUTED.statusLine)).toBeVisible();

  const metricsGrid = page.locator(
    "section#summary div.grid.border-y.border-rule.sm\\:grid-cols-2",
  );
  await expect(metricsGrid).toContainText(COMPUTED.suiteCount);
  await expect(metricsGrid).toContainText(COMPUTED.toolCount);
  await expect(metricsGrid).toContainText(COMPUTED.passRate);

  for (const suite of COMPUTED.suitePasses) {
    await expect(
      page.locator("section#suites").getByText(suite.label, { exact: true }),
    ).toBeVisible();
  }

  await expect(
    page.locator("section#suites").getByText(`${COMPUTED.totalCases} run`, {
      exact: false,
    }),
  ).toBeVisible();
});
