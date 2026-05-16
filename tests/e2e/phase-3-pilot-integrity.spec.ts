import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers/auth";

test("reporter can inspect server-authoritative field sync queue state", async ({ page }) => {
  await signInAs(page, "reporter@clinicpulse.local", "/field");
  await page.goto("/field/sync-queue");

  await expect(page.getByRole("heading", { name: "Sync queue" })).toBeVisible();
  await expect(page.getByText("Server-authoritative sync state").first()).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});
