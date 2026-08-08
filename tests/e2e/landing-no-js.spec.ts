import { expect, test } from "@playwright/test";

test("@no-js renders the complete core narrative without hydration", async ({ page }) => {
  test.skip(test.info().project.name !== "no-js-chrome", "JavaScript-disabled contract");

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Know which clinics can serve patients now." }),
  ).toBeVisible();

  const story = page.locator("#how-it-works");
  for (const heading of [
    "Field report received",
    "District response formed",
    "Patient route updated",
    "Operating record sealed",
  ]) {
    await expect(story.getByRole("heading", { name: heading })).toBeVisible();
  }

  await expect(
    page.locator("#trust-and-evidence").getByRole("heading", { name: "AUD-OPS-MAB-001" }),
  ).toBeVisible();
  const product = page.locator("#product-surfaces");
  await expect(product.getByRole("tab", { name: "District console" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(product.getByRole("tabpanel")).toContainText(
    "Review service status with source and freshness attached.",
  );

  const close = page.locator("[data-landing-chapter='walkthrough-close']");
  const walkthrough = close.getByRole("link", { name: "Book a walkthrough" });
  await expect(walkthrough).toBeVisible();
  await expect(walkthrough).toHaveAttribute("href", "/request-walkthrough");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
