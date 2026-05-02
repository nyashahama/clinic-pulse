# ClinicPulse Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add and link a clinical, official ClinicPulse logo across visible app chrome and browser/app icon metadata.

**Architecture:** Use one reusable React logo component for navigation and footer brand surfaces. Use Next app metadata file conventions for `app/icon.svg` and `app/apple-icon.tsx`, avoiding manual `<head>` tags.

**Tech Stack:** Next App Router, React, TypeScript, Tailwind CSS, SVG, `next/og` ImageResponse.

---

## File Structure

- Create `components/brand/clinicpulse-logo.tsx`: reusable logo mark and wordmark component.
- Create `app/icon.svg`: file-based browser/app icon automatically linked by Next.
- Create `app/apple-icon.tsx`: generated Apple touch icon using the same shield/cross/pulse concept.
- Modify `components/landing/nav.tsx`: replace text-only brand with the reusable logo.
- Modify `components/landing/footer.tsx`: replace text-only brand with the reusable logo.

### Task 1: Add Reusable Logo Component

**Files:**
- Create: `components/brand/clinicpulse-logo.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from "@/lib/utils";

type ClinicPulseLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function ClinicPulseLogo({
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
}: ClinicPulseLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md bg-[#0D7A6B] text-white shadow-sm ring-1 ring-[#0D7A6B]/20",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="size-5"
          role="img"
        >
          <path
            d="M16 3.75 25 7.1v7.25c0 6.05-3.55 11.12-9 13.9-5.45-2.78-9-7.85-9-13.9V7.1l9-3.35Z"
            fill="currentColor"
            opacity="0.18"
          />
          <path
            d="M16 3.75 25 7.1v7.25c0 6.05-3.55 11.12-9 13.9-5.45-2.78-9-7.85-9-13.9V7.1l9-3.35Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M16 9v9M11.5 13.5h9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M8.75 20.25h4.2l1.4-2.9 2.65 5.3 1.45-2.4h4.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight text-neutral-900",
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

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: lint completes without new errors.

- [ ] **Step 3: Commit**

```bash
git add components/brand/clinicpulse-logo.tsx
git commit -m "feat: add ClinicPulse logo component"
```

### Task 2: Link Logo in Landing Chrome

**Files:**
- Modify: `components/landing/nav.tsx`
- Modify: `components/landing/footer.tsx`

- [ ] **Step 1: Update nav import and brand link**

In `components/landing/nav.tsx`, add:

```tsx
import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
```

Replace the current `ClinicPulse` text span inside the home link with:

```tsx
<ClinicPulseLogo />
```

- [ ] **Step 2: Update footer import and brand link**

In `components/landing/footer.tsx`, add:

```tsx
import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
```

Replace the current `ClinicPulse` text span inside the home link with:

```tsx
<ClinicPulseLogo
  iconClassName="size-6 rounded-md"
  wordmarkClassName="text-sm"
/>
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: lint completes without new errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/nav.tsx components/landing/footer.tsx
git commit -m "feat: link ClinicPulse logo in chrome"
```

### Task 3: Add Next Metadata Icons

**Files:**
- Create: `app/icon.svg`
- Create: `app/apple-icon.tsx`

- [ ] **Step 1: Add browser icon SVG**

Create `app/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0D7A6B"/>
  <path d="M32 8.5 49 14.8v13.7c0 11.4-6.7 21-17 26.2C21.7 49.5 15 39.9 15 28.5V14.8L32 8.5Z" fill="#fff" opacity=".16"/>
  <path d="M32 8.5 49 14.8v13.7c0 11.4-6.7 21-17 26.2C21.7 49.5 15 39.9 15 28.5V14.8L32 8.5Z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M32 19v17M23.5 27.5h17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <path d="M18.5 41h8l2.6-5.5 5 10 2.8-4.5h8.6" fill="none" stroke="#BDF7D2" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 2: Add Apple touch icon generator**

Create `app/apple-icon.tsx`:

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
          background: "#0D7A6B",
          borderRadius: 40,
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 8.5 49 14.8v13.7c0 11.4-6.7 21-17 26.2C21.7 49.5 15 39.9 15 28.5V14.8L32 8.5Z"
            fill="white"
            fillOpacity="0.16"
          />
          <path
            d="M32 8.5 49 14.8v13.7c0 11.4-6.7 21-17 26.2C21.7 49.5 15 39.9 15 28.5V14.8L32 8.5Z"
            stroke="white"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M32 19v17M23.5 27.5h17"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M18.5 41h8l2.6-5.5 5 10 2.8-4.5h8.6"
            stroke="#BDF7D2"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: production build completes and metadata icon routes compile.

- [ ] **Step 4: Commit**

```bash
git add app/icon.svg app/apple-icon.tsx
git commit -m "feat: add ClinicPulse app icons"
```

### Task 4: Final Verification

**Files:**
- Verify: `components/brand/clinicpulse-logo.tsx`
- Verify: `components/landing/nav.tsx`
- Verify: `components/landing/footer.tsx`
- Verify: `app/icon.svg`
- Verify: `app/apple-icon.tsx`

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: lint completes without errors.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: production build completes without errors.

- [ ] **Step 3: Inspect final diff**

Run: `git status --short`
Expected: only the pre-existing `D app/favicon.ico` remains unstaged if it was not part of this work; all logo implementation files are committed or ready to commit.
