# ClinicPulse Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the ClinicPulse landing page following the dub.co-inspired design spec — light editorial aesthetic, Playfair Display serif headings, grid-border system, inline product demo card, and functional motion animations.

**Architecture:** The landing page is a single Next.js App Router page (`app/page.tsx`) composed from modular React components in `components/landing/`. A shared `components/landing/status-badge.tsx` defines the four-semantic status vocabulary used throughout. Tailwind CSS v4 with CSS custom properties handles styling. Framer Motion handles scroll-triggered animations and counter animations. `@number-flow/react` handles the animated number counters.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Framer Motion, @number-flow/react, Lucide React (icons), Playfair Display + Inter (Google Fonts via next/font), shadcn/ui base button component (already installed)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `app/globals.css` | Design tokens, grid-border system, custom animations, font variables |
| `app/layout.tsx` | Add Playfair Display font, update metadata, set up body styles |
| `app/page.tsx` | Landing page composition — imports and assembles all sections |
| `components/landing/nav.tsx` | Fixed navigation bar with blur backdrop |
| `components/landing/hero.tsx` | Hero section: badge, headline, subtitle, CTAs |
| `components/landing/demo-card.tsx` | Inline product demo card (map + table + counters) |
| `components/landing/logo-carousel.tsx` | Partner logos row with grayscale hover |
| `components/landing/problem-section.tsx` | Problem statement: two-column with cards |
| `components/landing/features-section.tsx` | 6-feature grid with 1px borders |
| `components/landing/cta-section.tsx` | Dark CTA with conic gradient glow |
| `components/landing/footer.tsx` | Footer with logo, copyright, links |
| `components/landing/status-badge.tsx` | Reusable status badge component (4 semantic states) |
| `components/ui/grid-section.tsx` | Reusable grid-border section wrapper |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install framer-motion and @number-flow/react**

```bash
npm install framer-motion @number-flow/react
```

- [ ] **Step 2: Verify installation**

```bash
npm ls framer-motion @number-flow/react
```

Expected: Both packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion and @number-flow/react dependencies"
```

---

### Task 2: Update globals.css with design tokens and animations

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Write the updated globals.css**

Replace the entire contents of `app/globals.css` with:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-display: var(--font-playfair);
  --font-mono: var(--font-geist-mono);

  --color-primary: #0D7A6B;
  --color-primary-foreground: #ffffff;

  --color-status-operational: #22c55e;
  --color-status-degraded: #f59e0b;
  --color-status-non-functional: #ef4444;
  --color-status-unknown: #94a3b8;

  --color-neutral-50: #FAFAFA;
  --color-neutral-100: #F5F5F5;
  --color-neutral-200: #E5E5E5;
  --color-neutral-300: #D4D4D4;
  --color-neutral-400: #A3A3A3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  --animate-fade-in: fade-in 0.6s ease-out forwards;
  --animate-slide-up-fade: slide-up-fade 0.6s ease-out forwards;
  --animate-pulse-dot: pulse-dot 2s ease-in-out infinite;
  --animate-ring-pulse: ring-pulse 2s ease-out infinite;
}

:root {
  --background: #FAFAFA;
  --foreground: #171717;
  --font-inter: 'Inter', system-ui, -apple-system, sans-serif;
  --font-playfair: 'Playfair Display', Georgia, serif;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up-fade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes ring-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-inter);
}

.font-display {
  font-family: var(--font-playfair);
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add design tokens, custom animations, and playfair display to globals"
```

---

### Task 3: Update layout.tsx with Playfair Display font and metadata

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the updated layout.tsx**

Replace the entire contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClinicPulse — Real-Time Primary Healthcare Intelligence",
  description:
    "Real-time visibility into South Africa's 3,500+ public primary healthcare clinics. Status tracking, referral routing, and operational intelligence for NGOs, district health managers, and patients.",
  openGraph: {
    title: "ClinicPulse — Know which clinics are working today",
    description:
      "Real-time visibility into South Africa's 3,500+ public primary healthcare clinics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-neutral-900">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add Playfair Display font and update root layout"
```

---

### Task 4: Create the StatusBadge component

**Files:**
- Create: `components/landing/status-badge.tsx`

- [ ] **Step 1: Write the StatusBadge component**

```tsx
import { cn } from "@/lib/utils";

type StatusType = "operational" | "degraded" | "non-functional" | "unknown";

const statusConfig: Record<
  StatusType,
  { label: string; dotClass: string; badgeClass: string }
> = {
  operational: {
    label: "Operational",
    dotClass: "bg-green-500",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200",
  },
  degraded: {
    label: "Degraded",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-200",
  },
  "non-functional": {
    label: "Non-Functional",
    dotClass: "bg-red-500",
    badgeClass:
      "bg-red-100 text-red-800 border-red-200",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-slate-400",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-200",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        config.badgeClass,
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      )}
      {config.label}
    </span>
  );
}

