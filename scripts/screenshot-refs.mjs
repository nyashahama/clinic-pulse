// Captures full-page + above-the-fold screenshots of the best 2026 landing pages
// for design inspiration.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const TARGETS = [
  { name: "01-linear",         url: "https://linear.app" },
  { name: "02-vercel",         url: "https://vercel.com" },
  { name: "03-resend",         url: "https://resend.com" },
  { name: "04-raycast",        url: "https://raycast.com" },
  { name: "05-cursor",         url: "https://cursor.com" },
  { name: "06-supabase",       url: "https://supabase.com" },
  { name: "07-twenty",         url: "https://twenty.com" },
  { name: "08-trigger",        url: "https://trigger.dev" },
  { name: "09-attio",          url: "https://attio.com" },
  { name: "10-stainless",      url: "https://stainless.com" },
  { name: "11-arc",            url: "https://arc.net" },
  { name: "12-tinybird",       url: "https://tinybird.co" },
  { name: "13-planetscale",    url: "https://planetscale.com" },
  { name: "14-figma-config",   url: "https://figma.com" },
  { name: "15-clay",           url: "https://clay.com" },
  { name: "16-framer",         url: "https://framer.com" },
  { name: "17-amplitude",      url: "https://amplitude.com" },
  { name: "18-notion",         url: "https://notion.com" },
];

const OUT = "/tmp/landing-refs";

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

for (const t of TARGETS) {
  const page = await context.newPage();
  try {
    await page.goto(t.url, { timeout: 25000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    // above the fold
    await page.screenshot({ path: `${OUT}/${t.name}-fold.png`, fullPage: false });
    // full page
    await page.screenshot({ path: `${OUT}/${t.name}-full.png`, fullPage: true });
    console.log(`✓ ${t.name}`);
  } catch (e) {
    console.log(`✗ ${t.name}: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(`\nAll screenshots saved to ${OUT}`);
