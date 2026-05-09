# ClinicPulse Premium Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current shield and inconsistent auth/sidebar brand treatments with the approved B1 Obsidian Signal ClinicPulse logo across primary brand surfaces.

**Architecture:** Keep brand geometry in a shared React SVG mark and logo lockup, then reuse that component in landing, auth, and dashboard chrome. Keep Next metadata icons as separate SVG/ImageResponse assets using the same geometry and palette.

**Tech Stack:** Next App Router, React, TypeScript, Tailwind CSS, SVG, `next/og` ImageResponse, Vitest source tests, Playwright visual smoke checks.

---

## File Structure

- Modify `components/brand/clinicpulse-logo.tsx`: replace the shield logo with a reusable `ClinicPulseMark` and `ClinicPulseLogo` lockup for the Obsidian Signal identity.
- Create `lib/brand/`: brand source-test folder for logo identity checks.
- Create `lib/brand/clinicpulse-logo-source.test.ts`: focused source tests for the shared logo component, metadata icons, and primary brand call sites.
- Modify `app/icon.svg`: replace the shield favicon with the Obsidian Signal app icon SVG.
- Modify `app/apple-icon.tsx`: replace the generated shield Apple icon with the matching Obsidian Signal mark.
- Modify `components/app-sidebar.tsx`: replace the `Building2Icon` brand block with the shared mark.
- Modify `app/(auth)/layout.tsx`: replace the text-only top brand with the shared logo lockup.
- Modify `app/(auth)/login/page.tsx`: replace the isolated `CP` tile with the shared mark.
- Modify `app/(auth)/register/page.tsx`: replace the isolated `CP` tile with the shared mark.
- Create `tests/e2e/brand-logo.spec.ts`: browser smoke test that captures screenshots and checks console errors on public, auth, and dashboard brand surfaces.

### Task 1: Shared Premium Logo Component

**Files:**
- Create directory: `lib/brand`
- Create: `lib/brand/clinicpulse-logo-source.test.ts`
- Modify: `components/brand/clinicpulse-logo.tsx`

- [ ] **Step 1: Create the brand test directory**

Run: `mkdir -p lib/brand`

Expected: `lib/brand` exists.

- [ ] **Step 2: Write the failing source test for the shared mark**

Create `lib/brand/clinicpulse-logo-source.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const logoComponentPath = path.join(
  process.cwd(),
  "components",
  "brand",
  "clinicpulse-logo.tsx",
);

describe("ClinicPulse premium logo component", () => {
  it("exposes the Obsidian Signal shared mark and lockup", () => {
    const source = readFileSync(logoComponentPath, "utf8");

    expect(source).toContain("ClinicPulseMark");
    expect(source).toContain("ClinicPulseLogo");
    expect(source).toContain('data-brand-mark="clinicpulse"');
    expect(source).toContain("bg-[#06251F]");
    expect(source).toContain("#7AF2C5");
    expect(source).not.toContain("M16 3.75 25 7.1");
  });
});
```

- [ ] **Step 3: Run the source test to verify it fails**

Run: `npm test -- lib/brand/clinicpulse-logo-source.test.ts`

Expected: FAIL because `ClinicPulseMark`, `data-brand-mark="clinicpulse"`, and the new palette are not present yet.

- [ ] **Step 4: Replace the shared logo component**

Replace `components/brand/clinicpulse-logo.tsx` with:

```tsx
import { cn } from "@/lib/utils";

type ClinicPulseMarkProps = {
  className?: string;
};

type ClinicPulseLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function ClinicPulseMark({ className }: ClinicPulseMarkProps) {
  return (
    <span
      aria-hidden="true"
      data-brand-mark="clinicpulse"
      className={cn(
        "grid size-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#06251F] text-white shadow-lg shadow-emerald-950/20 ring-1 ring-white/15",
        className,
      )}
    >
      <svg viewBox="0 0 64 64" fill="none" className="size-[82%]">
        <path
          d="M43.5 12.5C35.8 10.4 27.6 11.7 21.8 16.2C15.8 20.9 13.1 28.4 14.8 35.2C16.7 44.8 25.6 51.2 35.6 49.5C39.2 48.9 42.2 47.4 44.4 45.5"
          stroke="#F8FFFB"
          strokeWidth="5.4"
          strokeLinecap="round"
        />
        <path
          d="M32.8 18.8H39C45.1 18.8 49.2 22.7 49.2 28.1C49.2 33.6 45.1 37.4 39 37.4H31.6"
          stroke="#F8FFFB"
          strokeWidth="5.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.5 38.8H25.4L28.8 31.6L35.2 45.5L38.8 38.8H48.4"
          stroke="#7AF2C5"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M44 14.6V24.6M39 19.6H49"
          stroke="#CFFBE7"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ClinicPulseLogo({
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
}: ClinicPulseLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ClinicPulseMark className={iconClassName} />
      {showWordmark ? (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight text-neutral-950",
            wordmarkClassName,
          )}
        >
          ClinicPulse
        </span>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 5: Run the source test to verify it passes**

Run: `npm test -- lib/brand/clinicpulse-logo-source.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the shared component**

