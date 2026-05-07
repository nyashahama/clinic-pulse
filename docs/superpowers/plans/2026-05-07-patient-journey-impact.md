# Patient Journey Impact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-surface before/after patient journey that shows a wasted trip avoided, wasted-travel minutes saved, and a nearby compatible clinic recommendation.

**Architecture:** Add one pure patient-journey utility that formats existing clinic and alternative recommendation data without changing routing rank logic. Add one reusable journey impact component, then wire it into the public finder and authenticated clinic detail evidence surface. Strengthen the existing landing routing moment with the same language so all three surfaces tell one consistent story.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS utilities, lucide-react icons, Vitest.

---

## File Structure

- Create `lib/demo/patient-journey.ts`: pure journey model, builder, labels, distance/minute formatting.
- Create `lib/demo/patient-journey.test.ts`: unit coverage for successful reroute, available clinic, no recommendation, backend null metrics, and wording.
- Create `components/demo/patient-journey-impact.tsx`: reusable before/after impact and evidence component for finder and clinic detail.
- Modify `components/demo/clinic-finder.tsx`: build journey impact from selected clinic + recommendations, show the patient-facing component, and link directions to the recommendation when available.
- Modify `app/(demo)/demo/clinics/[clinicId]/page-client.tsx`: reuse existing recommendations to show the operator evidence version beside the reroute panel.
- Modify `components/landing/landing-scenario-data.ts`: align landing journey copy with the approved "wasted trip avoided" framing.
- Modify `components/landing/routing-moment.tsx`: surface the approved proof metrics in the landing visual.
- Modify `lib/demo/finder-route.test.ts`: source-boundary assertions for new finder and clinic-detail wiring.
- Create `lib/landing/patient-journey-copy.test.ts`: landing copy contract for the patient journey wording.

---

### Task 1: Patient Journey Utility

**Files:**
- Create: `lib/demo/patient-journey.ts`
- Create: `lib/demo/patient-journey.test.ts`

- [ ] **Step 1: Write the failing utility tests**