export { type StatusType, statusConfig };
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/status-badge.tsx
git commit -m "feat: add StatusBadge component with four semantic states"
```

---

### Task 5: Create the GridSection wrapper component

**Files:**
- Create: `components/ui/grid-section.tsx`

- [ ] **Step 1: Write the GridSection component**

```tsx
import { cn } from "@/lib/utils";

interface GridSectionProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function GridSection({
  children,
  className,
  innerClassName,
}: GridSectionProps) {
  return (
    <section
      className={cn("relative border-t border-b border-neutral-200", className)}
    >
      <div
        className={cn(
          "mx-auto max-w-[1200px] border-x border-neutral-200 px-6 sm:px-10",
          "py-16 sm:py-20 lg:py-24",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/ui/grid-section.tsx
git commit -m "feat: add GridSection wrapper for dub.co-style border grid"
```

---

### Task 6: Create the Nav component

**Files:**
- Create: `components/landing/nav.tsx`

- [ ] **Step 1: Write the Nav component**

```tsx
"use client";

import Link from "next/link";

export function Nav() {
  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/80 px-6 backdrop-blur-md lg:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0D7A6B]">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
          ClinicPulse
        </span>
      </Link>

      <div className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
        <Link
          href="#problem"
          className="transition-colors hover:text-neutral-900"
        >
          Problem
        </Link>
        <Link
          href="#platform"
          className="transition-colors hover:text-neutral-900"
        >
          Platform
        </Link>
        <Link
          href="#features"
          className="transition-colors hover:text-neutral-900"
        >
          Features
        </Link>
        <Link
          href="#cta"
          className="transition-colors hover:text-neutral-900"
        >
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 sm:inline-block"
        >
          Sign in
        </Link>
        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200"
        >
          Request Demo
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/nav.tsx
git commit -m "feat: add Nav component with blur backdrop and black CTA"
```

---

### Task 7: Create the Hero component

**Files:**
- Create: `components/landing/hero.tsx`

- [ ] **Step 1: Write the Hero component**

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export function Hero() {
  return (
    <section className="px-6 pb-16 pt-32 sm:px-10 sm:pb-20 sm:pt-40 lg:px-0">
      <div className="mx-auto max-w-[1200px] text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={0}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-neutral-500">
            Live — 3,500+ clinics monitored
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={1}
          className="mx-auto mb-6 max-w-[800px] font-display text-4xl font-medium leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl"
          style={{ textWrap: "balance" }}
        >
          Know which clinics are{" "}
          <span className="bg-gradient-to-r from-[#0D7A6B] to-[#0FA89A] bg-clip-text text-transparent">
            working today.
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={2}
          className="mx-auto mb-10 max-w-[540px] text-lg leading-relaxed text-neutral-500"
        >
          Real-time visibility into South Africa&apos;s primary healthcare
          clinics. Status tracking, referral routing, and operational
          intelligence for NGOs, district managers, and patients.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={3}
          className="flex items-center justify-center gap-3"
        >
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200"
          >
            Request Demo
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="#platform"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-500 transition-all hover:border-neutral-400 hover:text-neutral-900 hover:ring-4 hover:ring-neutral-200"
          >
            View Live Map
          </Link>
        </motion.div>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={4}
          className="mt-4 text-sm text-neutral-400"
        >
          Trusted by 120+ health organizations across 52 districts
        </motion.p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/hero.tsx
git commit -m "feat: add Hero component with animated entries and gradient accent"
```

---

### Task 8: Create the DemoCard component

**Files:**
- Create: `components/landing/demo-card.tsx`

- [ ] **Step 1: Write the DemoCard component**

This is the centerpiece — an inline product UI showing the district console with a map viewport, data table, and status counters.

```tsx
"use client";

import { StatusBadge } from "./status-badge";

const clinicData = [
  { name: "Diepsloot CHC", district: "City of Johannesburg", status: "operational" as const },
  { name: "Mamelodi Clinic", district: "City of Tshwane", status: "degraded" as const },
  { name: "Alexandra PHC", district: "City of Johannesburg", status: "non-functional" as const },
  { name: "Soshanguve CHC", district: "City of Tshwane", status: "operational" as const },
];

const mapDots = [
  { left: "32%", top: "20%", status: "operational", highlighted: false },
  { left: "40%", top: "26%", status: "operational", highlighted: true },
  { left: "52%", top: "22%", status: "operational", highlighted: false },
  { left: "44%", top: "34%", status: "operational", highlighted: false },
  { left: "58%", top: "28%", status: "degraded", highlighted: true },
  { left: "36%", top: "42%", status: "operational", highlighted: false },
  { left: "48%", top: "38%", status: "operational", highlighted: false },
  { left: "62%", top: "36%", status: "operational", highlighted: false },
  { left: "42%", top: "48%", status: "non-functional", highlighted: true },
  { left: "53%", top: "44%", status: "operational", highlighted: false },
  { left: "34%", top: "56%", status: "operational", highlighted: false },
  { left: "46%", top: "52%", status: "degraded", highlighted: false },
  { left: "56%", top: "58%", status: "operational", highlighted: false },
  { left: "40%", top: "64%", status: "operational", highlighted: false },
  { left: "50%", top: "70%", status: "operational", highlighted: false },
  { left: "60%", top: "50%", status: "operational", highlighted: false },
  { left: "38%", top: "74%", status: "unknown", highlighted: false },
  { left: "48%", top: "80%", status: "operational", highlighted: false },
  { left: "55%", top: "45%", status: "operational", highlighted: false },
  { left: "30%", top: "38%", status: "operational", highlighted: false },
] as const;

const statusCounters = [
  { value: "2,847", label: "Operational", color: "text-green-700" },
  { value: "287", label: "Degraded", color: "text-amber-700" },
  { value: "107", label: "Non-Functional", color: "text-red-700" },
  { value: "259", label: "Unknown", color: "text-slate-600" },
];

const dotColorMap: Record<string, string> = {
  operational: "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.3)]",
  degraded: "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]",
  "non-functional": "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]",
  unknown: "bg-slate-400",
};

export function DemoCard() {
  return (
    <div className="mx-auto mt-16 max-w-[1000px] px-6 sm:px-0">
      <div className="relative">
        <div
          className="absolute -inset-10 rounded-full opacity-[0.08]"
          style={{
            background:
              "conic-gradient(from 180deg, #0D7A6B, #22c55e, #f59e0b, #ef4444, #0D7A6B)",
            filter: "blur(80px)",
          }}
        />
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-600">
                Live
              </span>
            </div>
            <span className="text-xs text-neutral-400 tabular-nums">
              District Console · Gauteng Province
            </span>
          </div>

          <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col border-b border-neutral-100 p-5 md:border-b-0 md:border-r">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Clinic Status Map
              </div>
              <div className="relative flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                {mapDots.map((dot, i) => (
                  <span
                    key={i}
                    className={`absolute rounded-full ${dotColorMap[dot.status]} ${
                      dot.highlighted ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
                    }`}
                    style={{ left: dot.left, top: dot.top }}
                  >
                    {dot.highlighted && (
                      <span className="absolute inset-[-4px] animate-ring-pulse rounded-full border-[1.5px] border-green-400/40" />
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Recent Reports
              </div>
              <div className="flex flex-col gap-0">
                {clinicData.map((clinic) => (
                  <div
                    key={clinic.name}
                    className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-b-0"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-neutral-900">
                        {clinic.name}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {clinic.district}
                      </div>
                    </div>
                    <StatusBadge status={clinic.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-neutral-200 sm:grid-cols-4">
            {statusCounters.map((counter) => (
              <div
                key={counter.label}
                className="border-b border-neutral-100 border-r px-5 py-4 text-center last:border-r-0 sm:border-b-0"
              >
                <div className={`text-2xl font-semibold tabular-nums tracking-tight ${counter.color}`}>
                  {counter.value}
                </div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  {counter.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/demo-card.tsx
git commit -m "feat: add DemoCard component with map, table, and status counters"
```

---

### Task 9: Create the LogoCarousel component

**Files:**
- Create: `components/landing/logo-carousel.tsx`

- [ ] **Step 1: Write the LogoCarousel component**

```tsx
const partners = [
  "WHO",
  "Right to Care",
  "BroadReach",
  "moms2",
  "Jhpiego",
  "PEPFAR",
];

export function LogoCarousel() {
  return (
    <section className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto max-w-[1200px] text-center">
        <p className="mb-6 text-sm text-neutral-400">
          Trusted by leading health organizations
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((partner) => (
            <span
              key={partner}
              className="text-sm font-semibold tracking-tight text-neutral-300 opacity-50 transition-all hover:opacity-100 hover:text-neutral-900"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Note: These are placeholder partner names. Replace with real SVG logos when available.

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/logo-carousel.tsx
git commit -m "feat: add LogoCarousel component with placeholder partners"
```

---

### Task 10: Create the ProblemSection component

**Files:**
- Create: `components/landing/problem-section.tsx`

- [ ] **Step 1: Write the ProblemSection component**

```tsx
"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";

const problems = [
  {
    title: "DHIS2 reports. It doesn't operate.",
    description:
      "The existing system captures data for national reporting — but it's not built for the field worker who needs to know if a clinic has medicine today.",
  },
  {
    title: "Data lives in silos",
    description:
      "Field worker reports, NGO contributions, and government datasets are separate systems. No single source of truth for clinic status exists.",
  },
  {
    title: "NHI raises the stakes",
    description:
      "The National Health Insurance rollout makes facility-level data quality critical. Without operational visibility, NHI can't route patients or allocate resources effectively.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function ProblemSection() {
  return (
    <GridSection className="bg-white" id="problem">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
            The Problem
          </p>
          <h2
            className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            Patients travel to closed clinics. Districts fly blind.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-neutral-500">
            On any given day, hundreds of South Africa&apos;s 3,500+ public
            clinics are understaffed, out of stock, or overwhelmed. The data
            exists in DHIS2, but it&apos;s a reporting tool — not an operational
            layer.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: i * 0.1,
                    duration: 0.4,
                    ease: "easeOut",
                  },
                },
              }}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
            >
              <h3 className="text-[15px] font-medium text-neutral-900">
                {problem.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </GridSection>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/problem-section.tsx
git commit -m "feat: add ProblemSection with animated cards and grid border"
```

---

### Task 11: Create the FeaturesSection component

**Files:**
- Create: `components/landing/features-section.tsx`

- [ ] **Step 1: Write the FeaturesSection component**

```tsx
"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";
import {
  Activity,
  Smartphone,
  Code2,
  MapPin,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    color: "bg-green-100 text-green-600",
    title: "Real-Time Status Board",
    description:
      "MapLibre GL + TanStack data tables with bi-directional linking. Click a row, fly the map. Click a marker, highlight the row.",
  },
  {
    icon: Smartphone,
    color: "bg-amber-100 text-amber-600",
    title: "Offline-First Field Reports",
    description:
      "5-field quick report form. Submits optimistically, queues with Zustand if offline. Syncs when connectivity returns.",
  },
  {
    icon: Code2,
    color: "bg-blue-100 text-blue-600",
    title: "Public API",
    description:
      "Open data access for researchers, apps, and services building on clinic status data. Real-time endpoints and historical data.",
  },
  {
    icon: MapPin,
    color: "bg-purple-100 text-purple-600",
    title: "Referral Routing",
    description:
      "When a patient's first-choice clinic is degraded, smart routing finds the nearest operational alternative with available capacity.",
  },
  {
    icon: BarChart3,
    color: "bg-orange-100 text-orange-600",
    title: "District Analytics",
    description:
      "Trend analysis, burden spike detection, and resource allocation insights powered by Tremor charts and real-time data.",
  },
  {
    icon: ShieldCheck,
    color: "bg-cyan-100 text-cyan-600",
    title: "NHI-Ready Data",
    description:
      "Facility-level data quality that meets National Health Insurance requirements. The operational layer DHIS2 was never built to be.",
  },
];

export function FeaturesSection() {
  return (
    <GridSection className="bg-neutral-50" id="platform">
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          The Platform
        </p>
        <h2
          className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          One system. Three interfaces.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
          Citizen-report-enriched, NGO-contributed, government-data-fused. Built
          for the people who need it — and the data they produce.
        </p>

        <div className="mt-12 grid grid-cols-1 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                className="bg-white p-7"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] ${feature.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-medium text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GridSection>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/features-section.tsx
git commit -m "feat: add FeaturesSection with 6-feature grid and Lucide icons"
```

---

### Task 12: Create the CTASection component

**Files:**
- Create: `components/landing/cta-section.tsx`

- [ ] **Step 1: Write the CTASection component**

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GridSection } from "@/components/ui/grid-section";

export function CTASection() {
  return (
    <section className="relative border-b border-neutral-800 bg-neutral-900">
      <GridSection className="border-neutral-800" innerClassName="border-neutral-800">
        <div className="relative overflow-hidden py-8 text-center">
          <div
            className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "conic-gradient(from 180deg, #0D7A6B, #22c55e, #f59e0b, #ef4444, #0D7A6B)",
              filter: "blur(120px)",
              opacity: 0.08,
              borderRadius: "50%",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2
              className="mx-auto mb-5 max-w-[600px] font-display text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Start seeing what&apos;s really happening.
            </h2>
            <p className="mx-auto mb-8 max-w-[480px] text-base text-white/50">
              Join 120+ health organizations using ClinicPulse for real-time
              clinic intelligence across South Africa.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-neutral-900 transition-all hover:bg-neutral-50 hover:ring-4 hover:ring-white/10"
            >
              Request Demo
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>
      </GridSection>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/cta-section.tsx
git commit -m "feat: add CTASection with dark background and conic glow"
```

---

### Task 13: Create the Footer component

**Files:**
- Create: `components/landing/footer.tsx`

- [ ] **Step 1: Write the Footer component**

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 py-8 sm:flex-row sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0D7A6B]">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            ClinicPulse
          </span>
        </div>

        <p className="text-sm text-neutral-400">
          © 2026 ClinicPulse. Built for South Africa&apos;s primary healthcare system.
        </p>

        <div className="flex gap-6 text-sm">
          <Link
            href="/privacy"
            className="text-neutral-400 transition-colors hover:text-neutral-700"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-neutral-400 transition-colors hover:text-neutral-700"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="text-neutral-400 transition-colors hover:text-neutral-700"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/landing/footer.tsx
git commit -m "feat: add Footer component"
```

---

### Task 14: Compose the landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the landing page composition**

Replace the entire contents of `app/page.tsx` with:

```tsx
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { DemoCard } from "@/components/landing/demo-card";
import { LogoCarousel } from "@/components/landing/logo-carousel";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <DemoCard />
        <LogoCarousel />
        <ProblemSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript or compilation errors.

- [ ] **Step 3: Run dev server and visually verify**

```bash
npm run dev
```

Open http://localhost:3000 and verify:
1. Navigation bar is fixed with blur backdrop
2. Hero section shows animated badge, gradient headline, CTAs
3. Demo card shows map with colored dots and table with status badges
4. Status counter bar shows four colored stats
5. Logo carousel row renders
6. Problem section has grid-border lines and animated cards
7. Features grid has 1px border grid
8. CTA section has dark background with teal glow
9. Footer renders correctly

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: compose landing page from modular components"
```

---

### Task 15: Final build verification and cleanup

**Files:** None (verification only)

- [ ] **Step 1: Run the full build**

```bash
npm run build
```

Expected: Build succeeds with no warnings about unused imports or type errors.

- [ ] **Step 2: Run the linter**

```bash
npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Visual verification checklist**

Open the page in the browser and verify every section matches the design spec:

- [ ] Nav: fixed, blur backdrop, black CTA button
- [ ] Hero: Playfair Display headline, gradient teal accent, pulsing live dot, two CTAs
- [ ] Demo card: conic glow behind, split-pane map/table, status counters
- [ ] Logo carousel: placeholder partner names, hover effect
- [ ] Problem section: border-t/b grid lines, animated cards on scroll
- [ ] Features section: 3x2 grid with 1px borders, Lucide icons with colored backgrounds
- [ ] CTA: dark background, conic glow, white button
- [ ] Footer: border-top, logo, copyright, links

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete dub.co-inspired landing page with all sections"
```