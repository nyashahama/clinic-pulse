import { expect, type Page } from "@playwright/test";

function escapePath(path: string) {
  return path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function pathPattern(path: string) {
  return new RegExp(`${escapePath(path)}$`);
}

export async function expectStablePath(page: Page, path: string) {
  const pattern = pathPattern(path);

  await page.waitForURL(pattern);
  await expect(page).toHaveURL(pattern);
}
