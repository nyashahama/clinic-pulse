# Real-world Stakes Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic stakeholder-impact-strip with a patient journey timeline that shows live ClinicPulse data at each critical moment of a real trip-to-clinic-gone-wrong scenario.

**Architecture:** A new `PatientJourneyTimeline` component replaces `StakeholderImpactStrip`. Five `PatientJourneyStep` cards form a horizontal snap-scrolling timeline (desktop) / vertical stack (mobile), each displaying ClinicPulse UI artifacts (status badges, freshness pills, finder cards, field report cards) from the Mabopane Station incident data. The data layer is a single typed object in `lib/landing/patient-journey-data.ts`.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing ClinicPulse LandingSection wrapper, IntersectionObserver for scroll animations, CSS scroll-snap for timeline navigation.

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `lib/landing/patient-journey-data.ts` | **Create** | Typed data for all 5 timeline steps using existing Mabopane demo data |
| `components/landing/patient-journey-timeline.tsx` | **Create** | Main container: horizontal snap-scroll on desktop, vertical stack on mobile |
| `components/landing/patient-journey-step.tsx` | **Create** | Individual step card with step number, moment label, data artifact, context |
| `components/landing/timeline-rail.tsx` | **Create** | Background connecting rail between steps (reuses existing CSS vars) |
| `components/landing/mini-finder-card.tsx` | **Create** | Small finder card artifact showing clinic, service, status, distance |
| `components/landing/mini-field-report-card.tsx` | **Create** | Small field report artifact showing queue state, disruption, sync |
| `components/landing/stakeholder-proof.tsx` | **Modify** | Replace import: `StakeholderImpactStrip` → `PatientJourneyTimeline` |
| `components/landing/stakeholder-impact-strip.tsx` | **No change** | Keep existing (routed elsewhere or deprecated later) |
| `lib/landing/openpanel-refactor-content.ts` | **Modify** | Remove unused `stakeholderImpactItems` if no longer referenced |

---

### Task 1: Create patient journey data

**Files:**
- Create: `lib/landing/patient-journey-data.ts`

- [ ] **Step 1: Create the data file**

```typescript
import type { StatusTone } from "@/lib/landing/openpanel-refactor-content";

export type PatientJourneyStepData = {
  /** Step number in the timeline (1-5) */
  step: number;
  /** Short moment label: "Depart", "Travel", "Arrive", "Discover", "Reroute" */
  moment: string;
  /** Approximate time of day for this moment */
  time: string;
  /** Where the patient is at this moment */
  location: string;
  /** Type of ClinicPulse artifact to render */
  artifact: "finder-card" | "field-report" | "status-badge" | "impact-statement" | "finder-card";
  /** ClinicPulse status badge tone */
  tone: StatusTone;
  /** Primary headline shown in the data artifact */
  headline: string;
  /** Secondary detail line(s) */
  details: string[];
  /** Freshness label */
  freshness: string;
  /** Source attribution label */
  source?: string;
  /** Metric to highlight (e.g., "90 min", "18 min") */
  metric?: string;
  /** Metric label */
  metricLabel?: string;
};

export const patientJourneySteps: PatientJourneyStepData[] = [
  {
    step: 1,
    moment: "Depart",
    time: "07:30",
    location: "Patient home",
    artifact: "finder-card",
    tone: "neutral",
    headline: "Mabopane Station Clinic",
    details: [
      "Pharmacy: Operational",
      "Chronic medication pickup scheduled",
    ],
    freshness: "3 days ago",
    source: "Finder (stale entry)",
  },
  {
    step: 2,
    moment: "Travel",
    time: "07:30\u201308:15",
    location: "In transit",
    artifact: "field-report",
    tone: "warning",
    headline: "Field report queued offline",
    details: [
      "Generator failure at Mabopane Station",
      "Pharmacy dispensing paused",
      "Chronic care pickups affected",
    ],
    freshness: "Queued for sync",
    source: "Field worker (offline)",
  },
  {
    step: 3,
    moment: "Arrive",
    time: "08:15",
    location: "Mabopane Station Clinic",
    artifact: "status-badge",
    tone: "critical",
    headline: "Non-functional",
    details: [
      "Pharmacy: Closed",
      "Reason: Generator failure",
    ],
    freshness: "2 min ago",
    source: "Field worker",
  },
  {
    step: 4,
    moment: "Discover",
    time: "08:15",
    location: "Pharmacy counter",
    artifact: "impact-statement",
    tone: "critical",
    headline: "No medication available",
    details: [
      "Chronic refill window: 30 days",
    ],
    freshness: "Now",
    metric: "90 min",
    metricLabel: "wasted round-trip",
  },
  {
    step: 5,
    moment: "Reroute",
    time: "08:16",
    location: "Akasia Hills Clinic",
    artifact: "finder-card",
    tone: "healthy",
    headline: "Akasia Hills Clinic",
    details: [
      "Pharmacy: Accepting rerouted pickups",
      "Chronic medication dispensing confirmed",
    ],
    freshness: "Now",
    source: "Finder (live)",
    metric: "18 min",
    metricLabel: "detour",
  },
];
```