```bash
git add components/brand/clinicpulse-logo.tsx lib/brand/clinicpulse-logo-source.test.ts
git commit -m "feat: add premium ClinicPulse logo mark"
```

### Task 2: Metadata Icons

**Files:**
- Modify: `lib/brand/clinicpulse-logo-source.test.ts`
- Modify: `app/icon.svg`
- Modify: `app/apple-icon.tsx`

- [ ] **Step 1: Extend the source test for metadata icons**

Replace `lib/brand/clinicpulse-logo-source.test.ts` with:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const logoComponentPath = path.join(
  process.cwd(),
  "components",
  "brand",
  "clinicpulse-logo.tsx",
);
const faviconPath = path.join(process.cwd(), "app", "icon.svg");
const appleIconPath = path.join(process.cwd(), "app", "apple-icon.tsx");

describe("ClinicPulse premium logo component", () => {
  it("exposes the Obsidian Signal shared mark and lockup", () => {
    const source = readFileSync(logoComponentPath, "utf8");

    expect(source).toContain("ClinicPulseMark");
    expect(source).toContain("ClinicPulseLogo");
    expect(source).toContain('data-brand-mark="clinicpulse"');
    expect(source).toContain("bg-[#06251F]");
    expect(source).toContain("#7AF2C5");
    expect(source).not.toContain("M16 3.75 25 7.1");
  });
});

describe("ClinicPulse premium metadata icons", () => {
  it("uses the Obsidian Signal palette and geometry in app icons", () => {
    const faviconSource = readFileSync(faviconPath, "utf8");
    const appleIconSource = readFileSync(appleIconPath, "utf8");

    for (const source of [faviconSource, appleIconSource]) {
      expect(source).toContain("#06251F");
      expect(source).toContain("#7AF2C5");
      expect(source).toContain("M43.5 12.5");
      expect(source).not.toContain("M32 8.5 49 14.8");
    }
  });
});
```

- [ ] **Step 2: Run the source test to verify the icon checks fail**

Run: `npm test -- lib/brand/clinicpulse-logo-source.test.ts`

Expected: FAIL because `app/icon.svg` and `app/apple-icon.tsx` still contain the shield path and old green field.

- [ ] **Step 3: Replace the favicon SVG**

Replace `app/icon.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="clinicpulse-obsidian-bg" x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="#063C34"/>
      <stop offset=".58" stop-color="#06251F"/>
      <stop offset="1" stop-color="#0B5F53"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#clinicpulse-obsidian-bg)"/>
  <path d="M43.5 12.5C35.8 10.4 27.6 11.7 21.8 16.2C15.8 20.9 13.1 28.4 14.8 35.2C16.7 44.8 25.6 51.2 35.6 49.5C39.2 48.9 42.2 47.4 44.4 45.5" fill="none" stroke="#F8FFFB" stroke-width="5.4" stroke-linecap="round"/>
  <path d="M32.8 18.8H39C45.1 18.8 49.2 22.7 49.2 28.1C49.2 33.6 45.1 37.4 39 37.4H31.6" fill="none" stroke="#F8FFFB" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17.5 38.8H25.4L28.8 31.6L35.2 45.5L38.8 38.8H48.4" fill="none" stroke="#7AF2C5" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M44 14.6V24.6M39 19.6H49" fill="none" stroke="#CFFBE7" stroke-width="3.8" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 4: Replace the Apple icon generator**

Replace `app/apple-icon.tsx` with:

```tsx
import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#06251F",
          borderRadius: 40,
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg width="136" height="136" viewBox="0 0 64 64" fill="none">
          <rect
            width="64"
            height="64"
            rx="15"
            fill="#063C34"
            fillOpacity="0.72"
          />
          <path
            d="M43.5 12.5C35.8 10.4 27.6 11.7 21.8 16.2C15.8 20.9 13.1 28.4 14.8 35.2C16.7 44.8 25.6 51.2 35.6 49.5C39.2 48.9 42.2 47.4 44.4 45.5"
            stroke="#F8FFFB"
            strokeWidth="5.4"
            strokeLinecap="round"
          />
          <path
            d="M32.8 18.8H39C45.1 18.8 49.2 22.7 49.2 28.1C49.2 33.6 45.1 37.4 39 37.4H31.6"
            stroke="#F8FFFB"
            strokeWidth="5.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 38.8H25.4L28.8 31.6L35.2 45.5L38.8 38.8H48.4"
            stroke="#7AF2C5"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 14.6V24.6M39 19.6H49"
            stroke="#CFFBE7"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 5: Run the source test to verify it passes**

Run: `npm test -- lib/brand/clinicpulse-logo-source.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the metadata icons**