Create `lib/demo/patient-journey.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { AlternativeRecommendation } from "@/lib/demo/alternatives";
import {
  buildPatientJourneyImpact,
  formatImpactDistance,
  formatImpactMinutes,
} from "@/lib/demo/patient-journey";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getClinicRows } from "@/lib/demo/selectors";
import type { ClinicRow } from "@/lib/demo/types";

function getRows() {
  return getClinicRows(createInitialDemoState());
}

function cloneClinic(row: ClinicRow, overrides: Partial<ClinicRow> = {}): ClinicRow {
  return {
    ...row,
    services: [...row.services],
    ...overrides,
  };
}

function recommendation(
  clinic: ClinicRow,
  overrides: Partial<AlternativeRecommendation> = {},
): AlternativeRecommendation {
  return {
    clinic,
    distanceKm: 6.4,
    estimatedMinutes: 18,
    compatibilityServices: ["Primary care", "Pharmacy"],
    reason: "Operational and fresh with requested service.",
    ...overrides,
  };
}

describe("buildPatientJourneyImpact", () => {
  it("builds a successful journey for an unavailable source and top recommendation", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      freshness: "fresh",
      reason: "Pharmacy stockout reported by field worker.",
    });
    const recommended = cloneClinic(rows[7], {
      id: "clinic-akasia-hills",
      name: "Akasia Hills Clinic",
      status: "operational",
      freshness: "fresh",
      services: ["Primary care", "Pharmacy", "Immunization"],
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(recommended)],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.sourceClinic.id).toBe(source.id);
    expect(impact.recommendedClinic?.id).toBe("clinic-akasia-hills");
    expect(impact.beforeOutcome).toBe("Wasted trip likely");
    expect(impact.afterOutcome).toBe("Best nearby compatible clinic chosen");
    expect(impact.impactMetrics.wastedTripAvoided).toBe(true);
    expect(impact.impactMetrics.estimatedWastedTravelMinutesSaved).toBeGreaterThan(0);
    expect(impact.impactMetrics.compatibleServices).toEqual(["Primary care", "Pharmacy"]);
    expect(impact.trustSignals.reason).toBe(source.reason);
    expect(impact.trustSignals.lastReportedAt).toBe(source.lastReportedAt);
    expect(impact.trustSignals.recommendation).toEqual({
      status: recommended.status,
      freshness: recommended.freshness,
      lastReportedAt: recommended.lastReportedAt,
      reason: "Operational and fresh with requested service.",
    });
  });

  it("uses the first eligible service-compatible recommendation without re-ranking alternatives", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const first = cloneClinic(rows[1], {
      id: "first-ranked",
      status: "unknown",
      freshness: "fresh",
    });
    const second = cloneClinic(rows[2], {
      id: "second-ranked",
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [
        recommendation(first, { distanceKm: 30 }),
        recommendation(second, { distanceKm: 1 }),
      ],
    });

    expect(impact.recommendedClinic?.id).toBe("second-ranked");
  });

  it("uses an existing ranked fallback recommendation when it covers the requested service", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const staleOperational = cloneClinic(rows[1], {
      id: "stale-ranked-fallback",
      status: "operational",
      freshness: "stale",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(staleOperational)],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.recommendedClinic?.id).toBe("stale-ranked-fallback");
  });

  it("returns no safe recommendation for non-functional or unknown targets", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const unknown = cloneClinic(rows[1], {
      status: "unknown",
      freshness: "fresh",
    });
    const nonFunctional = cloneClinic(rows[2], {
      status: "non_functional",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(unknown), recommendation(nonFunctional)],
    });

    expect(impact.state).toBe("no_safe_recommendation");
    expect(impact.recommendedClinic).toBeNull();
  });

  it("returns no safe recommendation when alternatives do not cover the requested service", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const incompatible = cloneClinic(rows[2], {
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [
        recommendation(incompatible, { compatibilityServices: [] }),
      ],
    });

    expect(impact.state).toBe("no_safe_recommendation");
    expect(impact.recommendedClinic).toBeNull();
    expect(impact.impactMetrics.wastedTripAvoided).toBe(false);
  });

  it("requires compatibility with the resolved requested service", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      services: ["Primary care", "Pharmacy"],
    });
    const partialMatch = cloneClinic(rows[1], {
      id: "partial-match",
      status: "operational",
      freshness: "fresh",
    });
    const fullMatch = cloneClinic(rows[2], {
      id: "full-match",
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Pharmacy",
      recommendations: [
        recommendation(partialMatch, {
          compatibilityServices: ["Primary care"],
        }),
        recommendation(fullMatch, {
          compatibilityServices: ["Pharmacy"],
        }),
      ],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.recommendedClinic?.id).toBe("full-match");
    expect(impact.impactMetrics.compatibleServices).toEqual(["Pharmacy"]);
  });

  it("matches requested service despite case and whitespace differences", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      services: ["Primary care", "Pharmacy"],
    });
    const recommended = cloneClinic(rows[1], {
      id: "normalized-match",
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "  pharmacy  ",
      recommendations: [
        recommendation(recommended, {
          compatibilityServices: [" Pharmacy "],
        }),
      ],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.requestedService).toBe("pharmacy");
    expect(impact.recommendedClinic?.id).toBe("normalized-match");
  });

  it("does not claim a wasted trip avoided when the source clinic is available", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(rows[1])],
    });

    expect(impact.state).toBe("available");
    expect(impact.recommendedClinic).toBeNull();
    expect(impact.impactMetrics.wastedTripAvoided).toBe(false);
    expect(impact.impactMetrics.estimatedWastedTravelMinutesSaved).toBeNull();
    expect(impact.afterOutcome).toBe("Source clinic available for routing");
  });

  it("returns a no-safe-recommendation state when an unavailable source has no alternatives", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [],
    });

    expect(impact.state).toBe("no_safe_recommendation");
    expect(impact.recommendedClinic).toBeNull();
    expect(impact.afterOutcome).toBe("No compatible safe recommendation available");
    expect(impact.impactMetrics.wastedTripAvoided).toBe(false);
  });

  it("preserves null recommendation distance and ETA without misleading text", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      freshness: "fresh",
    });
    const recommended = cloneClinic(rows[1], {
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "",
      recommendations: [
        recommendation(recommended, {
          distanceKm: null,
          estimatedMinutes: null,
          compatibilityServices: ["Primary care"],
        }),
      ],
    });

    expect(impact.requestedService).toBe(source.services[0]);
    expect(impact.impactMetrics.recommendedDistanceKm).toBeNull();
    expect(impact.impactMetrics.recommendedEstimatedMinutes).toBeNull();
    expect(formatImpactDistance(null)).toBe("Distance unavailable");
    expect(formatImpactMinutes(null)).toBe("Minutes unavailable");
  });

  it("labels saved minutes as avoided wasted travel instead of a shorter route", () => {
    expect(formatImpactMinutes(18)).toBe("18 min avoided wasted travel");
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm run test -- lib/demo/patient-journey.test.ts
```