- [ ] **Step 2: Run typecheck to verify no errors**

```bash
npx tsc --noEmit
```
Expected: No errors related to the new file.

- [ ] **Step 3: Commit**

```bash
git add lib/landing/patient-journey-data.ts
git commit -m "feat: add patient journey data for real-world stakes timeline"
```

---

### Task 2: Create timeline rail component

**Files:**
- Create: `components/landing/timeline-rail.tsx`

- [ ] **Step 1: Create the rail component**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";

export function TimelineRail({ stepCount = 5 }: { stepCount?: number }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const container = rail.closest("[data-journey-scroll]");
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container as HTMLElement;
      const scrollable = scrollWidth - clientWidth;
      if (scrollable <= 0) {
        setProgress(1);
        return;
      }
      setProgress(scrollLeft / scrollable);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const dotCount = stepCount;
  const activeDot = Math.round(progress * (dotCount - 1));

  return (
    <div
      ref={railRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-8 h-px bg-white/10"
    >
      <div
        className="absolute left-0 top-1/2 h-full rounded-full bg-emerald-500/60 transition-[width] duration-300"
        style={{ width: `${progress * 100}%` }}
      />
      {Array.from({ length: dotCount }).map((_, i) => (
        <span
          key={i}
          className={`absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full transition-colors duration-300 ${
            i <= activeDot ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-white/20"
          }`}
          style={{ left: `${(i / (dotCount - 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/timeline-rail.tsx
git commit -m "feat: add timeline rail component with scroll progress"
```

---

### Task 3: Create mini finder card artifact

**Files:**
- Create: `components/landing/mini-finder-card.tsx`

- [ ] **Step 1: Create the mini finder card**

```typescript
import { MapPin, Navigation, Clock } from "lucide-react";

import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";

export function MiniFinderCard({ step }: { step: PatientJourneyStepData }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {step.headline}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{step.location}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
        {step.details.map((detail, i) => (
          <p key={i} className="text-xs text-white/70">
            {detail}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 text-amber-400">
          <Clock className="size-3" />
          {step.freshness}
        </span>
        {step.source && (
          <span className="text-white/40">{step.source}</span>
        )}
      </div>
      {step.metric && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2">
          <Navigation className="size-3.5 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">{step.metric}</span>
          <span className="text-[11px] text-emerald-400/70">{step.metricLabel}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/mini-finder-card.tsx
git commit -m "feat: add mini finder card artifact component"
```

---

### Task 4: Create mini field report card artifact

**Files:**
- Create: `components/landing/mini-field-report-card.tsx`

- [ ] **Step 1: Create the mini field report card**

```typescript
import { WifiOff, AlertTriangle, RefreshCw } from "lucide-react";

import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";

export function MiniFieldReportCard({ step }: { step: PatientJourneyStepData }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-950/30 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
          <WifiOff className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-200">
            {step.headline}
          </p>
          <p className="mt-0.5 text-xs text-amber-200/50">
            {step.source}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-amber-500/10 pt-3">
        {step.details.map((detail, i) => (
          <p key={i} className="text-xs text-amber-200/70">
            {detail}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 text-amber-400">
          <RefreshCw className="size-3" />
          {step.freshness}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/mini-field-report-card.tsx
git commit -m "feat: add mini field report card artifact component"
```

---

### Task 5: Create patient journey step component

**Files:**
- Create: `components/landing/patient-journey-step.tsx`

- [ ] **Step 1: Create the step component**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, User } from "lucide-react";

import { MiniFinderCard } from "@/components/landing/mini-finder-card";
import { MiniFieldReportCard } from "@/components/landing/mini-field-report-card";
import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: {
    stepBadge: "bg-neutral-700 text-neutral-200",
    momentBadge: "bg-neutral-800 text-neutral-300 border-neutral-700",
    border: "border-neutral-800",
  },
  warning: {
    stepBadge: "bg-amber-600 text-amber-100",
    momentBadge: "bg-amber-950 text-amber-200 border-amber-800",
    border: "border-amber-900/30",
  },
  critical: {
    stepBadge: "bg-red-600 text-red-100",
    momentBadge: "bg-red-950 text-red-200 border-red-800",
    border: "border-red-900/30",
  },
  healthy: {
    stepBadge: "bg-emerald-600 text-emerald-100",
    momentBadge: "bg-emerald-950 text-emerald-200 border-emerald-800",
    border: "border-emerald-900/30",
  },
} as const;

export function PatientJourneyStep({ step }: { step: PatientJourneyStepData }) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const styles = toneStyles[step.tone];

  const renderArtifact = () => {
    switch (step.artifact) {
      case "finder-card":
        return <MiniFinderCard step={step} />;
      case "field-report":
        return <MiniFieldReportCard step={step} />;
      case "status-badge":
        return (
          <div className="rounded-lg border border-red-500/20 bg-red-950/40 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-400" />
              <span className="text-sm font-bold uppercase tracking-wide text-red-300">
                {step.headline}
              </span>
            </div>
            {step.details.map((detail, i) => (
              <p key={i} className="mt-2 text-xs text-red-200/70">
                {detail}
              </p>
            ))}
            <div className="mt-3 flex items-center gap-3 text-[11px] text-red-400">
              <span>Fresh: {step.freshness}</span>
              {step.source && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {step.source}
                </span>
              )}
            </div>
          </div>
        );
      case "impact-statement":
        return (
          <div className="rounded-lg border border-red-500/30 bg-red-950/50 p-4 text-center backdrop-blur-sm">
            <p className="text-sm font-semibold text-red-200">
              {step.headline}
            </p>
            {step.details.map((detail, i) => (
              <p key={i} className="mt-1.5 text-xs text-red-300/70">
                {detail}
              </p>
            ))}
            {step.metric && (
              <p className="mt-3 font-mono text-2xl font-bold text-red-300">
                {step.metric}
                <span className="ml-1.5 text-xs font-normal text-red-400">
                  {step.metricLabel}
                </span>
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <li
      ref={ref}
      id={`journey-step-${step.step}`}
      aria-labelledby={`journey-step-${step.step}-label`}
      className={cn(
        "scroll-snap-align-start flex w-[320px] shrink-0 flex-col rounded-xl border bg-neutral-950/60 p-5 transition-all duration-700 sm:w-[360px]",
        styles.border,
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full font-mono text-xs font-bold",
            styles.stepBadge
          )}
        >
          {String(step.step).padStart(2, "0")}
        </span>
        <span
          id={`journey-step-${step.step}-label`}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
            styles.momentBadge
          )}
        >
          {step.moment}
        </span>
        <span className="ml-auto font-mono text-[11px] text-white/30">
          {step.time}
        </span>
      </div>

      <div className="mt-4">{renderArtifact()}</div>
    </li>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/patient-journey-step.tsx
git commit -m "feat: add patient journey step component with scroll animation"
```

---

### Task 6: Create patient journey timeline container

**Files:**
- Create: `components/landing/patient-journey-timeline.tsx`

- [ ] **Step 1: Create the timeline container**

```typescript
import { PatientJourneyStep } from "@/components/landing/patient-journey-step";
import { TimelineRail } from "@/components/landing/timeline-rail";
import { patientJourneySteps } from "@/lib/landing/patient-journey-data";

export function PatientJourneyTimeline() {
  return (
    <div
      data-journey-scroll
      role="region"
      aria-label="Patient journey: how live clinic status changes the outcome"
      className="relative"
    >
      <TimelineRail stepCount={patientJourneySteps.length} />

      <ol
        role="list"
        className="flex gap-4 overflow-x-auto px-4 pb-4 pt-12 scrollbar-none snap-x snap-mandatory sm:gap-5 sm:px-8 lg:justify-center lg:overflow-x-visible lg:px-0 lg:snap-none"
      >
        {patientJourneySteps.map((stepData) => (
          <PatientJourneyStep key={stepData.step} step={stepData} />
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/patient-journey-timeline.tsx
git commit -m "feat: add patient journey timeline container component"
```

---

### Task 7: Create the section wrapper (titles + timeline)

**Files:**
- Create: `components/landing/real-world-stakes-section.tsx`

- [ ] **Step 1: Create the section component**

```typescript
import { LandingSection } from "@/components/landing/landing-section";
import { PatientJourneyTimeline } from "@/components/landing/patient-journey-timeline";

export function RealWorldStakesSection() {
  return (
    <LandingSection
      className="border-b border-neutral-900 bg-neutral-950"
      contentClassName="border-x-transparent"
      spacing="compact"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Real-world stakes
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.08] text-white sm:text-4xl">
            A 90-minute trip. An 18-minute detour.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 sm:text-base sm:leading-7">
            One patient&mdash;chronic medication pickup at Mabopane Station
            Clinic. A generator failure makes the pharmacy unavailable. Without
            live status data, the patient arrives to find empty shelves. With
            ClinicPulse, the finder warns before travel and recommends Akasia
            Hills as the nearest compatible alternative.
          </p>
        </div>

        <PatientJourneyTimeline />
      </div>
    </LandingSection>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/real-world-stakes-section.tsx
git commit -m "feat: add real-world stakes section with timeline wrapper"
```

---

### Task 8: Wire up in stakeholder-proof and verify page

**Files:**
- Modify: `components/landing/stakeholder-proof.tsx`

- [ ] **Step 1: Replace the import and component**

```typescript
import { RealWorldStakesSection } from "@/components/landing/real-world-stakes-section";

export function StakeholderProof() {
  return <RealWorldStakesSection />;
}
```

Full file after edit:

```typescript
import { RealWorldStakesSection } from "@/components/landing/real-world-stakes-section";

export function StakeholderProof() {
  return <RealWorldStakesSection />;
}
```

- [ ] **Step 2: Verify no unused imports exist**

```bash
npx tsc --noEmit
```
Expected: No errors, including in `stakeholder-impact-strip.tsx` which is no longer imported by this module.

- [ ] **Step 3: Check that stakeholderImpactItems is still referenced elsewhere**

```bash
rg "stakeholderImpactItems" /home/nyasha-hama/dev/clinicpulse --no-filename
```
If only referenced in `stakeholder-impact-strip.tsx` and `openpanel-refactor-content.ts`, no action needed (those stay for potential reuse). If not referenced anywhere else, we can leave it - removing shared data is out of scope.

- [ ] **Step 4: Run full typecheck + lint**

```bash
npx tsc --noEmit && npx eslint components/landing/stakeholder-proof.tsx
```
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add components/landing/stakeholder-proof.tsx
git commit -m "feat: wire patient journey timeline into stakeholder-proof"
```

---

### Task 9: Visual QA - verify on all breakpoints

**Files:**
- No code changes. Verification only.

- [ ] **Step 1: Build and start dev server**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
Expected: `200`

- [ ] **Step 2: Verify desktop layout (≥1024px)**

Open `http://localhost:3000` in browser at 1440px width.
Check:
- [ ] Timeline shows 5 steps horizontally centered
- [ ] Rail line with progress dots visible above steps
- [ ] Color progression: neutral (step 1) → amber (step 2) → red (steps 3-4) → green (step 5)
- [ ] Each step has step number, moment badge, time, and artifact card
- [ ] Heading reads "A 90-minute trip. An 18-minute detour."
- [ ] Body text explains the Mabopane Station scenario

- [ ] **Step 3: Verify mobile layout (<768px)**

Resize to 375px.
Check:
- [ ] Timeline is horizontal scrollable with snap
- [ ] One step visible at a time with partial peek of next
- [ ] Touch swipe works
- [ ] All text readable, no overflow

- [ ] **Step 4: Verify dark mode**

Toggle system dark mode.
Check:
- [ ] All cards render correctly in dark mode (bg-neutral-950 tones)
- [ ] Status badges maintain contrast
- [ ] Rail line visible

- [ ] **Step 5: Verify accessibility**

Run Lighthouse or manual check:
- [ ] Tab through timeline: focus visible on each step
- [ ] Screen reader announces step number, moment, key data
- [ ] No color-only status indicators

- [ ] **Step 6: Verify scroll animation**

Scroll page slowly.
Check:
- [ ] Steps fade+slide in as they enter viewport
- [ ] `prefers-reduced-motion: reduce` disables animation

- [ ] **Step 7: Commit if any fixes needed, or mark done**

```bash
git add -A && git diff --cached --stat
```

---

### Task 10: Final validation

- [ ] **Step 1: Run all checks**

```bash
npm run typecheck && npm run lint
```
Expected: All pass.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```
Expected: Successful build with no errors.

- [ ] **Step 3: Verify old component is not broken**

```bash
rg "StakeholderImpactStrip" /home/nyasha-hama/dev/clinicpulse
```
Ensure old component is only referenced in its own file (still exists for reference). If referenced elsewhere, document.

- [ ] **Step 4: Final commit if any changes**

```bash
git add -A && git commit -m "chore: final validation and cleanup for real-world stakes redesign"
```
