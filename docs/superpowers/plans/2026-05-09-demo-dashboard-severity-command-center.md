# Demo Dashboard Severity Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `/demo` into a district-operator Severity Command Center that prioritizes triage, intervention, and verification over generic dashboard personalization.

**Architecture:** Build a pure command-center model from the existing demo store selectors, then render it through role-native dashboard components. The route should preserve existing demo behavior while making the first screen command-first: risk brief, severity queue, intervention rail, signal analytics, verification, and supporting operations.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Playwright.

---

## File structure

- Create `lib/demo/district-command-center.ts`: pure command-center model, severity scoring, reason-code generation, selected item details, intervention context, analytics summary, and handover summary.
- Create `lib/demo/district-command-center.test.ts`: unit coverage for deterministic ranking, reason codes, empty state, high-risk ordering, offline/freshness/alert weighting, and selected-item derivation.
- Modify `lib/auth/api.ts`: keep/add client-safe district context only if needed by the command brief.
- Modify `lib/auth/session.ts`: keep/add client-safe district context from the active membership only if needed by the command brief.
- Create `components/demo/command-center/command-card.tsx`: local presentation primitive for command-center surfaces.
- Create `components/demo/command-center/district-command-brief.tsx`: risk-first district brief.
- Create `components/demo/command-center/severity-queue.tsx`: ranked queue and selection UI.
- Create `components/demo/command-center/intervention-rail.tsx`: contextual action surface for selected severity item.
- Create `components/demo/command-center/signal-analytics.tsx`: compact explanatory analytics.
- Create `components/demo/command-center/verification-handover.tsx`: concise verification and handover summary.
- Create `components/demo/command-center/supporting-operations.tsx`: lower-priority wrapper for map, reports, replay, controls, alerts, readiness, and dense clinic table.
- Modify `app/(demo)/demo/page.tsx`: pass the client-safe session into the demo client.
- Modify `app/(demo)/demo/page-client.tsx`: compose the Severity Command Center and preserve existing demo behavior.
- Modify `tests/e2e/phase-one-smoke.spec.ts`: add stable smoke assertions for command-center load and queue/rail interaction.
- Remove or avoid using generic prototype files under `components/demo/dashboard/` and `lib/demo/dashboard-personalization.ts` unless they are deliberately renamed and reshaped into the command-center architecture.

## Current branch note

The branch currently contains uncommitted prototype work for generic personalization. Treat that work as disposable scaffolding. The implementation should converge on the command-center file structure above and should not leave generic personalization concepts as the primary dashboard architecture.

---

## Task 1: Client-safe district context

**Files:**
- Modify: `lib/auth/api.ts`
- Modify: `lib/auth/session.ts`

- [ ] **Step 1: Add or confirm client-safe session fields**

Ensure `ClientAuthSession` includes optional district/operator context. Keep this minimal and safe for client rendering.

```ts
export type ClientAuthSession = {
  userId: number;
  email: string;
  name: string;
  role: MembershipRole;
  organisationName?: string;
  district?: string;
  organisationId?: number;
};
```

- [ ] **Step 2: Populate fields from the active membership**

In `toClientAuthSession`, copy only fields already available on the active membership or organisation payload.

```ts
export function toClientAuthSession(session: AuthSession): ClientAuthSession {
  const activeMembership = session.activeMembership;

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: activeMembership.role,
    organisationName: activeMembership.organisation.name,
    district: activeMembership.organisation.district ?? undefined,
    organisationId: activeMembership.organisation.id,
  };
}
```

- [ ] **Step 3: Commit session context**

```bash
git add lib/auth/api.ts lib/auth/session.ts
git commit -m "feat: expose district context to demo client"
```

---

## Task 2: Command-center model tests

**Files:**
- Create: `lib/demo/district-command-center.test.ts`

- [ ] **Step 1: Replace generic personalization tests with command-center tests**

Create `lib/demo/district-command-center.test.ts` with tests shaped around district operator triage.

