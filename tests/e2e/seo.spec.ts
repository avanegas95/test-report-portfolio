import { test, expect } from "../fixtures/base.fixture";
import { EXPECTED_VERSION } from "../helpers/expected";

test("SEO metadata, JSON-LD, and OG image are present", async ({
  page,
  request,
}) => {
  await page.goto("/");

  const title = `Anderson Vanegas — Test Report ${EXPECTED_VERSION}`;
  await expect(page).toHaveTitle(title);

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Staff SQA Engineer portfolio/,
  );

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute("href", /\/$/);

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    title,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /Staff SQA Engineer portfolio/,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    /avanegas\.com\/?$/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/og\.png$/,
  );

  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    title,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    /\/og\.png$/,
  );

  const jsonLd = page.locator('script[type="application/ld+json"]');
  const jsonText = await jsonLd.textContent();
  expect(jsonText).toBeTruthy();
  const person = JSON.parse(jsonText!);
  expect(person["@type"]).toBe("Person");
  expect(person.name).toBe("Anderson Vanegas");
  expect(person.jobTitle).toBe("Staff SQA Engineer");

  const ogResponse = await request.get("/og.png");
  expect(ogResponse.status()).toBe(200);
  expect(ogResponse.headers()["content-type"]).toMatch(/image\/png/);
});
