# ClinicPulse Phase 1 Demo Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing frontend-only ClinicPulse demo so it is reliable, honest, testable, and strong enough for founder-led stakeholder demos.

**Architecture:** Keep the current Next.js App Router frontend and local demo store. Extract pure finder logic into `lib/demo/finder.ts`, add Vitest coverage for scenario/selectors/finder behavior, add loading skeletons for high-value demo routes, fix lint warnings, and add a founder runbook that defines the seven-minute demo flow.

**Tech Stack:** Next.js 16.2.4 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, Vitest, local mock data, browser localStorage demo persistence.

---

## File Structure

- Modify: `package.json` - add `test` and `test:watch` scripts after installing Vitest.
- Modify: `package-lock.json` - lock the test dependencies installed by npm.
- Create: `vitest.config.ts` - configure Vitest for TypeScript and the `@/*` path alias.
- Create: `lib/demo/finder.ts` - pure utilities for finder filtering, distance estimates, unavailable detection, and alternatives.
- Create: `lib/demo/finder.test.ts` - regression tests for public finder behavior.
- Create: `lib/demo/scenarios.test.ts` - regression tests for report/scenario transitions.
- Create: `lib/demo/selectors.test.ts` - regression tests for derived demo state.
- Modify: `components/demo/clinic-finder.tsx` - use `lib/demo/finder.ts` instead of local helper functions.
- Modify: `components/landing/scenario-hero.tsx` - remove unused imports/variables and surface recent report count if useful.
- Create: `app/(demo)/demo/loading.tsx` - loading skeleton for the district console route.
- Create: `app/(demo)/finder/loading.tsx` - loading skeleton for the finder route.
- Create: `app/(demo)/clinics/[clinicId]/loading.tsx` - loading skeleton for clinic detail route.
- Modify: `docs/demo/frontend-ui-demo-map.md` - update route map, demo notes, and acceptance checklist.
- Create: `docs/demo/phase-1-founder-runbook.md` - practical founder runbook for the demo.

## Task 1: Add Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run:

```bash
npm install -D vitest
```

Expected: `package.json` and `package-lock.json` update with `vitest` in `devDependencies`.

- [ ] **Step 2: Add test scripts**

In `package.json`, update the `scripts` object to include `test` and `test:watch`.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
```

- [ ] **Step 4: Run empty test suite**

Run:

```bash
npm run test
```

Expected: command exits with code `1` because no test files exist yet, or exits with a "No test files found" message depending on the installed Vitest version. Continue after confirming Vitest is installed and runnable.

- [ ] **Step 5: Commit test harness**

Run:

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add vitest harness for demo logic"
```

## Task 2: Extract Finder Logic

**Files:**
- Create: `lib/demo/finder.ts`
- Modify: `components/demo/clinic-finder.tsx`
- Test: `lib/demo/finder.test.ts`

- [ ] **Step 1: Create failing finder tests**

Create `lib/demo/finder.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  buildFinderAlternatives,
  estimateDistanceKm,
  filterClinicRows,
  isClinicUnavailable,
  sortClinicRowsByDistance,
} from "@/lib/demo/finder";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getClinicRows } from "@/lib/demo/selectors";

describe("finder utilities", () => {
  const state = createInitialDemoState();
  const clinics = getClinicRows(state);

  it("marks unsafe statuses and stale freshness as unavailable", () => {
    expect(isClinicUnavailable({ status: "non_functional", freshness: "fresh" })).toBe(true);
    expect(isClinicUnavailable({ status: "unknown", freshness: "fresh" })).toBe(true);
    expect(isClinicUnavailable({ status: "operational", freshness: "stale" })).toBe(true);
    expect(isClinicUnavailable({ status: "operational", freshness: "needs_confirmation" })).toBe(true);
    expect(isClinicUnavailable({ status: "operational", freshness: "fresh" })).toBe(false);
  });

  it("filters by query, status, and service", () => {
    const filtered = filterClinicRows(clinics, {
      query: "mamelodi",
      status: "degraded",
      service: "arv",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toMatch(/Mamelodi/i);
    expect(filtered[0].status).toBe("degraded");
    expect(filtered[0].services.join(" ").toLowerCase()).toContain("arv");
  });

  it("sorts clinics by distance from the public finder base point", () => {
    const sorted = sortClinicRowsByDistance(clinics);

    expect(sorted.length).toBeGreaterThan(1);
    expect(sorted[0].distanceKm).toBeLessThanOrEqual(sorted[1].distanceKm);
  });

  it("estimates a positive distance", () => {
    const distance = estimateDistanceKm(clinics[0].latitude, clinics[0].longitude);

    expect(distance).toBeGreaterThan(0);
  });

  it("builds alternatives with compatible services and freshness-aware routing reasons", () => {
    const unavailableClinic = clinics.find((clinic) => isClinicUnavailable(clinic));

    expect(unavailableClinic).toBeDefined();

    const alternatives = buildFinderAlternatives(clinics, unavailableClinic!);

    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives[0].compatibilityServices.length).toBeGreaterThan(0);
    expect(alternatives[0].distanceKm).toBeGreaterThan(0);
    expect(alternatives[0].estimatedMinutes).toBeGreaterThanOrEqual(5);
    expect(alternatives[0].reason.length).toBeGreaterThan(10);
    expect(alternatives[0].clinic.status).not.toBe("non_functional");
  });
});
```

