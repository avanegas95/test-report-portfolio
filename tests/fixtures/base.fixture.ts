import { test as base, expect, type Page } from "@playwright/test";

function attachErrorListeners(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  return errors;
}

export const test = base.extend<{ errorLog: string[] }>({
  errorLog: async ({ page }, use) => {
    const errors = attachErrorListeners(page);
    await use(errors);

    expect(
      errors,
      errors.length > 0
        ? `Unexpected console or page errors:\n${errors.join("\n")}`
        : undefined,
    ).toEqual([]);
  },
});

export { expect } from "@playwright/test";
