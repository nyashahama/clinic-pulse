# Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dub.co-style split-screen login page for ClinicPulse at /login with email magic link and Google OAuth UI (no backend wiring).

**Architecture:** Seven files — a shared auth layout, a branding panel (left side), and form components composed into a login page. Follows existing ClinicPulse patterns: Tailwind v4, `cn()` from `@/lib/utils`, lucide-react icons, Inter/Satoshi fonts.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, lucide-react, TypeScript

---

### Task 1: Auth Methods Separator

**Files:**
- Create: `components/auth/auth-methods-separator.tsx`

- [ ] **Step 1: Create the component**

```tsx
export function AuthMethodsSeparator() {
  return (
    <div className="my-3 flex flex-shrink items-center justify-center gap-2">
      <div className="grow basis-0 border-b border-neutral-200" />
      <span className="text-content-muted text-xs font-medium uppercase leading-none">
        or
      </span>
      <div className="grow basis-0 border-b border-neutral-200" />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/auth/auth-methods-separator.tsx
git commit -m "feat: add auth methods separator component"
```

---

### Task 2: Google Button

**Files:**
- Create: `components/auth/google-button.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { Chrome } from "lucide-react";

export function GoogleButton() {
  return (
    <button
      type="button"
      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
    >
      <Chrome className="size-4" />
      Continue with Google
    </button>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/auth/google-button.tsx
git commit -m "feat: add Google auth button component"
```

---

### Task 3: Email Sign-In

**Files:**
- Create: `components/auth/email-sign-in.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export function EmailSignIn() {
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-y-3"
    >
      <label>
        <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
          Email
        </span>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="panic@thedis.co"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(
            "block w-full min-w-0 appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 shadow-sm focus:border-black focus:outline-none focus:ring-black",
          )}
        />
      </label>

      <button
        type="submit"
        className="inline-flex w-full shrink-0 items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Log in with email
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/auth/email-sign-in.tsx
git commit -m "feat: add email sign-in component"
```

---

### Task 4: Branding Panel

**Files:**
- Create: `components/auth/branding-panel.tsx`

- [ ] **Step 1: Create the component**

```tsx
export function BrandingPanel() {
  return (
    <div className="relative hidden min-h-screen min-[900px]:block">
      <div className="absolute inset-0 isolate overflow-hidden bg-white">
        <div
          className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2"
          style={{
            maskImage:
              "linear-gradient(black,transparent 320px),linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
            maskComposite: "intersect",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 text-neutral-200"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id="branding-grid"
                x={0.75 * 60 - 1}
                y={-1}
                width={60 + 1}
                height={60 + 1}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M 60 0 L 0 0 0 60`}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={1}
                />
              </pattern>
            </defs>
            <rect fill="url(#branding-grid)" width="100%" height="100%" />
          </svg>
        </div>

        <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] mix-blend-overlay">
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
        </div>
        <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] opacity-10">
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
        </div>
      </div>

      <div className="relative flex h-full flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold tracking-tight text-neutral-900">
          ClinicPulse
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/auth/branding-panel.tsx
git commit -m "feat: add branding panel for auth pages"
```

---

### Task 5: Login Form

**Files:**
- Create: `components/auth/login-form.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { AuthMethodsSeparator } from "./auth-methods-separator";
import { EmailSignIn } from "./email-sign-in";
import { GoogleButton } from "./google-button";

export function LoginForm() {
  return (
    <div className="flex flex-col gap-3">
      <EmailSignIn />
      <AuthMethodsSeparator />
      <GoogleButton />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/auth/login-form.tsx
git commit -m "feat: add login form component"
```

---

### Task 6: Auth Layout (split screen)

**Files:**
- Create: `app/(auth)/layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
import { BrandingPanel } from "@/components/auth/branding-panel";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-[100dvh] min-h-screen grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]">
      <BrandingPanel />

      <div className="relative flex h-full flex-col justify-between overflow-hidden border-l border-black/5 bg-neutral-50 min-[900px]:flex">
        <div className="flex grow items-start justify-center p-6 pt-24 min-[900px]:items-center min-[900px]:p-8 lg:p-14">
          {children}
        </div>

        <p className="px-20 py-8 text-center text-xs font-medium text-neutral-500">
          By continuing, you agree to ClinicPulse&rsquo;s{" "}
          <Link
            href="/legal/terms"
            className="font-semibold text-neutral-600 hover:text-neutral-800"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="font-semibold text-neutral-600 hover:text-neutral-800"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/layout.tsx
git commit -m "feat: add auth layout with terms footer"
```

---

### Task 7: Login Page

**Files:**
- Create: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Create the login page**

```tsx
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h3 className="text-center text-xl font-semibold">
        Log in to your ClinicPulse account
      </h3>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm font-medium text-neutral-500">
        Don&rsquo;t have an account?&nbsp;
        <Link
          href="/register"
          className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/login/page.tsx
git commit -m "feat: add login page with split-screen layout"
```

---

### Task 8: Verify with dev server

- [ ] **Step 1: Start dev server and check for errors**

Run: `npm run dev`
Expected: Server starts, navigate to http://localhost:3000/login to see the login page. No runtime errors in console.

- [ ] **Step 2: Check mobile responsiveness**

Resize browser to mobile width (< 900px). Verify:
- Left branding panel hides
- Form fills full width
- Terms footer appears at bottom of right panel

- [ ] **Step 3: Commit (if changes needed)**

Only if fixes were required during verification.