- [ ] **Step 2: Run the failing finder tests**

Run:

```bash
npm run test -- lib/demo/finder.test.ts
```

Expected: FAIL with an import error for `@/lib/demo/finder`.

- [ ] **Step 3: Create finder utility module**

Create `lib/demo/finder.ts`:

```ts
import type { ClinicRow, ClinicStatus, Freshness } from "@/lib/demo/types";

const BASE_COORDS: [number, number] = [-25.74, 28.13];

export type FinderFilters = {
  query: string;
  service: string;
  status: string;
};

export type FinderClinicDistance = {
  clinic: ClinicRow;
  distanceKm: number;
};

export type FinderAlternative = {
  clinic: ClinicRow;
  distanceKm: number;
  estimatedMinutes: number;
  compatibilityServices: string[];
  reason: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isClinicStatus(value: string): value is ClinicStatus {
  return ["operational", "degraded", "non_functional", "unknown"].includes(value);
}

export function estimateDistanceKm(lat: number, lng: number) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const [baseLat, baseLng] = BASE_COORDS;
  const dLat = toRadians(lat - baseLat);
  const dLng = toRadians(lng - baseLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(baseLat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) ** 2;

  return Math.max(0.3, 2 * 6371 * Math.asin(Math.sqrt(a)));
}

export function isClinicUnavailable(clinic: {
  status: ClinicStatus;
  freshness: Freshness;
}) {
  return (
    clinic.status === "non_functional" ||
    clinic.status === "unknown" ||
    clinic.freshness === "stale" ||
    clinic.freshness === "needs_confirmation"
  );
}

export function filterClinicRows(clinics: ClinicRow[], filters: FinderFilters) {
  const normalizedQuery = normalize(filters.query);
  const normalizedService = normalize(filters.service);
  const normalizedStatus = normalize(filters.status);

  return clinics.filter((clinic) => {
    const hasStatusFilter = isClinicStatus(normalizedStatus)
      ? clinic.status === normalizedStatus
      : true;

    if (!hasStatusFilter) {
      return false;
    }

    const hasServiceFilter = normalizedService
      ? clinic.services.some((item) => normalize(item).includes(normalizedService))
      : true;

    if (!hasServiceFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      clinic.name,
      clinic.district,
      clinic.facilityCode,
      clinic.services.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortClinicRowsByDistance(
  clinics: ClinicRow[],
): FinderClinicDistance[] {
  return [...clinics]
    .map((clinic) => ({
      clinic,
      distanceKm: estimateDistanceKm(clinic.latitude, clinic.longitude),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

function getAlternativeRank(clinic: ClinicRow) {
  if (clinic.status === "operational" && clinic.freshness === "fresh") {
    return 0;
  }

  if (clinic.status === "operational") {
    return 1;
  }

  if (clinic.status === "degraded" && clinic.freshness !== "stale") {
    return 2;
  }

  return 3;
}

function buildAlternativeReason(clinic: ClinicRow) {
  if (clinic.status === "operational" && clinic.freshness === "fresh") {
    return "Operational with fresh status and compatible services for immediate routing.";
  }

  if (clinic.status === "operational") {
    return "Operational, but confirm freshness before sending high-risk patients.";
  }

  return "Degraded but can absorb selected compatible services while the source clinic is unavailable.";
}

export function buildFinderAlternatives(
  clinics: ClinicRow[],
  selectedClinic: ClinicRow,
): FinderAlternative[] {
  return clinics
    .filter((candidate) => candidate.id !== selectedClinic.id)
    .map((candidate) => ({
      clinic: candidate,
      compatibilityServices: candidate.services.filter((service) =>
        selectedClinic.services.includes(service),
      ),
      distanceKm: estimateDistanceKm(candidate.latitude, candidate.longitude),
    }))
    .filter((candidate) => candidate.compatibilityServices.length > 0)
    .filter((candidate) => candidate.clinic.status !== "non_functional")
    .filter((candidate) => candidate.clinic.status !== "unknown")
    .sort((left, right) => {
      const rankDelta =
        getAlternativeRank(left.clinic) - getAlternativeRank(right.clinic);

      if (rankDelta !== 0) {
        return rankDelta;
      }

      return left.distanceKm - right.distanceKm;
    })
    .slice(0, 4)
    .map((candidate) => ({
      ...candidate,
      estimatedMinutes: Math.max(5, Math.round(candidate.distanceKm * 2.8)),
      reason: buildAlternativeReason(candidate.clinic),
    }));
}
```