```bash
git add app/icon.svg app/apple-icon.tsx lib/brand/clinicpulse-logo-source.test.ts
git commit -m "feat: update ClinicPulse app icons"
```

### Task 3: Primary Brand Surface Rollout

**Files:**
- Modify: `lib/brand/clinicpulse-logo-source.test.ts`
- Create: `tests/e2e/brand-logo.spec.ts`
- Modify: `components/app-sidebar.tsx`
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`

- [ ] **Step 1: Extend the source tests for primary brand surfaces**

Replace `lib/brand/clinicpulse-logo-source.test.ts` with:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const logoComponentPath = path.join(
  process.cwd(),
  "components",
  "brand",
  "clinicpulse-logo.tsx",
);
const faviconPath = path.join(process.cwd(), "app", "icon.svg");
const appleIconPath = path.join(process.cwd(), "app", "apple-icon.tsx");
const sidebarPath = path.join(process.cwd(), "components", "app-sidebar.tsx");
const authLayoutPath = path.join(process.cwd(), "app", "(auth)", "layout.tsx");
const loginPagePath = path.join(process.cwd(), "app", "(auth)", "login", "page.tsx");
const registerPagePath = path.join(
  process.cwd(),
  "app",
  "(auth)",
  "register",
  "page.tsx",
);

describe("ClinicPulse premium logo component", () => {
  it("exposes the Obsidian Signal shared mark and lockup", () => {
    const source = readFileSync(logoComponentPath, "utf8");

    expect(source).toContain("ClinicPulseMark");
    expect(source).toContain("ClinicPulseLogo");
    expect(source).toContain('data-brand-mark="clinicpulse"');
    expect(source).toContain("bg-[#06251F]");
    expect(source).toContain("#7AF2C5");
    expect(source).not.toContain("M16 3.75 25 7.1");
  });
});

describe("ClinicPulse premium metadata icons", () => {
  it("uses the Obsidian Signal palette and geometry in app icons", () => {
    const faviconSource = readFileSync(faviconPath, "utf8");
    const appleIconSource = readFileSync(appleIconPath, "utf8");

    for (const source of [faviconSource, appleIconSource]) {
      expect(source).toContain("#06251F");
      expect(source).toContain("#7AF2C5");
      expect(source).toContain("M43.5 12.5");
      expect(source).not.toContain("M32 8.5 49 14.8");
    }
  });
});

describe("ClinicPulse premium brand surfaces", () => {
  it("reuses the shared mark across sidebar and auth brand treatments", () => {
    const sidebarSource = readFileSync(sidebarPath, "utf8");
    const authLayoutSource = readFileSync(authLayoutPath, "utf8");
    const loginSource = readFileSync(loginPagePath, "utf8");
    const registerSource = readFileSync(registerPagePath, "utf8");

    expect(sidebarSource).toContain("ClinicPulseMark");
    expect(sidebarSource).not.toContain("Building2Icon");
    expect(authLayoutSource).toContain("ClinicPulseLogo");
    expect(loginSource).toContain("ClinicPulseMark");
    expect(registerSource).toContain("ClinicPulseMark");
    expect(loginSource).not.toMatch(/>\s*CP\s*</);
    expect(registerSource).not.toMatch(/>\s*CP\s*</);
  });
});
```

- [ ] **Step 2: Add the Playwright brand smoke test**