```ts
import { describe, expect, it } from "vitest";

import {
  buildDistrictCommandCenter,
  scoreDistrictSeverityItem,
  type DistrictCommandClinicInput,
} from "./district-command-center";

const operationalClinic: DistrictCommandClinicInput = {
  id: "clinic-operational",
  name: "Green Valley Clinic",
  district: "Umkhanyakude",
  status: "operational",
  freshness: "fresh",
  services: ["Primary care", "Immunisation"],
  updatedAt: "2026-05-09T06:00:00.000Z",
  hasActiveAlert: false,
  isInOfflineQueue: false,
  alternativeCount: 2,
  recentTrend: "stable",
};

const failingClinic: DistrictCommandClinicInput = {
  id: "clinic-failing",
  name: "Ndlovu Clinic",
  district: "Umkhanyakude",
  status: "non_functional",
  freshness: "stale",
  services: ["Maternity", "Primary care"],
  updatedAt: "2026-05-09T04:00:00.000Z",
  hasActiveAlert: true,
  isInOfflineQueue: true,
  alternativeCount: 0,
  recentTrend: "worsening",
};

describe("scoreDistrictSeverityItem", () => {
  it("scores non-functional stale clinics with alerts above operational clinics", () => {
    const failingScore = scoreDistrictSeverityItem(failingClinic);
    const operationalScore = scoreDistrictSeverityItem(operationalClinic);

    expect(failingScore.score).toBeGreaterThan(operationalScore.score);
    expect(failingScore.severityLabel).toBe("critical");
    expect(failingScore.reasonCodes).toContain("service_unavailable");
    expect(failingScore.reasonCodes).toContain("stale_report");
    expect(failingScore.reasonCodes).toContain("active_alert");
    expect(failingScore.reasonCodes).toContain("no_alternative_capacity");
  });

  it("keeps low-risk clinics explainable", () => {
    const result = scoreDistrictSeverityItem(operationalClinic);

    expect(result.severityLabel).toBe("stable");
    expect(result.reasonCodes).toEqual(["operational_baseline"]);
    expect(result.patientImpact).toContain("Service continuity is currently stable");
  });
});

describe("buildDistrictCommandCenter", () => {
  it("selects the highest severity item by default and builds intervention context", () => {
    const commandCenter = buildDistrictCommandCenter({
      session: {
        userId: 1,
        email: "operator@example.com",
        name: "Amina Dlamini",
        role: "district_admin",
        organisationName: "Umkhanyakude District Health",
        district: "Umkhanyakude",
        organisationId: 7,
      },
      clinics: [operationalClinic, failingClinic],
      activeAlertCount: 1,
      offlineQueueCount: 1,
      lastSyncAt: "2026-05-09T06:10:00.000Z",
      selectedClinicId: null,
    });

    expect(commandCenter.brief.operatorName).toBe("Amina Dlamini");
    expect(commandCenter.brief.districtLabel).toBe("Umkhanyakude");
    expect(commandCenter.queue[0]?.clinicId).toBe("clinic-failing");
    expect(commandCenter.selectedItem?.clinicId).toBe("clinic-failing");
    expect(commandCenter.intervention.primaryAction.label).toBe("Open intervention plan");
    expect(commandCenter.analytics.statusMix.critical).toBe(1);
    expect(commandCenter.handover.items[0]).toContain("Ndlovu Clinic");
  });

  it("returns a calm empty-state command surface when no clinics are loaded", () => {
    const commandCenter = buildDistrictCommandCenter({
      session: null,
      clinics: [],
      activeAlertCount: 0,
      offlineQueueCount: 0,
      lastSyncAt: null,
      selectedClinicId: null,
    });

    expect(commandCenter.brief.riskLabel).toBe("No clinic signal loaded");
    expect(commandCenter.queue).toEqual([]);
    expect(commandCenter.selectedItem).toBeNull();
    expect(commandCenter.intervention.primaryAction.label).toBe("Load district signal");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/demo/district-command-center.test.ts
```

Expected: FAIL because `lib/demo/district-command-center.ts` does not exist yet.

- [ ] **Step 3: Commit failing test**

```bash
git add lib/demo/district-command-center.test.ts
git commit -m "test: define district command center model"
```

---

## Task 3: Command-center model implementation

**Files:**
- Create: `lib/demo/district-command-center.ts`
- Modify: `lib/demo/district-command-center.test.ts` only if type names need exact adjustment

- [ ] **Step 1: Create model types**

```ts
import type { ClientAuthSession } from "@/lib/auth/api";

export type DistrictCommandStatus =
  | "operational"
  | "degraded"
  | "non_functional"
  | "unknown";

export type DistrictCommandFreshness =
  | "fresh"
  | "stale"
  | "unknown"
  | "needs_confirmation";

export type DistrictCommandTrend = "improving" | "stable" | "worsening" | "unknown";

export type DistrictSeverityLabel = "critical" | "watch" | "attention" | "stable";

export type DistrictSeverityReasonCode =
  | "service_unavailable"
  | "service_degraded"
  | "stale_report"
  | "unknown_signal"
  | "needs_confirmation"
  | "active_alert"
  | "offline_backlog"
  | "no_alternative_capacity"
  | "limited_alternative_capacity"
  | "worsening_trend"
  | "operational_baseline";

export type DistrictCommandClinicInput = {
  id: string;
  name: string;
  district?: string | null;
  status: DistrictCommandStatus;
  freshness: DistrictCommandFreshness;
  services: string[];
  updatedAt?: string | null;
  hasActiveAlert: boolean;
  isInOfflineQueue: boolean;
  alternativeCount: number;
  recentTrend: DistrictCommandTrend;
};

export type DistrictSeverityScore = {
  score: number;
  severityLabel: DistrictSeverityLabel;
  reasonCodes: DistrictSeverityReasonCode[];
  patientImpact: string;
  recommendedAction: string;
  verificationNeed: string;
};

export type DistrictSeverityQueueItem = DistrictSeverityScore & {
  id: string;
  clinicId: string;
  clinicName: string;
  districtLabel: string;
  status: DistrictCommandStatus;
  freshness: DistrictCommandFreshness;
  services: string[];
  updatedAt?: string | null;
  availableAlternatives: number;
};

export type DistrictCommandCenterInput = {
  session: ClientAuthSession | null;
  clinics: DistrictCommandClinicInput[];
  activeAlertCount: number;
  offlineQueueCount: number;
  lastSyncAt: string | null;
  selectedClinicId: string | null;
};

export type DistrictCommandCenter = {
  brief: {
    operatorName: string;
    districtLabel: string;
    riskLabel: string;
    summary: string;
    immediateFocus: string;
    posture: "critical" | "active" | "watch" | "stable";
    lastSyncLabel: string;
  };
  queue: DistrictSeverityQueueItem[];
  selectedItem: DistrictSeverityQueueItem | null;
  intervention: {
    primaryAction: {
      label: string;
      description: string;
    };
    secondaryActions: Array<{
      label: string;
      description: string;
    }>;
    expectedOutcome: string;
    verificationStep: string;
  };
  analytics: {
    statusMix: Record<DistrictSeverityLabel, number>;
    freshnessRiskCount: number;
    offlineQueueCount: number;
    activeAlertCount: number;
    topReasonCodes: Array<{
      code: DistrictSeverityReasonCode;
      count: number;
    }>;
  };
  handover: {
    title: string;
    items: string[];
  };
};
```