- [ ] **Step 4: Refactor clinic finder component**

In `components/demo/clinic-finder.tsx`, remove the local `BASE_COORDS`, `normalize`, `estimateDistance`, `isClinicUnavailable`, and `buildAlternatives` helpers. Import the utility functions:

```ts
import {
  buildFinderAlternatives,
  filterClinicRows,
  isClinicUnavailable,
  sortClinicRowsByDistance,
} from "@/lib/demo/finder";
```

Replace the filtered/sorted/alternatives logic with:

```ts
  const filtered = useMemo(
    () => filterClinicRows(clinics, { query, service, status }),
    [clinics, query, service, status],
  );

  const sorted = useMemo(() => sortClinicRowsByDistance(filtered), [filtered]);

  const selectedClinicRow =
    sorted.find((entry) => entry.clinic.id === selectedClinicId)?.clinic ??
    sorted[0]?.clinic;

  const alternatives = selectedClinicRow
    ? buildFinderAlternatives(clinics, selectedClinicRow)
    : [];
```

Replace `entry.distance.toFixed(1)` with:

```ts
entry.distanceKm.toFixed(1)
```

Keep the existing `ReroutePanel` call but map from `FinderAlternative` values:

```tsx
<ReroutePanel
  sourceClinicName={selectedClinicRow.name}
  unavailable={isClinicUnavailable(selectedClinicRow)}
  reason={selectedClinicRow.reason}
  recommendations={alternatives.map((entry) => ({
    clinic: entry.clinic,
    distanceKm: entry.distanceKm,
    estimatedMinutes: entry.estimatedMinutes,
    compatibilityServices: entry.compatibilityServices,
    reason: entry.reason,
  }))}
/>
```

- [ ] **Step 5: Run finder tests**

Run:

```bash
npm run test -- lib/demo/finder.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run lint**

Run:

```bash
npm run lint
```

Expected: zero errors. Existing warnings from `components/landing/scenario-hero.tsx` may remain until Task 5.

- [ ] **Step 7: Commit finder extraction**

Run:

```bash
git add lib/demo/finder.ts lib/demo/finder.test.ts components/demo/clinic-finder.tsx
git commit -m "refactor: extract demo finder logic"
```

## Task 3: Cover Demo Scenario Transitions

**Files:**
- Create: `lib/demo/scenarios.test.ts`
- Test existing: `lib/demo/scenarios.ts`

- [ ] **Step 1: Create scenario tests**

Create `lib/demo/scenarios.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  createInitialDemoState,
  createQueuedOfflineReport,
  submitFieldReportScenario,
  syncOfflineReportsScenario,
  triggerStaffingShortageScenario,
  triggerStockoutScenario,
} from "@/lib/demo/scenarios";
import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";