Create `tests/e2e/brand-logo.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

const demoAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

function collectConsoleErrors(page: Page) {
  const messages: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });

  return messages;
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(demoAccount.email);
  await page.getByLabel("Password").fill(demoAccount.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("ClinicPulse premium brand identity", () => {
  test("renders the shared brand mark on public and auth surfaces", async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await page.goto("/");
    await expect(page.locator('[data-brand-mark="clinicpulse"]').first()).toBeVisible();
    await expect(page.getByRole("link", { name: "ClinicPulse" }).first()).toBeVisible();
    await page.screenshot({
      path: "test-results/brand-logo-landing.png",
      fullPage: true,
    });

    await page.goto("/login");
    await expect(page.locator('[data-brand-mark="clinicpulse"]').first()).toBeVisible();
    await expect(page.getByRole("link", { name: "ClinicPulse" })).toBeVisible();
    await page.screenshot({
      path: "test-results/brand-logo-login.png",
      fullPage: true,
    });

    await page.goto("/register");
    await expect(page.locator('[data-brand-mark="clinicpulse"]').first()).toBeVisible();
    await expect(page.getByRole("link", { name: "ClinicPulse" })).toBeVisible();
    await page.screenshot({
      path: "test-results/brand-logo-register.png",
      fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
  });

  test("renders the shared brand mark in the dashboard sidebar", async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await signIn(page);

    await expect(page.locator('[data-brand-mark="clinicpulse"]').first()).toBeVisible();
    await expect(page.getByText("ClinicPulse").first()).toBeVisible();
    await page.screenshot({
      path: "test-results/brand-logo-dashboard.png",
      fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the source test to verify the surface checks fail**

Run: `npm test -- lib/brand/clinicpulse-logo-source.test.ts`

Expected: FAIL because the sidebar still imports `Building2Icon` and the auth pages still contain the isolated `CP` mark.

- [ ] **Step 4: Update the dashboard sidebar brand block**

In `components/app-sidebar.tsx`, add this import:

```tsx
import { ClinicPulseMark } from "@/components/brand/clinicpulse-logo"
```

Remove this import:

```tsx
import { Building2Icon } from "lucide-react"
```

Replace the current icon block:

```tsx
<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
  <Building2Icon className="size-4" />
</div>
```

with:

```tsx
<ClinicPulseMark className="size-8 rounded-lg shadow-none" />
```

- [ ] **Step 5: Update the auth layout top brand**

In `app/(auth)/layout.tsx`, add this import:

```tsx
import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
```

Replace the current top brand link contents:

```tsx
<span className="font-display text-lg font-semibold tracking-[-0.02em] text-neutral-950">
  ClinicPulse
</span>
```

with:

```tsx
<ClinicPulseLogo
  iconClassName="size-8 rounded-xl shadow-md shadow-emerald-950/15"
  wordmarkClassName="font-display text-lg font-semibold tracking-[-0.02em] text-neutral-950"
/>
```

- [ ] **Step 6: Update the login page card mark**

In `app/(auth)/login/page.tsx`, add this import:

```tsx
import { ClinicPulseMark } from "@/components/brand/clinicpulse-logo";
```

Replace the current `CP` tile:

```tsx
<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#0D7A6B] text-lg font-bold text-white shadow-lg shadow-[#0D7A6B]/20">
  CP
</div>
```

with:

```tsx
<ClinicPulseMark className="mx-auto mb-4 size-12 rounded-2xl shadow-lg shadow-emerald-950/20" />
```

- [ ] **Step 7: Update the register page card mark**

In `app/(auth)/register/page.tsx`, add this import:

```tsx
import { ClinicPulseMark } from "@/components/brand/clinicpulse-logo";
```

Replace the current `CP` tile:

```tsx
<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-lg font-bold text-white shadow-lg shadow-slate-900/20">
  CP
</div>
```

with:

```tsx
<ClinicPulseMark className="mx-auto mb-4 size-12 rounded-2xl shadow-lg shadow-emerald-950/20" />
```

- [ ] **Step 8: Run focused source and visual tests**

Run: `npm test -- lib/brand/clinicpulse-logo-source.test.ts`

Expected: PASS.

Run: `npx playwright test tests/e2e/brand-logo.spec.ts --project=desktop-chrome`

Expected: PASS, with screenshots written to:

```text
test-results/brand-logo-landing.png
test-results/brand-logo-login.png
test-results/brand-logo-register.png
test-results/brand-logo-dashboard.png
```

- [ ] **Step 9: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 10: Commit the brand surface rollout**

```bash
git add components/app-sidebar.tsx 'app/(auth)/layout.tsx' 'app/(auth)/login/page.tsx' 'app/(auth)/register/page.tsx' lib/brand/clinicpulse-logo-source.test.ts tests/e2e/brand-logo.spec.ts
git commit -m "feat: roll out premium ClinicPulse brand surfaces"
```

### Task 4: Final Verification and Push

**Files:**
- Verify working tree only.

- [ ] **Step 1: Run the full Vitest suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Run the focused brand Playwright test**

Run: `npx playwright test tests/e2e/brand-logo.spec.ts --project=desktop-chrome`

Expected: PASS.

- [ ] **Step 4: Inspect git status**

Run: `git status --short --branch`

Expected: branch is ahead of `origin/main` by the logo implementation commits and has no unstaged or staged changes.

- [ ] **Step 5: Push the implementation commits**

```bash
git push
```

Expected: `main -> main`.