Expected: FAIL with an import error for `@/lib/demo/patient-journey`.

- [ ] **Step 3: Implement the utility**

Create `lib/demo/patient-journey.ts`:

```ts
import type { AlternativeRecommendation } from "@/lib/demo/alternatives";
import { estimateDistanceKm, isClinicUnavailable } from "@/lib/demo/finder";
import type { ClinicRow } from "@/lib/demo/types";

export type PatientJourneyState =
  | "available"
  | "reroute_recommended"
  | "no_safe_recommendation";

export type PatientJourneyImpact = {
  state: PatientJourneyState;
  sourceClinic: ClinicRow;
  requestedService: string;
  recommendedClinic: ClinicRow | null;
  beforeOutcome: string;
  afterOutcome: string;
  impactMetrics: {
    wastedTripAvoided: boolean;
    sourceDistanceKm: number | null;
    recommendedDistanceKm: number | null;
    recommendedEstimatedMinutes: number | null;
    estimatedWastedTravelMinutesSaved: number | null;
    compatibleServices: string[];
  };
  trustSignals: {
    sourceStatus: ClinicRow["status"];
    sourceFreshness: ClinicRow["freshness"];
    lastReportedAt: string | null;
    reason: string;
    recommendation: {
      status: ClinicRow["status"];
      freshness: ClinicRow["freshness"];
      lastReportedAt: string | null;
      reason: string;
    } | null;
  };
};

export type BuildPatientJourneyImpactInput = {
  sourceClinic: ClinicRow;
  requestedService?: string;
  recommendations: AlternativeRecommendation[];
};

function isValidRecommendation(
  recommendation: AlternativeRecommendation,
  requestedService: string,
) {
  return (
    isEligibleDestination(recommendation.clinic) &&
    recommendation.compatibilityServices.length > 0 &&
    recommendation.compatibilityServices.some(
      (service) => normalizeService(service) === normalizeService(requestedService),
    )
  );
}

function isEligibleDestination(clinic: ClinicRow) {
  return clinic.status !== "non_functional" && clinic.status !== "unknown";
}

function normalizeService(value: string) {
  return value.trim().toLowerCase();
}

function resolveRequestedService(sourceClinic: ClinicRow, requestedService?: string) {
  return requestedService?.trim() || sourceClinic.services[0] || "";
}

function estimateTravelMinutes(distanceKm: number | null) {
  if (distanceKm === null) {
    return null;
  }

  return Math.max(5, Math.round(distanceKm * 2.8));
}

function buildBaseImpact({
  sourceClinic,
  requestedService,
}: {
  sourceClinic: ClinicRow;
  requestedService: string;
}): Omit<PatientJourneyImpact, "state" | "recommendedClinic" | "beforeOutcome" | "afterOutcome"> {
  const sourceDistanceKm = estimateDistanceKm(sourceClinic.latitude, sourceClinic.longitude);

  return {
    sourceClinic,
    requestedService,
    impactMetrics: {
      wastedTripAvoided: false,
      sourceDistanceKm,
      recommendedDistanceKm: null,
      recommendedEstimatedMinutes: null,
      estimatedWastedTravelMinutesSaved: null,
      compatibleServices: [],
    },
    trustSignals: {
      sourceStatus: sourceClinic.status,
      sourceFreshness: sourceClinic.freshness,
      lastReportedAt: sourceClinic.lastReportedAt,
      reason: sourceClinic.reason,
      recommendation: null,
    },
  };
}

export function buildPatientJourneyImpact({
  sourceClinic,
  requestedService,
  recommendations,
}: BuildPatientJourneyImpactInput): PatientJourneyImpact {
  const resolvedService = resolveRequestedService(sourceClinic, requestedService);
  const base = buildBaseImpact({ sourceClinic, requestedService: resolvedService });

  if (!isClinicUnavailable(sourceClinic)) {
    return {
      ...base,
      state: "available",
      recommendedClinic: null,
      beforeOutcome: "Source clinic available",
      afterOutcome: "Source clinic available for routing",
    };
  }

  const topRecommendation = recommendations.find((recommendation) =>
    isValidRecommendation(recommendation, resolvedService),
  );

  if (!topRecommendation) {
    return {
      ...base,
      state: "no_safe_recommendation",
      recommendedClinic: null,
      beforeOutcome: "Wasted trip likely",
      afterOutcome: "No compatible safe recommendation available",
    };
  }

  return {
    ...base,
    state: "reroute_recommended",
    recommendedClinic: topRecommendation.clinic,
    beforeOutcome: "Wasted trip likely",
    afterOutcome: "Best nearby compatible clinic chosen",
    impactMetrics: {
      ...base.impactMetrics,
      wastedTripAvoided: true,
      recommendedDistanceKm: topRecommendation.distanceKm,
      recommendedEstimatedMinutes: topRecommendation.estimatedMinutes,
      estimatedWastedTravelMinutesSaved: estimateTravelMinutes(base.impactMetrics.sourceDistanceKm),
      compatibleServices: topRecommendation.compatibilityServices,
    },
    trustSignals: {
      ...base.trustSignals,
      recommendation: {
        status: topRecommendation.clinic.status,
        freshness: topRecommendation.clinic.freshness,
        lastReportedAt: topRecommendation.clinic.lastReportedAt,
        reason: topRecommendation.reason,
      },
    },
  };
}

export function formatImpactDistance(distanceKm: number | null) {
  return distanceKm === null ? "Distance unavailable" : `${distanceKm.toFixed(1)} km`;
}

export function formatImpactMinutes(minutes: number | null) {
  return minutes === null ? "Minutes unavailable" : `${minutes} min avoided wasted travel`;
}
```