- [ ] **Step 2: Implement severity scoring**

```ts
const STATUS_POINTS: Record<DistrictCommandStatus, number> = {
  non_functional: 45,
  degraded: 28,
  unknown: 18,
  operational: 0,
};

const FRESHNESS_POINTS: Record<DistrictCommandFreshness, number> = {
  stale: 18,
  unknown: 14,
  needs_confirmation: 10,
  fresh: 0,
};

function severityLabelForScore(score: number): DistrictSeverityLabel {
  if (score >= 70) return "critical";
  if (score >= 45) return "watch";
  if (score >= 20) return "attention";
  return "stable";
}

function patientImpactForClinic(clinic: DistrictCommandClinicInput) {
  const serviceLabel =
    clinic.services.length > 0 ? clinic.services.slice(0, 2).join(" and ") : "core services";

  if (clinic.status === "non_functional") {
    return `${serviceLabel} may be unavailable until the district confirms rerouting or restoration.`;
  }

  if (clinic.status === "degraded") {
    return `${serviceLabel} capacity is constrained and may create patient overflow.`;
  }

  if (clinic.freshness !== "fresh") {
    return `Service continuity needs confirmation because the latest clinic signal is ${clinic.freshness.replaceAll("_", " ")}.`;
  }

  return "Service continuity is currently stable; monitor for changes.";
}

function recommendedActionForClinic(clinic: DistrictCommandClinicInput) {
  if (clinic.status === "non_functional" && clinic.alternativeCount > 0) {
    return "Confirm closure status and route patients to available alternatives.";
  }

  if (clinic.status === "non_functional") {
    return "Escalate service restoration because no alternative capacity is visible.";
  }

  if (clinic.status === "degraded") {
    return "Stabilize clinic pressure and prepare overflow routing.";
  }

  if (clinic.freshness !== "fresh") {
    return "Request confirmation from the clinic coordinator before changing routing.";
  }

  return "Continue monitoring and keep the district signal current.";
}

export function scoreDistrictSeverityItem(
  clinic: DistrictCommandClinicInput,
): DistrictSeverityScore {
  let score = STATUS_POINTS[clinic.status] + FRESHNESS_POINTS[clinic.freshness];
  const reasonCodes: DistrictSeverityReasonCode[] = [];

  if (clinic.status === "non_functional") reasonCodes.push("service_unavailable");
  if (clinic.status === "degraded") reasonCodes.push("service_degraded");
  if (clinic.freshness === "stale") reasonCodes.push("stale_report");
  if (clinic.freshness === "unknown") reasonCodes.push("unknown_signal");
  if (clinic.freshness === "needs_confirmation") reasonCodes.push("needs_confirmation");

  if (clinic.hasActiveAlert) {
    score += 16;
    reasonCodes.push("active_alert");
  }

  if (clinic.isInOfflineQueue) {
    score += 10;
    reasonCodes.push("offline_backlog");
  }

  if (clinic.alternativeCount === 0 && clinic.status !== "operational") {
    score += 12;
    reasonCodes.push("no_alternative_capacity");
  } else if (clinic.alternativeCount === 1 && clinic.status !== "operational") {
    score += 6;
    reasonCodes.push("limited_alternative_capacity");
  }

  if (clinic.recentTrend === "worsening") {
    score += 8;
    reasonCodes.push("worsening_trend");
  }

  if (reasonCodes.length === 0) {
    reasonCodes.push("operational_baseline");
  }

  return {
    score,
    severityLabel: severityLabelForScore(score),
    reasonCodes,
    patientImpact: patientImpactForClinic(clinic),
    recommendedAction: recommendedActionForClinic(clinic),
    verificationNeed:
      clinic.status === "operational" && clinic.freshness === "fresh"
        ? "No immediate verification required beyond routine monitoring."
        : "Verify the clinic signal after intervention and confirm patient routing impact.",
  };
}
```

- [ ] **Step 3: Implement command-center builder**

