# Landing Product Reality Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Clinic Pulse landing page feel more like a real, live product without changing the page structure.

**Architecture:** Keep the current landing section order and upgrade only the product visuals inside hero, workflow, product cards, and trust. Put dense UI previews into small focused components so existing section files stay readable. Keep product-state copy in `lib/landing/openpanel-refactor-content.ts` and cover that data contract with Vitest.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4 utility classes, lucide-react icons, Vitest, existing landing components.

---

## File Structure

- Modify `lib/landing/openpanel-refactor-content.ts`: add richer product-state data for hero console, workflow incident stages, product surface previews, and trust system panels.
- Modify `lib/landing/openpanel-refactor-content.test.ts`: assert the new data contracts and guard against generic/reference copy.
- Create `components/landing/product-preview-primitives.tsx`: shared visual primitives for browser frames, status pills, metric tiles, and small UI rows.
- Create `components/landing/hero-district-console.tsx`: larger district-console hero preview with sidebar, toolbar, metrics, table, map, and alert drawer.
- Modify `components/landing/openpanel-product-hero.tsx`: keep copy/CTA, replace the old `ProductPreview` with `HeroDistrictConsole`.
- Create `components/landing/workflow-incident-panel.tsx`: product-style incident progression replacing the generic workflow timeline panel.
- Modify `components/landing/workflow-timeline.tsx`: keep section placement/copy, use white-grid treatment and `WorkflowIncidentPanel`.
- Create `components/landing/product-surface-previews.tsx`: rich previews for field report, district console, and patient reroute cards.
- Modify `components/landing/product-feature-cards.tsx`: keep cards, use new previews instead of shallow miniatures.
- Create `components/landing/trust-system-panels.tsx`: audit ledger, export, API, and webhook preview panels.
- Modify `components/landing/trust-infrastructure.tsx`: use new trust panels and keep existing trust object summary grid.

## Task 0: Public Branch Hygiene

**Files:**
- No file edits.

- [ ] **Step 1: Start implementation from public main, not local docs**

Run:

```bash
git fetch origin
git switch -c feat/landing-product-reality-pass origin/main
git status --short --branch
```

Expected:

```text
## feat/landing-product-reality-pass...origin/main
```

- [ ] **Step 2: Confirm ignored docs are not staged**

Run:

```bash
git status --short docs .superpowers
```

Expected: no output.

- [ ] **Step 3: Commit checkpoint**

No commit is needed for this task because no files changed.

## Task 1: Add Product Reality Content Contracts

**Files:**
- Modify: `lib/landing/openpanel-refactor-content.test.ts`
- Modify: `lib/landing/openpanel-refactor-content.ts`

- [ ] **Step 1: Write the failing content-contract test**

Add the new imports:

```ts
import {
  demoCta,
  featureCards,
  heroClinicRows,
  heroConsoleMetrics,
  heroConsoleNavItems,
  heroIncident,
  heroStats,
  landingHero,
  operatingGap,
  productSurfacePreviewRows,
  stakeholderProofItems,
  trustObjects,
  trustSystemPanels,
  workflowIncidentStages,
  workflowSteps,
} from "@/lib/landing/openpanel-refactor-content";
```

Add this test below the existing product miniature test:

```ts
it("defines richer product-reality preview data for landing surfaces", () => {
  expect(heroConsoleNavItems.map((item) => item.label)).toEqual([
    "District console",
    "Field reports",
    "Public finder",
    "Audit trail",
  ]);
  expect(heroConsoleMetrics.map((metric) => metric.label)).toEqual([
    "Clinics monitored",
    "Reports synced",
    "Freshness SLA",
  ]);
  expect(heroIncident.clinic).toBe("Mamelodi East Community Clinic");
  expect(heroIncident.recommendedRoute).toBe("Akasia Hills Clinic");
  expect(workflowIncidentStages.map((stage) => stage.surface)).toEqual([
    "Field report",
    "District alert",
    "Public finder",
    "Audit ledger",
  ]);
  expect(productSurfacePreviewRows["field-report"]).toHaveLength(4);
  expect(productSurfacePreviewRows["district-console"]).toHaveLength(4);
  expect(productSurfacePreviewRows["patient-reroute"]).toHaveLength(3);
  expect(trustSystemPanels.map((panel) => panel.title)).toEqual([
    "Audit event",
    "District export",
    "API response",
    "Webhook delivery",
  ]);
});
```