- [ ] **Step 4: Run the utility test**

Run:

```bash
npm run test -- lib/demo/patient-journey.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/demo/patient-journey.ts lib/demo/patient-journey.test.ts
git commit -m "feat: add patient journey impact model"
```

---

### Task 2: Reusable Journey Impact Component

**Files:**
- Create: `components/demo/patient-journey-impact.tsx`
- Modify: `lib/demo/finder-route.test.ts`

- [ ] **Step 1: Add source-boundary test for the component contract**

Append this test to the `describe("public finder route boundary", ...)` block in `lib/demo/finder-route.test.ts`:

```ts
  it("defines a reusable patient journey impact component with patient and evidence variants", () => {
    const componentPath = path.join(
      process.cwd(),
      "components",
      "demo",
      "patient-journey-impact.tsx",
    );

    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");

    expect(componentSource).toContain("PatientJourneyImpactPanel");
    expect(componentSource).toContain('variant?: "patient" | "evidence"');
    expect(componentSource).toContain("Wasted trip avoided");
    expect(componentSource).toContain("No compatible safe recommendation");
    expect(componentSource).toContain("formatImpactDistance");
    expect(componentSource).toContain("formatImpactMinutes");
  });
```

- [ ] **Step 2: Run the failing source-boundary test**

Run:

```bash
npm run test -- lib/demo/finder-route.test.ts
```

Expected: FAIL because `components/demo/patient-journey-impact.tsx` does not exist.

- [ ] **Step 3: Create the component**

Create `components/demo/patient-journey-impact.tsx`:

```tsx
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock, MapPinned, Route } from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { ServiceList } from "@/components/demo/service-list";
import { StatusBadge } from "@/components/demo/status-badge";
import {
  formatImpactDistance,
  formatImpactMinutes,
  type PatientJourneyImpact,
} from "@/lib/demo/patient-journey";
import { cn } from "@/lib/utils";

type PatientJourneyImpactPanelProps = {
  impact: PatientJourneyImpact;
  variant?: "patient" | "evidence";
  actions?: ReactNode;
  className?: string;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Report time unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PatientJourneyImpactPanel({
  impact,
  variant = "patient",
  actions,
  className,
}: PatientJourneyImpactPanelProps) {
  const recommendedClinic = impact.recommendedClinic;
  const isEvidence = variant === "evidence";

  return (
    <section className={cn("rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm", className)}>
      <SectionHeader
        eyebrow={isEvidence ? "Routing evidence" : "Journey impact"}
        title={impact.state === "reroute_recommended" ? "Wasted trip avoided" : "Routing check"}
        description={
          isEvidence
            ? "Source condition, ranking result, and patient-facing recommendation in one trace."
            : "Before travelling, compare the affected clinic with the recommended compatible option."
        }
      />

      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
              <AlertTriangle className="size-4" />
              Before
            </div>
            <p className="mt-2 text-sm text-amber-950">{impact.beforeOutcome}</p>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Patient would try {impact.sourceClinic.name} for {impact.requestedService || "care"}.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
              <CheckCircle2 className="size-4" />
              After
            </div>
            <p className="mt-2 text-sm text-emerald-950">{impact.afterOutcome}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-900">
              {recommendedClinic
                ? `${recommendedClinic.name} is the current recommended alternative.`
                : "No alternative should be shown as safe without compatible recommendation data."}
            </p>
          </div>
        </div>

        {impact.state === "reroute_recommended" && recommendedClinic ? (
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                  <Clock className="size-3.5" />
                  Wasted travel
                </div>
                <p className="mt-2 text-sm font-semibold text-content-emphasis">
                  {formatImpactMinutes(impact.impactMetrics.estimatedWastedTravelMinutesSaved)}
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                  <Route className="size-3.5" />
                  Recommendation
                </div>
                <p className="mt-2 text-sm font-semibold text-content-emphasis">
                  {formatImpactDistance(impact.impactMetrics.recommendedDistanceKm)}
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                  <MapPinned className="size-3.5" />
                  Source trip
                </div>
                <p className="mt-2 text-sm font-semibold text-content-emphasis">
                  {formatImpactDistance(impact.impactMetrics.sourceDistanceKm)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Compatible services
              </p>
              <div className="mt-2">
                <ServiceList
                  services={recommendedClinic.services}
                  highlightedServices={impact.impactMetrics.compatibleServices}
                  compact
                />
              </div>
            </div>
          </div>
        ) : null}

        {impact.state === "no_safe_recommendation" ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
            No compatible safe recommendation is available for this selected clinic and service.
          </div>
        ) : null}

        {impact.state === "available" ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
            {impact.sourceClinic.name} is currently available for routing, so no avoided-trip claim is shown.
          </div>
        ) : null}

        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={impact.sourceClinic.status} />
            <FreshnessBadge freshness={impact.sourceClinic.freshness} />
            {recommendedClinic ? <StatusBadge status={recommendedClinic.status} /> : null}
            {recommendedClinic ? <FreshnessBadge freshness={recommendedClinic.freshness} /> : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-content-subtle">
            {isEvidence ? "Evidence: " : ""}
            {impact.trustSignals.reason}
          </p>
          <p className="mt-1 text-xs text-content-subtle">
            Last source report: {formatDateTime(impact.trustSignals.lastReportedAt)}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the source-boundary test**

Run:

```bash
npm run test -- lib/demo/finder-route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/demo/patient-journey-impact.tsx lib/demo/finder-route.test.ts
git commit -m "feat: add patient journey impact panel"
```

---

### Task 3: Public Finder Journey Impact

**Files:**
- Modify: `components/demo/clinic-finder.tsx`
- Modify: `lib/demo/finder-route.test.ts`

- [ ] **Step 1: Add source-boundary test for finder wiring**

Append this test to `lib/demo/finder-route.test.ts`:

```ts
  it("wires patient journey impact into the public finder with recommendation directions", () => {
    const componentSource = readFileSync(publicFinderComponent, "utf8");

    expect(componentSource).toContain("PatientJourneyImpactPanel");
    expect(componentSource).toContain("buildPatientJourneyImpact");
    expect(componentSource).toContain("recommendedDirectionsUrl");
    expect(componentSource).toContain("Open recommended directions");
    expect(componentSource).toContain("recommendations={recommendations}");
  });