```ts
function formatLastSync(lastSyncAt: string | null) {
  if (!lastSyncAt) return "No sync recorded";
  return `Last sync ${new Date(lastSyncAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

function buildQueue(clinics: DistrictCommandClinicInput[]): DistrictSeverityQueueItem[] {
  return clinics
    .map((clinic) => {
      const severity = scoreDistrictSeverityItem(clinic);

      return {
        id: `severity-${clinic.id}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        districtLabel: clinic.district?.trim() || "District clinic",
        status: clinic.status,
        freshness: clinic.freshness,
        services: clinic.services,
        updatedAt: clinic.updatedAt,
        availableAlternatives: clinic.alternativeCount,
        ...severity,
      };
    })
    .sort((a, b) => b.score - a.score || a.clinicName.localeCompare(b.clinicName));
}

function buildBrief(
  input: DistrictCommandCenterInput,
  queue: DistrictSeverityQueueItem[],
): DistrictCommandCenter["brief"] {
  const operatorName = input.session?.name?.trim() || "District operator";
  const districtLabel =
    input.session?.district?.trim() ||
    input.session?.organisationName?.trim() ||
    queue[0]?.districtLabel ||
    "district";
  const topItem = queue[0] ?? null;

  if (!topItem) {
    return {
      operatorName,
      districtLabel,
      riskLabel: "No clinic signal loaded",
      summary: "Load or sync clinic reports to build the district triage queue.",
      immediateFocus: "Confirm demo data is available before starting intervention.",
      posture: "stable",
      lastSyncLabel: formatLastSync(input.lastSyncAt),
    };
  }

  return {
    operatorName,
    districtLabel,
    riskLabel:
      topItem.severityLabel === "critical"
        ? "Critical district risk"
        : topItem.severityLabel === "watch"
          ? "Active district watch"
          : topItem.severityLabel === "attention"
            ? "Needs operator attention"
            : "District stable",
    summary: `${topItem.clinicName} is the current top priority: ${topItem.patientImpact}`,
    immediateFocus: topItem.recommendedAction,
    posture:
      topItem.severityLabel === "critical"
        ? "critical"
        : topItem.severityLabel === "watch"
          ? "active"
          : topItem.severityLabel === "attention"
            ? "watch"
            : "stable",
    lastSyncLabel: formatLastSync(input.lastSyncAt),
  };
}

function buildIntervention(
  selectedItem: DistrictSeverityQueueItem | null,
): DistrictCommandCenter["intervention"] {
  if (!selectedItem) {
    return {
      primaryAction: {
        label: "Load district signal",
        description: "Sync clinic reports to create a triage queue.",
      },
      secondaryActions: [],
      expectedOutcome: "The command center will show ranked district risk once data is loaded.",
      verificationStep: "Confirm clinic reports are available.",
    };
  }

  return {
    primaryAction: {
      label: "Open intervention plan",
      description: selectedItem.recommendedAction,
    },
    secondaryActions: [
      {
        label: "View clinic detail",
        description: `Inspect ${selectedItem.clinicName} before confirming intervention.`,
      },
      {
        label: "Verify latest signal",
        description: selectedItem.verificationNeed,
      },
    ],
    expectedOutcome:
      selectedItem.availableAlternatives > 0
        ? "Patients have a safer route while the district confirms restoration."
        : "District escalation is visible and ready for follow-up.",
    verificationStep: selectedItem.verificationNeed,
  };
}

function buildAnalytics(
  input: DistrictCommandCenterInput,
  queue: DistrictSeverityQueueItem[],
): DistrictCommandCenter["analytics"] {
  const statusMix: Record<DistrictSeverityLabel, number> = {
    critical: 0,
    watch: 0,
    attention: 0,
    stable: 0,
  };
  const reasonCounts = new Map<DistrictSeverityReasonCode, number>();

  for (const item of queue) {
    statusMix[item.severityLabel] += 1;

    for (const code of item.reasonCodes) {
      reasonCounts.set(code, (reasonCounts.get(code) ?? 0) + 1);
    }
  }

  return {
    statusMix,
    freshnessRiskCount: queue.filter((item) => item.freshness !== "fresh").length,
    offlineQueueCount: input.offlineQueueCount,
    activeAlertCount: input.activeAlertCount,
    topReasonCodes: [...reasonCounts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
  };
}

function buildHandover(
  selectedItem: DistrictSeverityQueueItem | null,
  queue: DistrictSeverityQueueItem[],
): DistrictCommandCenter["handover"] {
  if (!selectedItem) {
    return {
      title: "No active handover",
      items: ["No clinic priority has been selected because no district signal is loaded."],
    };
  }

  return {
    title: "Operator handover",
    items: [
      `${selectedItem.clinicName} is ranked first with severity score ${selectedItem.score}.`,
      selectedItem.verificationNeed,
      `${queue.filter((item) => item.severityLabel !== "stable").length} queue item(s) need active follow-up.`,
    ],
  };
}

export function buildDistrictCommandCenter(
  input: DistrictCommandCenterInput,
): DistrictCommandCenter {
  const queue = buildQueue(input.clinics);
  const selectedItem =
    queue.find((item) => item.clinicId === input.selectedClinicId) ?? queue[0] ?? null;

  return {
    brief: buildBrief(input, queue),
    queue,
    selectedItem,
    intervention: buildIntervention(selectedItem),
    analytics: buildAnalytics(input, queue),
    handover: buildHandover(selectedItem, queue),
  };
}
```

- [ ] **Step 4: Run model tests**

```bash
npm test -- lib/demo/district-command-center.test.ts
```

Expected: PASS.

- [ ] **Step 5: Remove generic personalization model if present**

If `lib/demo/dashboard-personalization.ts` and `lib/demo/dashboard-personalization.test.ts` exist from the prototype, delete them unless some code still imports them.

```bash
rm -f lib/demo/dashboard-personalization.ts lib/demo/dashboard-personalization.test.ts
```

- [ ] **Step 6: Commit model implementation**

```bash
git add lib/demo/district-command-center.ts lib/demo/district-command-center.test.ts lib/demo/dashboard-personalization.ts lib/demo/dashboard-personalization.test.ts
git commit -m "feat: add district command center model"
```

---

## Task 4: Command-center component shell

**Files:**
- Create: `components/demo/command-center/command-card.tsx`
- Create: `components/demo/command-center/district-command-brief.tsx`
- Create: `components/demo/command-center/severity-queue.tsx`

- [ ] **Step 1: Create command card primitive**

```tsx
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CommandCardProps = ComponentPropsWithoutRef<"section"> & {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function CommandCard({
  eyebrow,
  title,
  description,
  action,
  className,
  children,
  ...props
}: CommandCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm shadow-slate-950/5",
        className,
      )}
      {...props}
    >
      {(eyebrow || title || description || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Create risk-first command brief**

```tsx
import type { DistrictCommandCenter } from "@/lib/demo/district-command-center";

import { CommandCard } from "./command-card";

type DistrictCommandBriefProps = {
  brief: DistrictCommandCenter["brief"];
};

const postureStyles: Record<DistrictCommandCenter["brief"]["posture"], string> = {
  critical: "border-red-200 bg-red-50 text-red-950",
  active: "border-orange-200 bg-orange-50 text-orange-950",
  watch: "border-amber-200 bg-amber-50 text-amber-950",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export function DistrictCommandBrief({ brief }: DistrictCommandBriefProps) {
  return (
    <CommandCard className="overflow-hidden border-slate-900/10 bg-slate-950 p-0 text-white">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
            District command brief
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
            {brief.riskLabel}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">{brief.summary}</p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Immediate focus
            </p>
            <p className="mt-2 text-sm leading-6 text-white">{brief.immediateFocus}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          <p className="text-sm text-slate-300">Operator</p>
          <p className="mt-1 text-lg font-semibold">{brief.operatorName}</p>
          <p className="mt-5 text-sm text-slate-300">District scope</p>
          <p className="mt-1 text-lg font-semibold">{brief.districtLabel}</p>
          <div className={`mt-5 rounded-2xl border px-3 py-2 text-sm ${postureStyles[brief.posture]}`}>
            {brief.lastSyncLabel}
          </div>
        </div>
      </div>
    </CommandCard>
  );
}
```

- [ ] **Step 3: Create severity queue**

```tsx
import type { DistrictSeverityQueueItem } from "@/lib/demo/district-command-center";

import { CommandCard } from "./command-card";

type SeverityQueueProps = {
  items: DistrictSeverityQueueItem[];
  selectedClinicId: string | null;
  onSelectClinic: (clinicId: string) => void;
};

const severityTone: Record<DistrictSeverityQueueItem["severityLabel"], string> = {
  critical: "bg-red-100 text-red-800 ring-red-200",
  watch: "bg-orange-100 text-orange-800 ring-orange-200",
  attention: "bg-amber-100 text-amber-800 ring-amber-200",
  stable: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

export function SeverityQueue({ items, selectedClinicId, onSelectClinic }: SeverityQueueProps) {
  return (
    <CommandCard
      eyebrow="Unified severity queue"
      title="Handle this first"
      description="Ranked by status, freshness, alerts, offline backlog, alternatives, and recent trend."
      className="h-full"
    >
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            No clinic signal is loaded yet. Sync reports to build the queue.
          </div>
        ) : null}
        {items.map((item, index) => {
          const selected = item.clinicId === selectedClinicId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectClinic(item.clinicId)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={selected ? "text-xs text-slate-300" : "text-xs text-slate-500"}>
                    Priority {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{item.clinicName}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                    selected ? "bg-white text-slate-950 ring-white" : severityTone[item.severityLabel]
                  }`}
                >
                  {item.severityLabel} · {item.score}
                </span>
              </div>
              <p className={selected ? "mt-3 text-sm text-slate-200" : "mt-3 text-sm text-slate-600"}>
                {item.patientImpact}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.reasonCodes.slice(0, 3).map((code) => (
                  <span
                    key={code}
                    className={
                      selected
                        ? "rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                    }
                  >
                    {code.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </CommandCard>
  );
}
```

- [ ] **Step 4: Remove or ignore prototype dashboard shell components**

If these prototype files exist and are no longer imported, delete them:

```bash
rm -f components/demo/dashboard/dashboard-card.tsx \
  components/demo/dashboard/workflow-stepper.tsx \
  components/demo/dashboard/command-briefing.tsx \
  components/demo/dashboard/priority-action-rail.tsx
```

- [ ] **Step 5: Commit command shell**

```bash
git add components/demo/command-center components/demo/dashboard
git commit -m "feat: add district command shell"
```

---

## Task 5: Intervention, analytics, and handover components

**Files:**
- Create: `components/demo/command-center/intervention-rail.tsx`
- Create: `components/demo/command-center/signal-analytics.tsx`
- Create: `components/demo/command-center/verification-handover.tsx`

- [ ] **Step 1: Create intervention rail**

```tsx
import type { DistrictCommandCenter } from "@/lib/demo/district-command-center";

import { buttonVariants } from "@/components/ui/button";
import { CommandCard } from "./command-card";

type InterventionRailProps = {
  selectedItem: DistrictCommandCenter["selectedItem"];
  intervention: DistrictCommandCenter["intervention"];
  replayDisabled: boolean;
  onOpenClinic: (clinicId: string) => void;
  onTriggerReroute: () => void;
  onSyncOfflineReports: () => void;
  onStartIncidentReplay: () => void;
};

export function InterventionRail({
  selectedItem,
  intervention,
  replayDisabled,
  onOpenClinic,
  onTriggerReroute,
  onSyncOfflineReports,
  onStartIncidentReplay,
}: InterventionRailProps) {
  return (
    <CommandCard
      eyebrow="Intervention rail"
      title={selectedItem ? selectedItem.clinicName : "No active priority"}
      description={intervention.primaryAction.description}
      className="h-full border-cyan-200/70 bg-cyan-50/60"
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Primary action
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {intervention.primaryAction.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {intervention.primaryAction.description}
          </p>
        </div>

        <div className="grid gap-2">
          {selectedItem ? (
            <button
              type="button"
              onClick={() => onOpenClinic(selectedItem.clinicId)}
              className={buttonVariants({ variant: "default" })}
            >
              Open clinic detail
            </button>
          ) : null}
          <button
            type="button"
            onClick={onTriggerReroute}
            disabled={replayDisabled}
            className={buttonVariants({ variant: "outline" })}
          >
            Trigger reroute
          </button>
          <button
            type="button"
            onClick={onSyncOfflineReports}
            disabled={replayDisabled}
            className={buttonVariants({ variant: "outline" })}
          >
            Sync offline reports
          </button>
          <button
            type="button"
            onClick={onStartIncidentReplay}
            disabled={replayDisabled}
            className={buttonVariants({ variant: "secondary" })}
          >
            Run incident replay
          </button>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-white/80 p-4">
          <p className="text-sm font-semibold text-slate-950">Expected outcome</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{intervention.expectedOutcome}</p>
          <p className="mt-4 text-sm font-semibold text-slate-950">Verify</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{intervention.verificationStep}</p>
        </div>
      </div>
    </CommandCard>
  );
}
```

- [ ] **Step 2: Create signal analytics**

```tsx
import type { DistrictCommandCenter } from "@/lib/demo/district-command-center";

import { CommandCard } from "./command-card";

type SignalAnalyticsProps = {
  analytics: DistrictCommandCenter["analytics"];
};

export function SignalAnalytics({ analytics }: SignalAnalyticsProps) {
  const cards = [
    { label: "Critical", value: analytics.statusMix.critical, tone: "text-red-700" },
    { label: "Watch", value: analytics.statusMix.watch, tone: "text-orange-700" },
    { label: "Freshness risk", value: analytics.freshnessRiskCount, tone: "text-amber-700" },
    { label: "Offline backlog", value: analytics.offlineQueueCount, tone: "text-sky-700" },
  ];

  return (
    <CommandCard
      eyebrow="Signal analytics"
      title="Why the queue is ranked this way"
      description="Compact signals supporting intervention decisions."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {card.label}
            </p>
            <p className={`mt-2 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-950">Top severity drivers</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {analytics.topReasonCodes.length === 0 ? (
            <span className="text-sm text-slate-500">No risk drivers detected.</span>
          ) : null}
          {analytics.topReasonCodes.map((reason) => (
            <span
              key={reason.code}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
            >
              {reason.code.replaceAll("_", " ")} · {reason.count}
            </span>
          ))}
        </div>
      </div>
    </CommandCard>
  );
}
```

- [ ] **Step 3: Create verification handover**

```tsx
import type { DistrictCommandCenter } from "@/lib/demo/district-command-center";

import { CommandCard } from "./command-card";

type VerificationHandoverProps = {
  handover: DistrictCommandCenter["handover"];
};

export function VerificationHandover({ handover }: VerificationHandoverProps) {
  return (
    <CommandCard eyebrow="Verification and handover" title={handover.title}>
      <ol className="space-y-3">
        {handover.items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span className="text-sm leading-6 text-slate-700">{item}</span>
          </li>
        ))}
      </ol>
    </CommandCard>
  );
}
```

- [ ] **Step 4: Remove or ignore prototype analytics/work-queue components**

If these prototype files exist and are no longer imported, delete them:

```bash
rm -f components/demo/dashboard/district-signal-chart.tsx \
  components/demo/dashboard/clinic-work-queue.tsx
```

- [ ] **Step 5: Commit action and signal components**

```bash
git add components/demo/command-center components/demo/dashboard
git commit -m "feat: add command center intervention surfaces"
```

---

## Task 6: Supporting operations wrapper

**Files:**
- Create: `components/demo/command-center/supporting-operations.tsx`

- [ ] **Step 1: Create supporting operations component**

```tsx
import type { ReactNode } from "react";

import { CommandCard } from "./command-card";

type SupportingOperationsProps = {
  children: ReactNode;
};

export function SupportingOperations({ children }: SupportingOperationsProps) {
  return (
    <CommandCard
      eyebrow="Supporting operations"
      title="Map, reports, replay, controls, and raw clinic detail"
      description="Secondary tools stay available without competing with the command queue."
      className="bg-slate-50/80"
    >
      <div className="grid gap-4">{children}</div>
    </CommandCard>
  );
}
```

- [ ] **Step 2: Commit supporting wrapper**

```bash
git add components/demo/command-center/supporting-operations.tsx
git commit -m "feat: add supporting operations section"
```

---

## Task 7: Compose command center in `/demo`

**Files:**
- Modify: `app/(demo)/demo/page.tsx`
- Modify: `app/(demo)/demo/page-client.tsx`

- [ ] **Step 1: Pass session into the client page**

In `app/(demo)/demo/page.tsx`, pass `session` to `DistrictConsolePageClient`.

```tsx
return <DistrictConsolePageClient session={session} syncSummary={syncSummary} />;
```

- [ ] **Step 2: Add page-client imports**

In `app/(demo)/demo/page-client.tsx`, import the command-center model and components.

```tsx
import { DistrictCommandBrief } from "@/components/demo/command-center/district-command-brief";
import { InterventionRail } from "@/components/demo/command-center/intervention-rail";
import { SeverityQueue } from "@/components/demo/command-center/severity-queue";
import { SignalAnalytics } from "@/components/demo/command-center/signal-analytics";
import { SupportingOperations } from "@/components/demo/command-center/supporting-operations";
import { VerificationHandover } from "@/components/demo/command-center/verification-handover";
import type { ClientAuthSession } from "@/lib/auth/api";
import {
  buildDistrictCommandCenter,
  type DistrictCommandClinicInput,
} from "@/lib/demo/district-command-center";
```

- [ ] **Step 3: Update props**

```tsx
type DistrictConsolePageProps = {
  session: ClientAuthSession;
  syncSummary: SyncSummaryApiResponse | null;
};
```

- [ ] **Step 4: Track selected command item separately from map selection if needed**

Keep `selectedClinicId` for existing map behavior. Add `selectedCommandClinicId` if selecting the queue should not immediately navigate away.

```tsx
const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
const [selectedCommandClinicId, setSelectedCommandClinicId] = useState<string | null>(null);
```

- [ ] **Step 5: Convert existing clinic rows to model inputs**

Place this after `recommendedActionByClinicId` and existing memoized data.

```tsx
const activeAlertClinicIds = useMemo(
  () => new Set(activeAlerts.map((alert) => alert.clinicId)),
  [activeAlerts],
);

const offlineQueueClinicIds = useMemo(
  () => new Set(state.offlineQueue.map((report) => report.clinicId)),
  [state.offlineQueue],
);

const recentTrendByClinicId = useMemo(() => {
  const trendEntries = clinicRows.map((clinic) => {
    const reports = reportStream.filter((report) => report.clinicId === clinic.id);
    const latest = reports[0];
    const previous = reports[1];

    if (!latest || !previous) {
      return [clinic.id, "unknown"] as const;
    }

    if (latest.status === previous.status) {
      return [clinic.id, "stable"] as const;
    }

    if (latest.status === "non_functional" || latest.status === "degraded") {
      return [clinic.id, "worsening"] as const;
    }

    return [clinic.id, "improving"] as const;
  });

  return Object.fromEntries(trendEntries);
}, [clinicRows, reportStream]);

const commandClinics = useMemo<DistrictCommandClinicInput[]>(
  () =>
    clinicRows.map((clinic) => {
      const primaryService = clinic.services[0];
      const alternativeCount = primaryService
        ? getAlternativeClinics(state, clinic.id, primaryService).length
        : 0;

      return {
        id: clinic.id,
        name: clinic.name,
        district: clinic.district,
        status: clinic.status,
        freshness: clinic.freshness,
        services: clinic.services,
        updatedAt: clinic.updatedAt,
        hasActiveAlert: activeAlertClinicIds.has(clinic.id),
        isInOfflineQueue: offlineQueueClinicIds.has(clinic.id),
        alternativeCount,
        recentTrend: recentTrendByClinicId[clinic.id] ?? "unknown",
      };
    }),
  [
    activeAlertClinicIds,
    clinicRows,
    offlineQueueClinicIds,
    recentTrendByClinicId,
    state,
  ],
);
```

- [ ] **Step 6: Build command center**

```tsx
const commandCenter = useMemo(
  () =>
    buildDistrictCommandCenter({
      session,
      clinics: commandClinics,
      activeAlertCount: activeAlerts.length,
      offlineQueueCount: state.offlineQueue.length,
      lastSyncAt: state.lastSyncAt,
      selectedClinicId: selectedCommandClinicId,
    }),
  [
    activeAlerts.length,
    commandClinics,
    selectedCommandClinicId,
    session,
    state.lastSyncAt,
    state.offlineQueue.length,
  ],
);
```

- [ ] **Step 7: Add queue selection handler**

```tsx
const selectCommandClinic = (clinicId: string) => {
  setSelectedCommandClinicId(clinicId);
  setSelectedClinicId(clinicId);
};
```

- [ ] **Step 8: Replace top-level layout**

The top of the returned JSX should follow this hierarchy:

```tsx
return (
  <div className="grid gap-5 pb-6">
    <DistrictCommandBrief brief={commandCenter.brief} />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <SeverityQueue
        items={commandCenter.queue}
        selectedClinicId={commandCenter.selectedItem?.clinicId ?? null}
        onSelectClinic={selectCommandClinic}
      />
      <InterventionRail
        selectedItem={commandCenter.selectedItem}
        intervention={commandCenter.intervention}
        replayDisabled={replayNonIdle}
        onOpenClinic={openClinicDetail}
        onTriggerReroute={handleTriggerReroute}
        onSyncOfflineReports={handleSyncOfflineReports}
        onStartIncidentReplay={startIncidentReplay}
      />
    </div>

    <SignalAnalytics analytics={commandCenter.analytics} />
    <VerificationHandover handover={commandCenter.handover} />

    <SupportingOperations>
      {/* Existing status filter banner, StatusSummary, PilotReadinessPanel, map, replay, controls, alerts, report stream, and ClinicTable go here. */}
    </SupportingOperations>
  </div>
);
```

Move existing modules into `SupportingOperations` instead of deleting behavior.

- [ ] **Step 9: Remove old prototype imports**

Delete imports from `components/demo/dashboard/*` and `lib/demo/dashboard-personalization` if present.

- [ ] **Step 10: Run focused type/build check**

```bash
npm run lint
```

Expected: PASS. If unrelated lint already fails, capture the exact unrelated failure and do not hide it.

- [ ] **Step 11: Commit route composition**

```bash
git add app/(demo)/demo/page.tsx app/(demo)/demo/page-client.tsx
git commit -m "feat: compose district severity command center"
```

---

## Task 8: E2E smoke coverage

**Files:**
- Modify: `tests/e2e/phase-one-smoke.spec.ts`

- [ ] **Step 1: Add stable smoke assertions**

Add assertions after the existing login/demo navigation flow reaches `/demo`.

```ts
await expect(page.getByRole("heading", { name: /district command brief/i })).toBeVisible();
await expect(page.getByText(/unified severity queue/i)).toBeVisible();
await expect(page.getByText(/intervention rail/i)).toBeVisible();
```

If the command brief heading is visually rendered as text rather than a heading, use a text assertion instead:

```ts
await expect(page.getByText(/district command brief/i)).toBeVisible();
```

- [ ] **Step 2: Add queue-to-rail interaction smoke**

Use a robust selector based on visible queue content. Avoid exact counts.

```ts
const firstPriority = page.getByRole("button", { name: /priority 1/i });
await expect(firstPriority).toBeVisible();
await firstPriority.click();
await expect(page.getByText(/primary action/i)).toBeVisible();
await expect(page.getByText(/expected outcome/i)).toBeVisible();
```

- [ ] **Step 3: Run the specific E2E file only if the local E2E stack is already running**

```bash
npm run test:e2e -- tests/e2e/phase-one-smoke.spec.ts
```

Expected: PASS. If the E2E stack is not running, do not start long-lived services without user approval; report that the E2E update is ready but unverified.

- [ ] **Step 4: Commit E2E smoke**

```bash
git add tests/e2e/phase-one-smoke.spec.ts
git commit -m "test: cover district command center smoke"
```

---

## Task 9: Prototype cleanup and final verification

**Files:**
- Delete if unreferenced: `components/demo/dashboard/*`
- Delete if unreferenced: `lib/demo/dashboard-personalization.ts`
- Delete if unreferenced: `lib/demo/dashboard-personalization.test.ts`

- [ ] **Step 1: Confirm no prototype imports remain**

```bash
rg "dashboard-personalization|components/demo/dashboard|demo/dashboard" app components lib tests
```

Expected: no matches for prototype-specific imports. If matches remain, update those imports to command-center equivalents or delete the unused files.

- [ ] **Step 2: Run unit tests**

```bash
npm test -- lib/demo/district-command-center.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Optional build verification**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit cleanup**

```bash
git add app components lib tests
git commit -m "chore: clean up dashboard personalization prototype"
```

If there are no cleanup changes, skip this commit.

---

## Self-review

- Spec coverage: The plan implements the risk brief, unified severity queue, intervention rail, signal analytics, verification/handover, supporting operations, deterministic severity scoring, selection behavior, preserved demo actions, and smoke coverage required by the approved spec.
- Placeholder scan: The plan contains no `TBD`, `TODO`, or vague implementation-only steps. Each code step includes concrete paths and snippets.
- Type consistency: The model types used by components match `DistrictCommandCenter`, `DistrictSeverityQueueItem`, and `DistrictCommandClinicInput` defined in Task 3.
- Scope check: The plan targets district operator/admin only and avoids implementing other role-native dashboards in this pass.