describe("demo scenarios", () => {
  it("creates a stockout report, alert, status update, and audit events", () => {
    const initial = createInitialDemoState();
    const next = triggerStockoutScenario(
      initial,
      STOCKOUT_TRIGGER_CLINIC_ID,
      "2026-05-02T08:00:00.000Z",
    );

    const clinicState = next.clinicStates.find(
      (entry) => entry.clinicId === STOCKOUT_TRIGGER_CLINIC_ID,
    );

    expect(clinicState?.stockPressure).toBe("stockout");
    expect(clinicState?.source).toBe("demo_control");
    expect(next.reports[0].clinicId).toBe(STOCKOUT_TRIGGER_CLINIC_ID);
    expect(next.alerts[0].type).toBe("stockout");
    expect(next.auditEvents.some((event) => event.eventType === "clinic.status_changed")).toBe(true);
  });

  it("creates a staffing shortage scenario with critical staffing pressure", () => {
    const initial = createInitialDemoState();
    const next = triggerStaffingShortageScenario(
      initial,
      STAFFING_TRIGGER_CLINIC_ID,
      "2026-05-02T09:00:00.000Z",
    );

    const clinicState = next.clinicStates.find(
      (entry) => entry.clinicId === STAFFING_TRIGGER_CLINIC_ID,
    );

    expect(clinicState?.status).toBe("degraded");
    expect(clinicState?.staffPressure).toBe("critical");
    expect(clinicState?.queuePressure).toBe("high");
    expect(next.alerts[0].type).toBe("staffing_shortage");
  });

  it("submits an online field report into current state and report history", () => {
    const initial = createInitialDemoState();
    const clinicId = initial.clinics[0].id;
    const next = submitFieldReportScenario(
      initial,
      {
        clinicId,
        reporterName: "Nomsa Dlamini",
        source: "field_worker",
        status: "operational",
        reason: "Clinic opened with normal queue pressure after morning handover.",
        staffPressure: "normal",
        stockPressure: "normal",
        queuePressure: "low",
        notes: "All core services available.",
      },
      "2026-05-02T10:00:00.000Z",
    );

    expect(next.reports[0].reporterName).toBe("Nomsa Dlamini");
    expect(next.reports[0].offlineCreated).toBe(false);
    expect(next.clinicStates.find((entry) => entry.clinicId === clinicId)?.status).toBe("operational");
    expect(next.auditEvents[0].eventType).toBe("report.submitted");
  });

  it("syncs queued offline reports and resolves offline queue alerts", () => {
    const initial = createInitialDemoState();
    const clinicId = initial.clinics[0].id;
    const queuedReport = createQueuedOfflineReport(
      {
        clinicId,
        reporterName: "Sipho Nkosi",
        source: "field_worker",
        status: "degraded",
        reason: "Offline report confirmed elevated queues after network recovery.",
        staffPressure: "strained",
        stockPressure: "low",
        queuePressure: "high",
        notes: "Queued while offline.",
      },
      "2026-05-02T11:00:00.000Z",
    );

    const queuedState = {
      ...initial,
      offlineQueue: [queuedReport],
      alerts: [
        {
          id: "alert-offline-test",
          clinicId,
          type: "offline_queue_delay" as const,
          severity: "medium" as const,
          status: "open" as const,
          recommendedAction: "Sync queued reports.",
          createdAt: "2026-05-02T11:00:00.000Z",
        },
        ...initial.alerts,
      ],
    };

    const next = syncOfflineReportsScenario(
      queuedState,
      "2026-05-02T11:05:00.000Z",
    );

    expect(next.offlineQueue).toHaveLength(0);
    expect(next.lastSyncAt).toBe("2026-05-02T11:05:00.000Z");
    expect(next.reports[0].offlineCreated).toBe(true);
    expect(next.clinicStates.find((entry) => entry.clinicId === clinicId)?.queuePressure).toBe("high");
    expect(
      next.alerts.find((alert) => alert.id === "alert-offline-test")?.status,
    ).toBe("resolved");
    expect(next.auditEvents[0].eventType).toBe("demo.offline_sync_triggered");
  });
});
```

- [ ] **Step 2: Run scenario tests**

Run:

```bash
npm run test -- lib/demo/scenarios.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit scenario tests**

Run:

```bash
git add lib/demo/scenarios.test.ts
git commit -m "test: cover demo scenario transitions"
```

## Task 4: Cover Demo Selectors

**Files:**
- Create: `lib/demo/selectors.test.ts`
- Test existing: `lib/demo/selectors.ts`

- [ ] **Step 1: Create selector tests**

Create `lib/demo/selectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createInitialDemoState } from "@/lib/demo/scenarios";
import {
  getActiveAlerts,
  getAlternativeClinics,
  getClinicAuditEvents,
  getClinicReports,
  getClinicRows,
  getRecentReportStream,
  getStatusCounts,
} from "@/lib/demo/selectors";

describe("demo selectors", () => {
  const state = createInitialDemoState();

  it("counts current clinic statuses", () => {
    const counts = getStatusCounts(state);
    const total =
      counts.operational +
      counts.degraded +
      counts.non_functional +
      counts.unknown;

    expect(total).toBe(state.clinicStates.length);
    expect(counts.operational).toBeGreaterThan(0);
  });

  it("joins clinics with current status and image metadata", () => {
    const rows = getClinicRows(state);

    expect(rows).toHaveLength(state.clinics.length);
    expect(rows[0].name.length).toBeGreaterThan(0);
    expect(rows[0].status).toBeDefined();
    expect(rows[0].image.src.length).toBeGreaterThan(0);
  });

  it("sorts active alerts by severity before time", () => {
    const alerts = getActiveAlerts(state);

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].status).not.toBe("resolved");
    expect(["critical", "high"]).toContain(alerts[0].severity);
  });

  it("returns reports and audit events for one clinic in recent-first order", () => {
    const clinicId = state.clinics[0].id;
    const reports = getClinicReports(state, clinicId);
    const auditEvents = getClinicAuditEvents(state, clinicId);

    expect(reports.length).toBeGreaterThan(0);
    expect(auditEvents.length).toBeGreaterThan(0);
    expect(new Date(reports[0].receivedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(reports[reports.length - 1].receivedAt).getTime(),
    );
  });

  it("returns routing alternatives that are not non-functional", () => {
    const source = getClinicRows(state).find((clinic) => clinic.services.length > 0);

    expect(source).toBeDefined();

    const alternatives = getAlternativeClinics(
      state,
      source!.id,
      source!.services[0],
    );

    expect(alternatives.every((clinic) => clinic.id !== source!.id)).toBe(true);
    expect(alternatives.every((clinic) => clinic.status !== "non_functional")).toBe(true);
  });

  it("joins report stream items to clinic names and facility codes", () => {
    const stream = getRecentReportStream(state);

    expect(stream.length).toBeGreaterThan(0);
    expect(stream[0].clinicName.length).toBeGreaterThan(0);
    expect(stream[0].facilityCode.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run selector tests**

Run:

```bash
npm run test -- lib/demo/selectors.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit selector tests**

Run:

```bash
git add lib/demo/selectors.test.ts
git commit -m "test: cover demo selectors"
```

## Task 5: Fix Landing Hero Lint Warnings

**Files:**
- Modify: `components/landing/scenario-hero.tsx`

- [ ] **Step 1: Remove unused import**

In `components/landing/scenario-hero.tsx`, remove `CalendarClock` from the `lucide-react` import list.

- [ ] **Step 2: Use report stream count in the hero chrome**

Keep the existing `reportStream` memo and add a compact report count beside the alert/offline chips:

```tsx
<span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
  {reportStream.length} reports
</span>
```

Place it after the active alerts chip:

```tsx
<span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
  {activeAlerts.length} active alerts
</span>
<span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
  {reportStream.length} reports
</span>
<span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
  {state.offlineQueue.length} queued offline
</span>
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: zero errors and zero warnings.

- [ ] **Step 4: Commit lint fix**

Run:

```bash
git add components/landing/scenario-hero.tsx
git commit -m "fix: clear landing hero lint warnings"
```

## Task 6: Add Demo Route Loading States

**Files:**
- Create: `app/(demo)/demo/loading.tsx`
- Create: `app/(demo)/finder/loading.tsx`
- Create: `app/(demo)/clinics/[clinicId]/loading.tsx`

- [ ] **Step 1: Create district console loading skeleton**

Create `app/(demo)/demo/loading.tsx`:

```tsx
import { Skeleton } from "@/components/demo/skeleton";