```

- [ ] **Step 2: Run the failing finder wiring test**

Run:

```bash
npm run test -- lib/demo/finder-route.test.ts
```

Expected: FAIL because `ClinicFinder` does not import or render the journey panel.

- [ ] **Step 3: Update `components/demo/clinic-finder.tsx` imports**

Change the imports at the top of `components/demo/clinic-finder.tsx` to include the new component and utility:

```tsx
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { PatientJourneyImpactPanel } from "@/components/demo/patient-journey-impact";
import { ReroutePanel } from "@/components/demo/reroute-panel";
import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  type AlternativeRecommendation,
  loadAlternativeRecommendations,
  resolveAlternativeService,
} from "@/lib/demo/alternatives";
import {
  filterClinicRows,
  isClinicUnavailable,
  resolveSelectedClinicId,
  sortClinicRowsByDistance,
} from "@/lib/demo/finder";
import { buildPatientJourneyImpact } from "@/lib/demo/patient-journey";
import type { ClinicRow } from "@/lib/demo/types";
```

- [ ] **Step 4: Build journey impact and recommendation directions**

In `ClinicFinder`, after `const recommendations = ...`, add:

```tsx
  const journeyImpact = selectedClinicRow
    ? buildPatientJourneyImpact({
        sourceClinic: selectedClinicRow,
        requestedService: service,
        recommendations,
      })
    : null;
  const recommendedDirectionsUrl = journeyImpact?.recommendedClinic
    ? buildDirectionsUrl(journeyImpact.recommendedClinic)
    : null;
```

- [ ] **Step 5: Render the journey panel above `ReroutePanel`**

In the right-side `<section className="space-y-4">`, insert this block after the selected clinic card and before `ReroutePanel`:

```tsx
        {journeyImpact ? (
          <PatientJourneyImpactPanel
            impact={journeyImpact}
            actions={
              recommendedDirectionsUrl ? (
                <a
                  href={recommendedDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: "sm", variant: "default" })}
                >
                  Open recommended directions
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null
            }
          />
        ) : null}