Update the existing leak test collection to include the new data:

```ts
const text = collectText([
  landingHero,
  stakeholderProofItems,
  workflowSteps,
  workflowIncidentStages,
  featureCards,
  productSurfacePreviewRows,
  trustObjects,
  trustSystemPanels,
  heroClinicRows,
  heroConsoleNavItems,
  heroConsoleMetrics,
  heroIncident,
  heroStats,
  operatingGap,
  demoCta,
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- lib/landing/openpanel-refactor-content.test.ts
```

Expected: FAIL with missing exports such as `heroConsoleMetrics`, `workflowIncidentStages`, `productSurfacePreviewRows`, or `trustSystemPanels`.

- [ ] **Step 3: Add the new content exports**

Add these exports to `lib/landing/openpanel-refactor-content.ts` after `heroStats`:

```ts
export const heroConsoleNavItems = [
  { label: "District console", status: "active" },
  { label: "Field reports", status: "3 queued" },
  { label: "Public finder", status: "live" },
  { label: "Audit trail", status: "recording" },
] as const;

export const heroConsoleMetrics = [
  { label: "Clinics monitored", value: "42", detail: "Tshwane North demo" },
  { label: "Reports synced", value: "17", detail: "since 07:00" },
  { label: "Freshness SLA", value: "3m", detail: "median status age" },
] as const;

export const heroIncident = {
  clinic: "Mamelodi East Community Clinic",
  status: "Non-functional",
  source: "Field worker report",
  service: "ARV pickup",
  reason: "Pharmacy stockout",
  age: "Fresh - 2 min ago",
  recommendedRoute: "Akasia Hills Clinic",
  routeDetail: "8.4 km away / ARV pickup accepting",
  auditId: "AUD-2026-0504-017",
} as const;
```

Add these exports after `workflowSteps`:

```ts
export const workflowIncidentStages = [
  {
    surface: "Field report",
    title: "Offline report queued",
    detail: "Mamelodi East / ARV pickup / pharmacy stockout",
    state: "Queued locally",
    tone: "warning",
  },
  {
    surface: "District alert",
    title: "Clinic status changed",
    detail: "Operational -> non-functional from field source",
    state: "Fresh - 2 min ago",
    tone: "critical",
  },
  {
    surface: "Public finder",
    title: "Patient reroute prepared",
    detail: "Akasia Hills Clinic can accept ARV pickup",
    state: "Route ready",
    tone: "healthy",
  },
  {
    surface: "Audit ledger",
    title: "Operating record sealed",
    detail: "Source, sync, status change, and reroute linked",
    state: "AUD-2026-0504-017",
    tone: "neutral",
  },
] as const;
```

Replace each `featureCards[*].miniature.rows` with more concrete rows. Then add this export after `featureCards`:

```ts
export const productSurfacePreviewRows = {
  "field-report": [
    { label: "Clinic", value: "Mamelodi East", tone: "neutral" },
    { label: "Service", value: "ARV pickup", tone: "neutral" },
    { label: "Stock pressure", value: "Pharmacy stockout", tone: "critical" },
    { label: "Sync state", value: "Queued offline", tone: "warning" },
  ],
  "district-console": [
    { label: "Status", value: "Non-functional", tone: "critical" },
    { label: "Source", value: "Field worker", tone: "neutral" },
    { label: "Freshness", value: "2 min ago", tone: "healthy" },
    { label: "Action", value: "Open alert", tone: "neutral" },
  ],
  "patient-reroute": [
    { label: "Nearest compatible", value: "Akasia Hills", tone: "healthy" },
    { label: "Distance", value: "8.4 km", tone: "neutral" },
    { label: "Service", value: "ARV pickup accepting", tone: "healthy" },
  ],
} as const;
```

Add this export after `trustObjects`:

```ts
export const trustSystemPanels = [
  {
    title: "Audit event",
    label: "AUD-2026-0504-017",
    lines: [
      "actor=field_worker",
      "source=offline_sync",
      "status=non_functional",
      "route=Akasia Hills Clinic",
    ],
  },
  {
    title: "District export",
    label: "CSV ready",
    lines: [
      "report=incident_summary",
      "district=Tshwane North Demo",
      "freshness_window=3m",
      "rows=42 clinics",
    ],
  },
  {
    title: "API response",
    label: "200 OK",
    lines: [
      "GET /v1/clinics/mamelodi-east/status",
      "status: non_functional",
      "source: field_worker",
      "updatedAgo: 2m",
    ],
  },
  {
    title: "Webhook delivery",
    label: "Preview sent",
    lines: [
      "destination=partner-readiness",
      "attempt=1",
      "latency=184ms",
      "retry=false",
    ],
  },
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- lib/landing/openpanel-refactor-content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/landing/openpanel-refactor-content.ts lib/landing/openpanel-refactor-content.test.ts
git commit -m "feat: add landing product reality data"
```