export default function DemoLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <div className="grid gap-3 md:grid-cols-4">
        {["status", "alerts", "reports", "sync"].map((item) => (
          <Skeleton key={item} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,0.95fr)]">
        <div className="grid gap-4">
          <Skeleton className="h-[380px] rounded-lg" />
          <Skeleton className="h-[420px] rounded-lg" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-[420px] rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create finder loading skeleton**

Create `app/(demo)/finder/loading.tsx`:

```tsx
import { Skeleton } from "@/components/demo/skeleton";

export default function FinderLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <Skeleton className="h-40 rounded-lg" />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <Skeleton className="h-[560px] rounded-lg" />
        <div className="grid gap-4">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Create clinic detail loading skeleton**

Create `app/(demo)/clinics/[clinicId]/loading.tsx`:

```tsx
import { Skeleton } from "@/components/demo/skeleton";

export default function ClinicDetailLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <Skeleton className="h-72 rounded-lg" />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: production build exits successfully.

- [ ] **Step 5: Commit loading states**

Run:

```bash
git add app/'(demo)'/demo/loading.tsx app/'(demo)'/finder/loading.tsx app/'(demo)'/clinics/'[clinicId]'/loading.tsx
git commit -m "feat: add demo route loading states"
```

## Task 7: Document Founder Demo Runbook

**Files:**
- Modify: `docs/demo/frontend-ui-demo-map.md`
- Create: `docs/demo/phase-1-founder-runbook.md`

- [ ] **Step 1: Replace demo map with Phase 1 route map**

Update `docs/demo/frontend-ui-demo-map.md`:

```md
# ClinicPulse Frontend UI Demo Map

## Route Map

- `/` - public landing page with seeded scenario preview and CTA to `/book-demo`.
- `/demo` - district console for status summary, map, clinic table, side panel, report stream, alerts, demo controls, and reroute trigger.
- `/clinics/[clinicId]` - clinic detail page for status reason, freshness, latest report, audit trail, services, and alternatives.
- `/finder` - public clinic finder with query, service, status filters, and reroute recommendations.
- `/field` - mobile-style field reporting flow with online submission, offline queue, and sync simulation.
- `/admin` - founder operations deck with leads, export preview, API preview, roadmap modules, and demo reset.
- `/book-demo` - public demo request flow.
- `/book-demo/thanks` - booking confirmation path.

## Demo Data Boundary

- All current app data is seeded or stored locally in the browser.
- `lib/demo/demo-store.tsx` owns client-side state changes.
- `lib/demo/storage.ts` persists demo leads and offline queued reports in localStorage.
- No Phase 1 route calls a production backend.
- API and export surfaces are previews of the future integration contract.

## Founder Demo Sequence

1. Open `/demo`.
2. Trigger stockout and select the affected clinic.
3. Show status counts, map pin, alert list, side panel, and report stream.
4. Open `/field`, toggle offline mode, queue a report, return online, and sync.
5. Open `/finder`, search for the affected clinic, and show alternatives.
6. Open `/clinics/[clinicId]` from the selected clinic and show audit history.
7. Open `/admin`, show export/API preview, and reset demo state.
8. Open `/book-demo` as the conversion path.

## Acceptance Checklist

- [ ] `npm run lint` exits with zero warnings.
- [ ] `npm run test` exits successfully.
- [ ] `npm run build` exits successfully.
- [ ] `/demo` loads with seeded district state.
- [ ] Console scenario controls visibly update map, table, side panel, alerts, and report stream.
- [ ] `/field` can queue and sync an offline report.
- [ ] `/finder` can search by clinic/service/status and show alternatives.
- [ ] `/clinics/[clinicId]` shows status, freshness, reports, audit events, and alternatives.
- [ ] `/admin` can add and retag a lead and show exported artifacts.
- [ ] `/book-demo` transitions to `/book-demo/thanks`.
- [ ] Demo copy labels seeded or mock data clearly.
```

- [ ] **Step 2: Create founder runbook**

Create `docs/demo/phase-1-founder-runbook.md`:

```md
# ClinicPulse Phase 1 Founder Demo Runbook

## Purpose

Use this runbook to run the frontend-only ClinicPulse demo as a seven-minute founder walkthrough. The demo proves one loop: report clinic availability, update district visibility, route around unavailable clinics, and preserve trust through freshness and audit history.

## Pre-Demo Reset

1. Start the app with `npm run dev`.
2. Open `/admin`.
3. Click `Reset demo state`.
4. Open `/demo`.
5. Confirm the status summary, map, clinic table, side panel, alerts, and report stream render with seeded data.

## Seven-Minute Flow

### 1. District Visibility

Route: `/demo`

Action: point to the status cards, map, and table.

Talking point: ClinicPulse answers whether each clinic can serve patients right now, with status, reason, source, and freshness.

### 2. Operational Incident

Route: `/demo`

Action: click `Trigger stockout`.

Talking point: A stockout turns a facility into a routing problem, not just a report. The console updates the status, alert, report stream, and reroute recommendation.

### 3. Field Report

Route: `/field`

Action: choose the affected clinic, toggle offline mode, submit a report, return online, and sync.

Talking point: Offline mode is supported because field reporting cannot depend on perfect connectivity.

### 4. Public Routing

Route: `/finder`

Action: search for the affected clinic or filter by service.

Talking point: A patient or coordinator sees that the selected clinic needs a reroute and gets compatible alternatives with freshness and distance.

### 5. Facility Trust Record

Route: `/clinics/[clinicId]`

Action: open the affected clinic detail page from the finder or console.

Talking point: Every status needs a reason, timestamp, source, and audit trail. Stale or uncertain status should not look as trustworthy as fresh status.

### 6. Infrastructure Proof

Route: `/admin`

Action: show lead queue, export preview, API preview, and roadmap modules.

Talking point: The current product is frontend-only, but the data model already points toward reports, audit history, exports, APIs, and partner workflows.

### 7. Conversion

Route: `/book-demo`

Action: show the booking form and confirmation path.

Talking point: The public site earns the meeting; the product demo earns belief.

## Failure Recovery

- If local state looks inconsistent, open `/admin` and click `Reset demo state`.
- If an offline report does not appear in the console, return to `/field`, switch online, and click sync.
- If finder results look too narrow, clear the URL query string and reload `/finder`.
- If a route feels slow, use the sidebar or direct route URL instead of browser back/forward.

## Demo Honesty Statement

Phase 1 is a frontend-only demo. Clinic, report, lead, export, and API data are seeded or locally stored in the browser. The demo shows the operating model and the user experience before the Go backend and PostgreSQL persistence are built.
```

- [ ] **Step 3: Commit demo docs**

Run:

```bash
git add docs/demo/frontend-ui-demo-map.md docs/demo/phase-1-founder-runbook.md
git commit -m "docs: add phase 1 founder demo runbook"
```

## Task 8: Final Verification

**Files:**
- Verify all changed files from Tasks 1-7.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: zero errors and zero warnings.

- [ ] **Step 2: Run tests**

Run:

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: production build exits successfully and lists the demo routes.

- [ ] **Step 4: Review docs for seeded-data honesty**

Run:

```bash
rg -n "seeded|mock|frontend-only|localStorage|API preview|export preview" docs/demo docs/superpowers/specs/2026-05-02-phase-1-demo-hardening-design.md
```

Expected: the command prints lines from the demo map, founder runbook, and design spec showing that the data boundary is explicit.

- [ ] **Step 5: Inspect working tree**

Run:

```bash
git status --short
```

Expected: no uncommitted changes after all task commits.

## Self-Review

Spec coverage:

- Demo integrity is covered by Task 7 and Task 8.
- Scenario reliability is covered by Task 3.
- Finder and routing quality is covered by Task 2.
- Loading and navigation feedback is covered by Task 6.
- Testing is covered by Tasks 1-4 and Task 8.
- Lint health is covered by Task 5 and Task 8.

Placeholder scan:

- The plan contains no placeholder tasks.
- Each implementation task has exact files, commands, and expected results.

Type consistency:

- `FinderAlternative`, `FinderClinicDistance`, and `FinderFilters` are defined in Task 2 before component usage.
- Test imports match the functions created in `lib/demo/finder.ts`.