```

- [ ] **Step 6: Run finder-related tests**

Run:

```bash
npm run test -- lib/demo/patient-journey.test.ts lib/demo/finder-route.test.ts lib/demo/finder.test.ts lib/demo/alternatives.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/demo/clinic-finder.tsx lib/demo/finder-route.test.ts
git commit -m "feat: show patient journey impact in finder"
```

---

### Task 4: Operator Evidence Surface

**Files:**
- Modify: `app/(demo)/demo/clinics/[clinicId]/page-client.tsx`
- Modify: `lib/demo/finder-route.test.ts`

- [ ] **Step 1: Add source-boundary test for clinic-detail evidence wiring**

Append this test to `lib/demo/finder-route.test.ts`:

```ts
  it("wires patient journey evidence into the authenticated clinic detail", () => {
    const clientSource = readFileSync(restrictedDemoClinicDetailClient, "utf8");

    expect(clientSource).toContain("PatientJourneyImpactPanel");
    expect(clientSource).toContain("buildPatientJourneyImpact");
    expect(clientSource).toContain('variant="evidence"');
    expect(clientSource).toContain("journeyImpact");
    expect(clientSource).toContain("recommendations={recommendations}");
  });
```

- [ ] **Step 2: Run the failing clinic-detail wiring test**

Run:

```bash
npm run test -- lib/demo/finder-route.test.ts
```

Expected: FAIL because the authenticated clinic detail does not render the evidence component.

- [ ] **Step 3: Update imports in clinic detail client**

In `app/(demo)/demo/clinics/[clinicId]/page-client.tsx`, add:

```tsx
import { PatientJourneyImpactPanel } from "@/components/demo/patient-journey-impact";
```

and add:

```tsx
import { buildPatientJourneyImpact } from "@/lib/demo/patient-journey";
```

- [ ] **Step 4: Build journey impact in clinic detail**

After `const unavailableClinic = ...`, add:

```tsx
  const journeyImpact = clinicRow
    ? buildPatientJourneyImpact({
        sourceClinic: clinicRow,
        requestedService: clinicRow.services[0],
        recommendations,
      })
    : null;
```

- [ ] **Step 5: Render evidence panel above `ReroutePanel`**

In the right column `<div className="grid gap-4">`, insert this before `<ReroutePanel ... />`:

```tsx
            {journeyImpact ? (
              <PatientJourneyImpactPanel impact={journeyImpact} variant="evidence" />
            ) : null}
```

- [ ] **Step 6: Run clinic detail and journey tests**

Run:

```bash
npm run test -- lib/demo/finder-route.test.ts lib/demo/patient-journey.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add 'app/(demo)/demo/clinics/[clinicId]/page-client.tsx' lib/demo/finder-route.test.ts
git commit -m "feat: show patient journey evidence on clinic detail"
```

---

### Task 5: Landing Journey Copy And Visual

**Files:**
- Modify: `components/landing/landing-scenario-data.ts`
- Modify: `components/landing/routing-moment.tsx`
- Modify: `lib/landing/openpanel-refactor-content.test.ts`

- [ ] **Step 1: Add landing content assertions**

In `lib/landing/openpanel-refactor-content.test.ts`, update the imports from `@/lib/landing/openpanel-refactor-content` only if needed. If this test file imports from the newer landing content module and not `components/landing/landing-scenario-data.ts`, create a new test file instead:

Create `lib/landing/patient-journey-copy.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { productFlowSteps, routingMoment } from "@/components/landing/landing-scenario-data";

const routingMomentComponent = path.join(
  process.cwd(),
  "components",
  "landing",
  "routing-moment.tsx",
);