## Task 2: Add Shared Product Preview Primitives

**Files:**
- Create: `components/landing/product-preview-primitives.tsx`

- [ ] **Step 1: Create the shared primitives**

Create `components/landing/product-preview-primitives.tsx`:

```tsx
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BrowserFrameProps = {
  children: ReactNode;
  className?: string;
  title: string;
};

export function BrowserFrame({ children, className, title }: BrowserFrameProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl", className)}>
      <div className="flex h-12 min-w-0 items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border border-neutral-200 bg-white px-3 py-1 font-mono text-xs text-neutral-500">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

const toneClasses = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
} as const;

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", toneClasses[tone])}>
      {children}
    </span>
  );
}

export function MetricTile({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </div>
  );
}

export function ProductRow({
  active,
  children,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs transition",
        active ? "border-emerald-200 bg-emerald-50/70" : "border-neutral-200 bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Run lint for the new file**

Run:

```bash
npm run lint -- components/landing/product-preview-primitives.tsx
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/landing/product-preview-primitives.tsx
git commit -m "feat: add landing product preview primitives"
```

## Task 3: Upgrade Hero To Real District Console

**Files:**
- Create: `components/landing/hero-district-console.tsx`
- Modify: `components/landing/openpanel-product-hero.tsx`

- [ ] **Step 1: Create `HeroDistrictConsole`**

Create `components/landing/hero-district-console.tsx`:

```tsx
import { Bell, DatabaseZap, Filter, MapPin, Radio, Route, Search, ShieldCheck } from "lucide-react";

import { BrowserFrame, MetricTile, ProductRow, StatusPill } from "@/components/landing/product-preview-primitives";
import {
  heroClinicRows,
  heroConsoleMetrics,
  heroConsoleNavItems,
  heroIncident,
} from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

const statusTone = {
  critical: "critical",
  warning: "warning",
  healthy: "healthy",
} as const;

export function HeroDistrictConsole() {
  return (
    <div className="relative min-w-0 max-w-full">
      <BrowserFrame title="clinicpulse.demo/district-console">
        <div className="grid min-h-[560px] min-w-0 grid-cols-1 bg-white lg:grid-cols-[9rem_minmax(0,1fr)] xl:grid-cols-[10rem_minmax(0,1fr)_16rem]">
          <aside className="hidden border-r border-neutral-200 bg-neutral-50/80 p-3 lg:block">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Workspace</p>
            <div className="mt-3 grid gap-1.5">
              {heroConsoleNavItems.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-lg px-2.5 py-2 text-xs font-semibold",
                    index === 0 ? "bg-neutral-950 text-white" : "text-neutral-600",
                  )}
                >
                  <span>{item.label}</span>
                  <span className={cn("mt-1 block font-mono text-[10px]", index === 0 ? "text-white/55" : "text-neutral-400")}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          <main className="min-w-0 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Tshwane North Demo</p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-950">District command center</h2>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5">
                  <Search className="size-3.5" />
                  Search clinics
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5">
                  <Filter className="size-3.5" />
                  Status filters
                </span>
                <StatusPill tone="healthy">live sync</StatusPill>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {heroConsoleMetrics.map((metric) => (
                <MetricTile key={metric.label} {...metric} />
              ))}
            </div>

            <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-56 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(255,255,255,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.72)_1px,transparent_1px)] [background-size:28px_28px]" />
                <MapPinDot className="left-[24%] top-[28%]" tone="healthy" />
                <MapPinDot className="left-[48%] top-[32%]" tone="healthy" />
                <MapPinDot className="left-[61%] top-[24%]" tone="warning" />
                <MapPinDot className="left-[36%] top-[58%]" tone="critical" active />
                <MapPinDot className="left-[70%] top-[60%]" tone="healthy" />
                <div className="absolute bottom-3 left-3 rounded-xl border border-neutral-800/10 bg-neutral-950 px-3 py-2 text-white shadow-xl">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Selected clinic</p>
                  <p className="mt-1 text-sm font-semibold">Mamelodi East</p>
                </div>
              </div>

              <div className="grid gap-2">
                {heroClinicRows.map((row, index) => (
                  <ProductRow key={row.clinic} active={index === 0}>
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-neutral-950">{row.clinic}</p>
                        <p className="mt-1 line-clamp-2 text-neutral-500">{row.reason}</p>
                      </div>
                      <StatusPill tone={statusTone[row.tone]}>{row.status}</StatusPill>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-neutral-500">
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Route className="size-3" />
                        {row.action}
                      </span>
                      <span>{row.freshness}</span>
                    </div>
                  </ProductRow>
                ))}
              </div>
            </div>
          </main>

          <aside className="hidden border-l border-neutral-200 bg-white p-3 xl:block">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-red-700" />
                  <p className="text-sm font-semibold text-red-950">Active incident</p>
                </div>
                <StatusPill tone="critical">{heroIncident.status}</StatusPill>
              </div>
              <p className="mt-3 text-sm font-semibold text-neutral-950">{heroIncident.clinic}</p>
              <div className="mt-3 grid gap-2 text-xs text-neutral-700">
                <InfoLine icon={Radio} label="Source" value={heroIncident.source} />
                <InfoLine icon={DatabaseZap} label="Service" value={heroIncident.service} />
                <InfoLine icon={ShieldCheck} label="Audit" value={heroIncident.auditId} />
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Recommended reroute</p>
              <p className="mt-2 text-sm font-semibold text-neutral-950">{heroIncident.recommendedRoute}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">{heroIncident.routeDetail}</p>
            </div>
          </aside>
        </div>
      </BrowserFrame>
      <div className="absolute -bottom-5 right-6 hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-xl lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
          <MapPin className="size-4 text-primary" />
          {heroIncident.recommendedRoute} ready for reroutes
        </div>
      </div>
    </div>
  );
}

