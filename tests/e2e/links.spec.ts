import { test, expect } from "../fixtures/base.fixture";

test("résumé links resolve to PDF and email uses mailto", async ({
  page,
  request,
}) => {
  await page.goto("/");

  const navResume = page.getByRole("link", { name: "Download report (PDF)" });
  await expect(navResume).toHaveAttribute(
    "href",
    "/Anderson_Vanegas_Resume.pdf",
  );
  await expect(navResume).toHaveAttribute("download", "");

  const signoffResume = page.getByRole("link", { name: "Résumé (PDF)" });
  await expect(signoffResume).toHaveAttribute(
    "href",
    "/Anderson_Vanegas_Resume.pdf",
  );
  await expect(signoffResume).toHaveAttribute("download", "");

  const emailLink = page.getByRole("link", {
    name: "Email avanegas95@gmail.com",
  });
  await expect(emailLink).toHaveAttribute(
    "href",
    "mailto:avanegas95@gmail.com",
  );

  const pdfResponse = await request.get("/Anderson_Vanegas_Resume.pdf");
  expect(pdfResponse.status()).toBe(200);
  expect(pdfResponse.headers()["content-type"]).toMatch(/application\/pdf/);
});