describe("patient journey landing copy", () => {
  it("frames the landing reroute story as a wasted trip avoided", () => {
    expect(routingMoment.before).toContain("wasted trip");
    expect(routingMoment.recommendation).toContain("Akasia Hills Clinic");
    expect(routingMoment.reasons).toContain("Wasted travel avoided: 18 min");
    expect(routingMoment.reasons).toContain("Best nearby compatible clinic");
    expect(productFlowSteps[3].title).toBe("Wasted trip avoided");
  });

  it("renders the landing visual with journey impact proof labels", () => {
    const source = readFileSync(routingMomentComponent, "utf8");

    expect(source).toContain("Wasted trip avoided");
    expect(source).toContain("18 min avoided");
    expect(source).toContain("Best nearby compatible");
  });
});
```

- [ ] **Step 2: Run the failing landing test**

Run:

```bash
npm run test -- lib/landing/patient-journey-copy.test.ts
```

Expected: FAIL because the current copy does not include the approved labels.

- [ ] **Step 3: Update landing scenario data**

In `components/landing/landing-scenario-data.ts`, update the patient reroute flow step and routing moment:

```ts
  {
    step: "04",
    title: "Wasted trip avoided",
    description:
      "ClinicPulse warns the patient before travel and recommends the best nearby compatible clinic.",
    artifactTitle: "Journey impact",
    artifactDetail: "18 min avoided wasted travel",
  },
```

and:

```ts
export const routingMoment = {
  before: "Patient would make a wasted trip to Mamelodi East Community Clinic.",
  incident: "Mamelodi East Community Clinic is non-functional because pharmacy stock is unavailable.",
  recommendation: "Send patient to Akasia Hills Clinic.",
  reasons: [
    "Wasted travel avoided: 18 min",
    "Best nearby compatible clinic",
    "Service compatible: primary care supported",
    "Operational status fresh - 4 min ago",
  ],
} as const;
```

- [ ] **Step 4: Update the landing visual labels**

In `components/landing/routing-moment.tsx`, change the heading and supporting text to:

```tsx
              Wasted trip avoided before the patient starts travelling.
```

and:

```tsx
              The finder should show the unavailable clinic, the best nearby
              compatible alternative, wasted-travel time avoided, freshness,
              and reason in one glance.
```

Inside the green recommendation card, change the three metric tiles to:

```tsx
                  <div className="rounded-md border border-emerald-200 bg-white p-2">
                    <p className="text-emerald-700">Impact</p>
                    <p className="mt-1 font-mono font-semibold text-emerald-950">18 min avoided</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-white p-2">
                    <p className="text-emerald-700">Clinic</p>
                    <p className="mt-1 font-semibold text-emerald-950">Best nearby compatible</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-white p-2">
                    <p className="text-emerald-700">Service</p>
                    <p className="mt-1 font-semibold text-emerald-950">Primary care</p>
                  </div>
```

Change the bottom line in the green card to:

```tsx
                  Journey impact ready
```

- [ ] **Step 5: Run landing tests**

Run:

```bash
npm run test -- lib/landing/patient-journey-copy.test.ts lib/landing/openpanel-refactor-content.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/landing/landing-scenario-data.ts components/landing/routing-moment.tsx lib/landing/patient-journey-copy.test.ts
git commit -m "feat: align landing patient journey proof"
```

---

### Task 6: Final Verification

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run focused test suite**

Run:

```bash
npm run test -- lib/demo/patient-journey.test.ts lib/demo/finder-route.test.ts lib/demo/finder.test.ts lib/demo/alternatives.test.ts lib/landing/patient-journey-copy.test.ts lib/landing/openpanel-refactor-content.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Manual browser check**

Start the app if no local server is already running:

```bash
npm run dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/finder?query=Mamelodi%20East&service=Primary%20care`
- `http://localhost:3000/demo/clinics/clinic-mamelodi-east`

Expected:

- Landing routing moment says "Wasted trip avoided" and shows "18 min avoided".
- Finder selected Mamelodi East shows a Journey impact panel.
- Finder does not claim a successful recommendation if recommendations are empty.
- Clinic detail shows Routing evidence above the reroute recommendations.
- Wording says avoided wasted travel, not a guaranteed shorter route.

- [ ] **Step 5: Confirm git state**

Run:

```bash
git status --short
```

Expected: only intentional patient journey changes are present, or the working tree is clean after the task commits.