function MapPinDot({
  active,
  className,
  tone,
}: {
  active?: boolean;
  className: string;
  tone: "critical" | "warning" | "healthy";
}) {
  const color = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    healthy: "bg-emerald-500",
  }[tone];

  return (
    <span
      className={cn(
        "absolute size-4 rounded-full border-2 border-white shadow-lg",
        active && "ring-4 ring-red-500/15",
        color,
        className,
      )}
    />
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Radio;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-white/80 bg-white/70 px-2.5 py-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-neutral-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
        <p className="mt-0.5 break-words font-semibold text-neutral-800">{value}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace old hero preview import and usage**

In `components/landing/openpanel-product-hero.tsx`, remove the unused icon imports, `statusStyles`, `heroStatIcons`, and the local `ProductPreview` function. Add:

```tsx
import { HeroDistrictConsole } from "@/components/landing/hero-district-console";
```

Replace:

```tsx
<ProductPreview />
```

with:

```tsx
<HeroDistrictConsole />
```

- [ ] **Step 3: Run focused lint**

Run:

```bash
npm run lint -- components/landing/openpanel-product-hero.tsx components/landing/hero-district-console.tsx components/landing/product-preview-primitives.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/landing/openpanel-product-hero.tsx components/landing/hero-district-console.tsx components/landing/product-preview-primitives.tsx
git commit -m "feat: make landing hero preview feel real"
```

## Task 4: Replace Workflow Timeline With Incident Progression

**Files:**
- Create: `components/landing/workflow-incident-panel.tsx`
- Modify: `components/landing/workflow-timeline.tsx`

- [ ] **Step 1: Create `WorkflowIncidentPanel`**

Create `components/landing/workflow-incident-panel.tsx`:

```tsx
import { ArrowRight, ClipboardList } from "lucide-react";

import { ProductRow, StatusPill } from "@/components/landing/product-preview-primitives";
import { workflowIncidentStages } from "@/lib/landing/openpanel-refactor-content";

const toneMap = {
  critical: "critical",
  warning: "warning",
  healthy: "healthy",
  neutral: "neutral",
} as const;

export function WorkflowIncidentPanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <p className="text-sm font-semibold text-neutral-950">Mamelodi East incident</p>
        </div>
        <p className="font-mono text-xs text-neutral-400">LIVE_DEMO / AUD-2026-0504-017</p>
      </div>
      <div className="grid gap-3 p-4">
        {workflowIncidentStages.map((stage, index) => (
          <ProductRow key={stage.surface} active={index === 1} className="grid gap-3 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center">
            <span className="flex size-9 items-center justify-center rounded-md border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{stage.surface}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">{stage.title}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">{stage.detail}</p>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <StatusPill tone={toneMap[stage.tone]}>{stage.state}</StatusPill>
              {index < workflowIncidentStages.length - 1 ? <ArrowRight className="hidden size-4 text-neutral-300 sm:block" /> : null}
            </div>
          </ProductRow>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `WorkflowTimeline`**

Replace the dark rounded container in `components/landing/workflow-timeline.tsx` with:

```tsx
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { WorkflowIncidentPanel } from "@/components/landing/workflow-incident-panel";

export function WorkflowTimeline() {
  return (
    <LandingSection id="flow" className="border-y border-neutral-200">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <LandingSectionHeader
          eyebrow="Product flow"
          title="One operating record from field report to audit trail."
          description="A single clinic incident moves through the field report queue, district alert, patient reroute, and audit ledger without losing source or freshness."
        />
        <WorkflowIncidentPanel />
      </div>
    </LandingSection>
  );
}
```

- [ ] **Step 3: Run focused lint**

Run:

```bash
npm run lint -- components/landing/workflow-timeline.tsx components/landing/workflow-incident-panel.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/landing/workflow-timeline.tsx components/landing/workflow-incident-panel.tsx
git commit -m "feat: show landing workflow as product incident"
```

## Task 5: Upgrade Product Surface Cards

**Files:**
- Create: `components/landing/product-surface-previews.tsx`
- Modify: `components/landing/product-feature-cards.tsx`

- [ ] **Step 1: Create product surface previews**

Create `components/landing/product-surface-previews.tsx`:

```tsx
import { MapPin, Radio, Search, Smartphone } from "lucide-react";

import { ProductRow, StatusPill } from "@/components/landing/product-preview-primitives";
import { productSurfacePreviewRows } from "@/lib/landing/openpanel-refactor-content";

type PreviewType = keyof typeof productSurfacePreviewRows;

const toneMap = {
  critical: "critical",
  warning: "warning",
  healthy: "healthy",
  neutral: "neutral",
} as const;

export function ProductSurfacePreview({ type }: { type: PreviewType }) {
  if (type === "field-report") {
    return <FieldReportPreview />;
  }

  if (type === "district-console") {
    return <DistrictConsolePreview />;
  }

  return <PatientReroutePreview />;
}

function FieldReportPreview() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mx-auto max-w-[15rem] rounded-2xl border border-neutral-300 bg-white p-2 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-950">
            <Smartphone className="size-3.5 text-primary" />
            Field report
          </div>
          <StatusPill tone="warning">offline</StatusPill>
        </div>
        <div className="mt-2 grid gap-2">
          {productSurfacePreviewRows["field-report"].map((row) => (
            <ProductRow key={row.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-500">{row.label}</span>
                <StatusPill tone={toneMap[row.tone]}>{row.value}</StatusPill>
              </div>
            </ProductRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function DistrictConsolePreview() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-950">
            <Radio className="size-3.5 text-primary" />
            District console
          </div>
          <StatusPill tone="healthy">live</StatusPill>
        </div>
        <div className="mt-3 grid gap-2">
          {productSurfacePreviewRows["district-console"].map((row, index) => (
            <ProductRow key={row.label} active={index === 0}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-500">{row.label}</span>
                <StatusPill tone={toneMap[row.tone]}>{row.value}</StatusPill>
              </div>
            </ProductRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientReroutePreview() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 text-xs text-neutral-500">
          <Search className="size-3.5" />
          Mamelodi ARV pickup
        </div>
        <div className="mt-3 grid gap-2">
          {productSurfacePreviewRows["patient-reroute"].map((row, index) => (
            <ProductRow key={row.label} active={index === 0}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-500">{row.label}</span>
                <StatusPill tone={toneMap[row.tone]}>{row.value}</StatusPill>
              </div>
            </ProductRow>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white">
          <MapPin className="size-3.5" />
          Open route
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace shallow miniatures in product cards**

In `components/landing/product-feature-cards.tsx`, import:

```tsx
import { ProductSurfacePreview } from "@/components/landing/product-surface-previews";
```

Remove `miniatureToneStyles`, `ProductMiniature`, and the `cn` import. Replace:

```tsx
<ProductMiniature miniature={feature.miniature} />
```

with:

```tsx
<ProductSurfacePreview type={feature.miniature.type} />
```

- [ ] **Step 3: Run focused lint**

Run:

```bash
npm run lint -- components/landing/product-feature-cards.tsx components/landing/product-surface-previews.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/landing/product-feature-cards.tsx components/landing/product-surface-previews.tsx
git commit -m "feat: make landing product cards inspectable"
```

## Task 6: Upgrade Trust Panels To System Objects

**Files:**
- Create: `components/landing/trust-system-panels.tsx`
- Modify: `components/landing/trust-infrastructure.tsx`

- [ ] **Step 1: Create trust system panels**

Create `components/landing/trust-system-panels.tsx`:

```tsx
import { Braces, FileDown, Send, ShieldCheck, type LucideIcon } from "lucide-react";

import { trustSystemPanels } from "@/lib/landing/openpanel-refactor-content";

const icons = {
  "Audit event": ShieldCheck,
  "District export": FileDown,
  "API response": Braces,
  "Webhook delivery": Send,
} satisfies Record<(typeof trustSystemPanels)[number]["title"], LucideIcon>;

export function TrustSystemPanels() {
  return (
    <div className="grid gap-4">
      {trustSystemPanels.map((panel) => {
        const Icon = icons[panel.title];

        return (
          <div key={panel.title} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                <Icon className="size-4 text-primary" />
                {panel.title}
              </div>
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-neutral-500">
                {panel.label}
              </span>
            </div>
            <div className="grid gap-2 p-4 font-mono text-xs text-neutral-700">
              {panel.lines.map((line) => (
                <p key={line} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                  {line}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Replace old trust code panels**

In `components/landing/trust-infrastructure.tsx`, remove imports for `Braces`, `FileDown`, `ShieldCheck`, and `LucideIcon`. Add:

```tsx
import { TrustSystemPanels } from "@/components/landing/trust-system-panels";
```

Replace the entire right-side `<div className="grid gap-4">...</div>` with:

```tsx
<TrustSystemPanels />
```

Remove the local `CodePanel` function.

- [ ] **Step 3: Run focused lint**

Run:

```bash
npm run lint -- components/landing/trust-infrastructure.tsx components/landing/trust-system-panels.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/landing/trust-infrastructure.tsx components/landing/trust-system-panels.tsx
git commit -m "feat: make landing trust panels feel operational"
```

## Task 7: Full Verification And Visual Review

**Files:**
- No planned source edits unless verification exposes defects.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm run test
npm run lint
npm run build
```

Expected:

```text
Test Files 22 passed
```

The exact test count may increase because Task 1 adds a test case inside an existing test file. `npm run lint` and `npm run build` must exit 0.

- [ ] **Step 2: Run the landing page locally**

Run:

```bash
npm run dev
```

Open the printed localhost URL and inspect `/`.

- [ ] **Step 3: Visual acceptance pass**

Check these points manually:

- Hero preview reads as a district console, not a decorative card.
- Workflow remains in the same section position and no longer appears as a full black background block.
- Product cards show rich UI states for field report, district console, and patient reroute.
- Trust panels look like audit/export/API/webhook records.
- Green is used for status/live/action states, not as the dominant page background.
- Mobile width does not overlap text or squeeze pills outside cards.

- [ ] **Step 4: Stop dev server**

Stop the dev server with `Ctrl-C`. Confirm no required session is still running.

- [ ] **Step 5: Final commit if verification required fixes**

If visual or build fixes were needed:

```bash
git add components/landing lib/landing
git commit -m "fix: polish landing product reality pass"
```

If no fixes were needed, no commit is required.

## Plan Self-Review

Spec coverage:

- Hero preview credibility is covered in Task 3.
- Workflow incident progression is covered in Task 4.
- Product cards with inspectable product slices are covered in Task 5.
- Trust system objects are covered in Task 6.
- Product-state copy and leak guards are covered in Task 1.
- Public docs hygiene is covered in Task 0.
- Automated and visual verification are covered in Task 7.

Placeholder scan:

- The plan contains concrete file paths, commands, and code snippets for each source change.
- No step depends on unspecified functions or unowned files.

Type consistency:

- `productSurfacePreviewRows` keys match `feature.miniature.type`.
- `trustSystemPanels[*].title` matches the `icons` record in `trust-system-panels.tsx`.
- Tone values match `StatusPill` tone keys.
