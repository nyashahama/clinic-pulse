# Phase 3 Pilot Data And Product Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ClinicPulse pilot-safe by surfacing provenance, freshness, review state, sync integrity, and safety boundaries for operational data.

**Architecture:** Build Phase 3 as a trust layer over the existing Next.js App Router, Go chi API, and Postgres schema. Prefer deterministic view models and existing tables first, add minimal provenance/ingestion fields only where existing data cannot answer pilot trust questions, and keep background-style work idempotent and auditable without introducing queue infrastructure.

**Tech Stack:** Next.js 16, React 19, TypeScript, server actions/loaders, Vitest, Playwright, Go chi API, Postgres migrations, Go tests, Docker API container smoke tests.

---

## File Map

Create:

- `lib/product/data-trust.ts`: view models for provenance, freshness, review state, confidence, and evidence links.
- `lib/product/data-trust.test.ts`: unit tests for trust-state classification and display labels.
- `lib/product/pilot-route-policy.ts`: inventory and policy helpers for pilot-critical placeholder routes.
- `lib/product/pilot-route-policy.test.ts`: unit tests for placeholder policy coverage.
- `app/(legal)/legal/safety/page.tsx`: public pilot safety and disclaimer page.
- `tests/e2e/phase-3-pilot-integrity.spec.ts`: end-to-end checks for trust labels, placeholders, safety pages, and sync visibility.
- `docs/phase-3-pilot-data-product-integrity-closeout.md`: final closeout after implementation.

Modify likely:

- `services/api/migrations/0010_pilot_data_integrity.sql`: minimal provenance/ingestion schema if existing tables are insufficient.
- `services/api/internal/store/models.go`: provenance, ingestion, and sync response models.
- `services/api/internal/store/*`: queries for ingestion evidence, provenance state, and sync attempt visibility.
- `services/api/internal/http/router.go`: route any new ingestion or trust-state endpoints.
- `services/api/internal/http/handlers.go`: handlers for controlled ingestion evidence and sync visibility.
- `services/api/internal/http/handlers_test.go`: handler auth, scoping, and response tests.
- `services/api/internal/service/*`: ingestion validation, provenance, stale reconciliation, export/webhook retry helpers if needed.
- `lib/workspace/api-types.ts`: frontend API response types for trust and ingestion evidence.
- `lib/workspace/api-client.ts`: frontend API helpers for any new endpoints.
- `lib/workspace/api-client.test.ts`: API route contract tests.
- `lib/workspace/server-hydration.ts`: hydrate pilot trust data where existing surfaces need it.
- `app/(workspace)/field/page.tsx`: show field trust/sync state summary.
- `app/(workspace)/field/submit-report/page.tsx`: replace placeholder with pilot-safe submit/report status surface if still placeholder.
- `app/(workspace)/field/sync-queue/page.tsx`: replace placeholder with queue/sync state surface.
- `app/(workspace)/field/drafts-sync/page.tsx`: replace placeholder or hide from pilot navigation if redundant.
- `app/(workspace)/district/page.tsx`: expose data trust labels in district operating view.
- `app/(workspace)/admin/data-ingestion/page.tsx`: show ingestion source, latest run, sync failure, and stale reconciliation evidence.
- `app/(workspace)/admin/audit-evidence/page.tsx`: include provenance, ingestion, sync, export, webhook, and safety-relevant evidence.
- `app/(workspace)/admin/reporting-coverage/page.tsx`: include source/freshness/review confidence summaries.
- `app/(workspace)/admin/security/page.tsx`: link safety-sensitive partner credential risks where relevant.
- `app/(auth)/login/page.tsx`: link safety page beside privacy and terms.
- `app/(auth)/register/page.tsx`: link safety page beside privacy and terms.
- `components/product/*`: add compact trust labels or evidence cells if existing primitives need extension.
- `lib/product/workspace-config.tsx`: remove/hide pilot-critical placeholder routes from navigation if not completed.
- `docs/api.md`: document changed ingestion/sync/trust endpoints.
- `docs/architecture.md`: document pilot data trust flow.
- `docs/database-schema.md`: document provenance and ingestion evidence fields.
- `docs/deployment.md`: document any manual ingestion/reconciliation command.
- `docs/release.md`: add Phase 3 pilot integrity gate.
- `docs/production-readiness-execution-plan.md`: update Phase 3 lifecycle status and next phase.

Reference:

- Spec: `docs/phase-3-pilot-data-product-integrity-spec.md`
- Readiness roadmap: `docs/production-readiness-execution-plan.md`
- Phase 2 closeout: `docs/phase-2-security-and-auth-hardening-closeout.md`
- API docs: `docs/api.md`
- Architecture docs: `docs/architecture.md`
- Database docs: `docs/database-schema.md`

## Task 0: Prepare The Phase Branch And Baseline

**Files:**

- Read: `docs/phase-3-pilot-data-product-integrity-spec.md`
- Read: `docs/production-readiness-execution-plan.md`
- Read: `docs/phase-2-security-and-auth-hardening-closeout.md`

- [ ] **Step 1: Create the implementation branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/phase-3-pilot-data-product-integrity
```

Expected: branch switches to `feature/phase-3-pilot-data-product-integrity` from current `main`.

- [ ] **Step 2: Confirm clean branch state**

Run:

```bash
git status --short --branch
```

Expected: branch is clean.

- [ ] **Step 3: Run inherited release baseline**

Run:

```bash
make verify
```

Expected: existing web tests, lint, API tests, and production build pass before Phase 3 changes begin.

- [ ] **Step 4: Inventory pilot-critical placeholders**

Run:

```bash
rg -n "ModulePlaceholderPage|Implementation placeholder|module implementation will be added" app components lib
```

Expected: output identifies any placeholder routes that must be completed, hidden, or explicitly downgraded before pilot.

- [ ] **Step 5: Commit planning docs if they are intended for the PR**

Run only if these phase docs should be part of the public PR:

```bash
git add docs/phase-3-pilot-data-product-integrity-spec.md docs/phase-3-pilot-data-product-integrity-implementation-plan.md
git commit -m "docs: plan phase 3 pilot data integrity"
```

Expected: one docs commit. If planning docs are local-only for this branch, skip this step and keep implementation commits separate.

## Task 1: Add Data Trust View Models

**Files:**

- Create: `lib/product/data-trust.ts`
- Create: `lib/product/data-trust.test.ts`

- [ ] **Step 1: Write failing data trust tests**

Create `lib/product/data-trust.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  buildDataTrustState,
  formatTrustLabel,
  type DataTrustInput,
} from "@/lib/product/data-trust";

const baseInput: DataTrustInput = {
  source: "field_report",
  freshness: "fresh",
  reviewState: "reviewed",
  lastVerifiedAt: "2026-05-16T08:00:00.000Z",
  evidenceHref: "/admin/audit-evidence",
};

describe("data trust view models", () => {
  it("marks reviewed fresh field data as high confidence", () => {
    expect(buildDataTrustState(baseInput)).toEqual({
      tone: "clear",
      confidence: "high",
      label: "Reviewed field data",
      description: "Fresh field-submitted data reviewed at 2026-05-16 08:00 UTC.",
      evidenceHref: "/admin/audit-evidence",
    });
  });

  it("marks stale imported data as low confidence", () => {
    expect(
      buildDataTrustState({
        ...baseInput,
        source: "pilot_import",
        freshness: "stale",
        reviewState: "reviewed",
      }),
    ).toMatchObject({
      tone: "blocked",
      confidence: "low",
      label: "Stale imported data",
    });
  });

  it("marks pending review field data as medium confidence", () => {
    expect(
      buildDataTrustState({
        ...baseInput,
        reviewState: "pending_review",
      }),
    ).toMatchObject({
      tone: "attention",
      confidence: "medium",
      label: "Pending review",
    });
  });

  it("formats compact trust labels", () => {
    expect(formatTrustLabel("seeded_demo", "unknown", "unknown")).toBe("Demo data / unknown freshness / unknown review");
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- lib/product/data-trust.test.ts
```

Expected: FAIL because `lib/product/data-trust.ts` does not exist.

- [ ] **Step 3: Implement data trust helpers**

Create `lib/product/data-trust.ts`:

```ts
export type DataSource = "seeded_demo" | "pilot_import" | "field_report" | "system_reconciliation" | "partner_export";
export type DataFreshness = "fresh" | "needs_confirmation" | "stale" | "unknown";
export type ReviewState = "reviewed" | "pending_review" | "rejected" | "not_required" | "unknown";
export type TrustConfidence = "high" | "medium" | "low" | "unknown";
export type TrustTone = "clear" | "attention" | "blocked";

export type DataTrustInput = {
  source: DataSource;
  freshness: DataFreshness;
  reviewState: ReviewState;
  lastVerifiedAt?: string | null;
  evidenceHref?: string | null;
};

export type DataTrustState = {
  tone: TrustTone;
  confidence: TrustConfidence;
  label: string;
  description: string;
  evidenceHref: string | null;
};

const sourceLabels: Record<DataSource, string> = {
  seeded_demo: "Demo data",
  pilot_import: "Imported data",
  field_report: "Field data",
  system_reconciliation: "System reconciliation",
  partner_export: "Partner export",
};

const freshnessLabels: Record<DataFreshness, string> = {
  fresh: "freshness confirmed",
  needs_confirmation: "needs confirmation",
  stale: "stale",
  unknown: "unknown freshness",
};

const reviewLabels: Record<ReviewState, string> = {
  reviewed: "reviewed",
  pending_review: "pending review",
  rejected: "rejected",
  not_required: "review not required",
  unknown: "unknown review",
};

export function buildDataTrustState(input: DataTrustInput): DataTrustState {
  if (input.reviewState === "rejected") {
    return state(input, "blocked", "low", "Rejected data", "This data was rejected during review.");
  }

  if (input.freshness === "stale") {
    return state(input, "blocked", "low", `Stale ${sourceLabels[input.source].toLowerCase()}`, descriptionFor(input));
  }

  if (input.reviewState === "pending_review" || input.freshness === "needs_confirmation") {
    return state(input, "attention", "medium", "Pending review", descriptionFor(input));
  }

  if (input.source === "seeded_demo") {
    return state(input, "attention", "low", "Demo data", descriptionFor(input));
  }

  if (input.freshness === "fresh" && (input.reviewState === "reviewed" || input.reviewState === "not_required")) {
    return state(input, "clear", "high", reviewedLabel(input), descriptionFor(input));
  }

  return state(input, "attention", "unknown", "Trust state unknown", descriptionFor(input));
}

export function formatTrustLabel(source: DataSource, freshness: DataFreshness, reviewState: ReviewState): string {
  return `${sourceLabels[source]} / ${freshnessLabels[freshness]} / ${reviewLabels[reviewState]}`;
}

function reviewedLabel(input: DataTrustInput): string {
  if (input.source === "field_report") return "Reviewed field data";
  if (input.source === "pilot_import") return "Reviewed imported data";
  return sourceLabels[input.source];
}

function state(
  input: DataTrustInput,
  tone: TrustTone,
  confidence: TrustConfidence,
  label: string,
  description: string,
): DataTrustState {
  return {
    tone,
    confidence,
    label,
    description,
    evidenceHref: input.evidenceHref ?? null,
  };
}

function descriptionFor(input: DataTrustInput): string {
  const verified = input.lastVerifiedAt ? ` at ${formatUtc(input.lastVerifiedAt)}` : "";
  if (input.source === "field_report" && input.freshness === "fresh" && input.reviewState === "reviewed") {
    return `Fresh field-submitted data reviewed${verified}.`;
  }
  return `${sourceLabels[input.source]} is ${freshnessLabels[input.freshness]} and ${reviewLabels[input.reviewState]}${verified}.`;
}

function formatUtc(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}
```

- [ ] **Step 4: Verify the unit test passes**

Run:

```bash
npm test -- lib/product/data-trust.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit data trust helpers**

Run:

```bash
git add lib/product/data-trust.ts lib/product/data-trust.test.ts
git commit -m "feat: add pilot data trust view models"
```

Expected: one commit with the data trust helper and tests.

## Task 2: Add Pilot Route Policy And Placeholder Inventory

**Files:**

- Create: `lib/product/pilot-route-policy.ts`
- Create: `lib/product/pilot-route-policy.test.ts`
- Modify: `lib/product/workspace-config.tsx`

- [ ] **Step 1: Write failing route policy tests**

Create `lib/product/pilot-route-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { pilotRoutePolicyFor, pilotCriticalRoutes } from "@/lib/product/pilot-route-policy";

describe("pilot route policy", () => {
  it("tracks pilot-critical field, district, and admin routes", () => {
    expect(pilotCriticalRoutes).toContain("/field/submit-report");
    expect(pilotCriticalRoutes).toContain("/field/sync-queue");
    expect(pilotCriticalRoutes).toContain("/district");
    expect(pilotCriticalRoutes).toContain("/admin/data-ingestion");
    expect(pilotCriticalRoutes).toContain("/admin/audit-evidence");
  });

  it("requires pilot-critical placeholders to be completed or hidden", () => {
    expect(pilotRoutePolicyFor("/field/sync-queue")).toEqual({
      route: "/field/sync-queue",
      pilotCritical: true,
      allowedOutcomes: ["complete", "hide"],
    });
  });

  it("allows demo-only routes to stay marked as sandbox", () => {
    expect(pilotRoutePolicyFor("/district/interventions")).toEqual({
      route: "/district/interventions",
      pilotCritical: false,
      allowedOutcomes: ["demo_sandbox", "hide"],
    });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- lib/product/pilot-route-policy.test.ts
```

Expected: FAIL because `lib/product/pilot-route-policy.ts` does not exist.

- [ ] **Step 3: Implement route policy helper**

Create `lib/product/pilot-route-policy.ts`:

```ts
export type PilotRouteOutcome = "complete" | "hide" | "demo_sandbox";

export type PilotRoutePolicy = {
  route: string;
  pilotCritical: boolean;
  allowedOutcomes: PilotRouteOutcome[];
};

export const pilotCriticalRoutes = [
  "/field",
  "/field/submit-report",
  "/field/sync-queue",
  "/field/drafts-sync",
  "/district",
  "/admin/reporting-coverage",
  "/admin/audit-evidence",
  "/admin/data-ingestion",
  "/admin/security",
  "/admin/tenant-health",
  "/admin/partner-readiness",
] as const;

const pilotCriticalRouteSet = new Set<string>(pilotCriticalRoutes);

export function pilotRoutePolicyFor(route: string): PilotRoutePolicy {
  const pilotCritical = pilotCriticalRouteSet.has(route);

  return {
    route,
    pilotCritical,
    allowedOutcomes: pilotCritical ? ["complete", "hide"] : ["demo_sandbox", "hide"],
  };
}
```

- [ ] **Step 4: Verify route policy tests pass**

Run:

```bash
npm test -- lib/product/pilot-route-policy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Inspect current navigation against policy**

Run:

```bash
rg -n '"/field/submit-report"|"/field/sync-queue"|"/field/drafts-sync"|"/district/interventions"|"/district/severity-queue"|"/district/clinic-network"' lib/product/workspace-config.tsx app components
```

Expected: identify routes that are linked from navigation while still placeholder-backed.

- [ ] **Step 6: Hide any pilot-critical placeholder routes that will not be completed in this phase**

In `lib/product/workspace-config.tsx`, remove sidebar/nav entries for pilot-critical routes only if their page still renders placeholder content and the phase will not complete that page.

Expected implementation shape:

```ts
// Keep /field as the role home. Do not link unfinished sub-routes from primary navigation until they have pilot-safe content.
```

Do not remove completed admin governance routes.

- [ ] **Step 7: Commit route policy**

Run:

```bash
git add lib/product/pilot-route-policy.ts lib/product/pilot-route-policy.test.ts lib/product/workspace-config.tsx
git commit -m "feat: define pilot route policy"
```

Expected: one commit. If `workspace-config.tsx` did not need changes, omit it from `git add`.

## Task 3: Complete Field Sync Visibility

**Files:**

- Modify: `app/(workspace)/field/page.tsx`
- Modify: `app/(workspace)/field/sync-queue/page.tsx`
- Modify: `app/(workspace)/field/drafts-sync/page.tsx`
- Modify: `lib/workspace/api-types.ts`
- Modify: `lib/workspace/api-client.ts`
- Modify: `lib/workspace/api-client.test.ts`
- Modify: `lib/workspace/server-hydration.ts`
- Test: `tests/e2e/phase-3-pilot-integrity.spec.ts`

- [ ] **Step 1: Add failing API client expectations for sync summary visibility**

In `lib/workspace/api-client.test.ts`, add:

```ts
it("requests the authenticated sync summary for pilot visibility", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse({
    queuedReports: 1,
    syncedReports: 2,
    failedReports: 1,
    duplicateReports: 1,
    conflictsNeedingAttention: 1,
    validationFailures: 1,
    staleClinics: 1,
    needsConfirmationClinics: 1,
    lastSyncedAt: "2026-05-16T08:00:00.000Z",
  }));

  const result = await getSyncSummary({ init: { headers: { cookie: "clinicpulse_session=test" } } });

  expect(fetchMock).toHaveBeenCalledWith(
    "https://api.example.test/v1/sync/summary",
    expect.objectContaining({ headers: expect.any(Headers) }),
  );
  expect(result.failedReports).toBe(1);
  expect(result.conflictsNeedingAttention).toBe(1);
});
```

If `getSyncSummary` already exists, adapt the import and expected response shape instead of creating a duplicate helper.

- [ ] **Step 2: Run targeted API client test**

Run:

```bash
npm test -- lib/workspace/api-client.test.ts
```

Expected: FAIL only if the helper/shape is missing. If it already passes, continue and reuse existing helper.

- [ ] **Step 3: Add or align sync summary types and client helper**

In `lib/workspace/api-types.ts`, ensure this type exists:

```ts
export type SyncSummaryApiResponse = {
  queuedReports: number;
  syncedReports: number;
  failedReports: number;
  duplicateReports: number;
  conflictsNeedingAttention: number;
  validationFailures: number;
  staleClinics: number;
  needsConfirmationClinics: number;
  lastSyncedAt: string | null;
};
```

In `lib/workspace/api-client.ts`, ensure this helper exists:

```ts
export async function getSyncSummary(options?: ClinicPulseApiRequestOptions) {
  return requestClinicPulseApi<SyncSummaryApiResponse>(["v1", "sync", "summary"], options);
}
```

- [ ] **Step 4: Verify API client tests pass**

Run:

```bash
npm test -- lib/workspace/api-client.test.ts
```

Expected: PASS.

- [ ] **Step 5: Replace `/field/sync-queue` placeholder with pilot-safe sync state page**

In `app/(workspace)/field/sync-queue/page.tsx`, render a server component that:

```tsx
import { requireWorkflowSession } from "@/lib/auth/session";
import { getSyncSummary } from "@/lib/workspace/api-client";

export default async function FieldSyncQueuePage() {
  const session = await requireWorkflowSession("reporter");
  const summary = await getSyncSummary({
    init: { headers: { cookie: `${session.cookieName}=${session.cookieValue}` } },
  });

  return (
    <main className="space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Field sync integrity</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sync queue</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Server-authoritative sync state for queued, synced, duplicate, conflict, and failed field reports.
        </p>
      </header>
      <section className="grid gap-3 md:grid-cols-3">
        <SyncMetric label="Queued" value={summary.queuedReports} />
        <SyncMetric label="Synced" value={summary.syncedReports} />
        <SyncMetric label="Failed" value={summary.failedReports} tone={summary.failedReports > 0 ? "attention" : "clear"} />
        <SyncMetric label="Duplicates" value={summary.duplicateReports} />
        <SyncMetric label="Conflicts" value={summary.conflictsNeedingAttention} tone={summary.conflictsNeedingAttention > 0 ? "attention" : "clear"} />
        <SyncMetric label="Validation failures" value={summary.validationFailures} tone={summary.validationFailures > 0 ? "attention" : "clear"} />
      </section>
      <p className="text-sm text-muted-foreground">
        Last sync evidence: {summary.lastSyncedAt ? new Date(summary.lastSyncedAt).toLocaleString("en-ZA") : "No completed sync recorded"}.
      </p>
    </main>
  );
}

function SyncMetric({ label, value, tone = "clear" }: { label: string; value: number; tone?: "clear" | "attention" }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={tone === "attention" ? "text-2xl font-semibold text-amber-600" : "text-2xl font-semibold"}>{value}</p>
    </div>
  );
}
```

Adjust the session cookie access to match the current `requireWorkflowSession` return type. If that helper does not expose `cookieName` and `cookieValue`, use the same cookie-forwarding pattern as existing admin/field server loaders.

- [ ] **Step 6: Replace or downgrade `/field/drafts-sync` placeholder**

If there is no real server-backed draft model, update `app/(workspace)/field/drafts-sync/page.tsx` to clearly state:

```tsx
<h1>Draft sync is local-only before submission</h1>
<p>Drafts remain on this browser until submitted. The server becomes authoritative only after a report is synced and receives a receipt.</p>
```

Do not imply server persistence for unsynced browser drafts unless implemented.

- [ ] **Step 7: Add field sync E2E coverage**

Create or extend `tests/e2e/phase-3-pilot-integrity.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers/auth";

test("reporter can inspect sync queue trust state", async ({ page }) => {
  await signInAs(page, "reporter");
  await page.goto("/field/sync-queue");

  await expect(page.getByRole("heading", { name: "Sync queue" })).toBeVisible();
  await expect(page.getByText("Server-authoritative sync state")).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});
```

- [ ] **Step 8: Verify field sync tests**

Run:

```bash
npm test -- lib/workspace/api-client.test.ts
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npx playwright test tests/e2e/phase-3-pilot-integrity.spec.ts --project=desktop-chrome
```

Expected: unit tests pass and Playwright reporter sync queue test passes.

- [ ] **Step 9: Commit field sync visibility**

Run:

```bash
git add lib/workspace/api-types.ts lib/workspace/api-client.ts lib/workspace/api-client.test.ts app/\(demo\)/field/sync-queue/page.tsx app/\(demo\)/field/drafts-sync/page.tsx tests/e2e/phase-3-pilot-integrity.spec.ts
git commit -m "feat: show pilot sync integrity state"
```

Expected: one commit with field sync visibility.

## Task 4: Surface Trust Labels On District And Admin Operational Data

**Files:**

- Modify: `app/(workspace)/district/page.tsx`
- Modify: `app/(workspace)/admin/reporting-coverage/page.tsx`
- Modify: `app/(workspace)/admin/data-ingestion/page.tsx`
- Modify: `app/(workspace)/admin/audit-evidence/page.tsx`
- Modify: `components/product/*` if shared trust label component is needed.
- Test: `lib/product/data-trust.test.ts`
- Test: `tests/e2e/phase-3-pilot-integrity.spec.ts`

- [ ] **Step 1: Add trust label component if duplicated UI appears**

If two or more routes need the same badge/cell, create a small local component near the product primitives:

```tsx
import type { DataTrustState } from "@/lib/product/data-trust";

export function DataTrustBadge({ state }: { state: DataTrustState }) {
  const toneClass = state.tone === "clear" ? "border-emerald-200 text-emerald-700" : state.tone === "attention" ? "border-amber-200 text-amber-700" : "border-red-200 text-red-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${toneClass}`} title={state.description}>
      {state.label}
    </span>
  );
}
```

Use the existing component style if the product shell already has an equivalent badge primitive.

- [ ] **Step 2: Add district trust labels**

In `app/(workspace)/district/page.tsx`, add compact source/freshness/review labels near clinic status or review queue rows:

```tsx
const trust = buildDataTrustState({
  source: clinic.latestReportId ? "field_report" : "seeded_demo",
  freshness: clinic.freshness ?? "unknown",
  reviewState: clinic.pendingReviewCount > 0 ? "pending_review" : "reviewed",
  lastVerifiedAt: clinic.lastReportedAt,
  evidenceHref: `/district/clinics/${clinic.id}`,
});
```

Expected visible copy includes one of:

- `Reviewed field data`
- `Pending review`
- `Stale imported data`
- `Demo data`

- [ ] **Step 3: Add reporting coverage trust labels**

In `app/(workspace)/admin/reporting-coverage/page.tsx`, add columns or summary cards for:

- Source.
- Freshness.
- Review state.
- Latest evidence link.

Use `buildDataTrustState` rather than hand-coded labels.

- [ ] **Step 4: Add data ingestion trust evidence**

In `app/(workspace)/admin/data-ingestion/page.tsx`, show:

- Latest sync/ingestion evidence.
- Stale reconciliation state.
- Validation failure count.
- Duplicate/conflict count.
- A clear note when data is seeded demo rather than pilot-imported.

- [ ] **Step 5: Add audit evidence trust filters or labels**

In `app/(workspace)/admin/audit-evidence/page.tsx`, include trust-related event groups for:

- Report submission.
- Report review.
- Stale reconciliation.
- Sync attempt.
- Partner export.
- Webhook delivery/test.
- Admin lifecycle.

If filter infrastructure already exists, add trust-related filter values. If not, keep it as visible grouped evidence.

- [ ] **Step 6: Extend E2E coverage for trust labels**

In `tests/e2e/phase-3-pilot-integrity.spec.ts`, add:

```ts
test("district and admin surfaces expose data trust labels", async ({ page }) => {
  await signInAs(page, "district_manager");
  await page.goto("/district");
  await expect(page.getByText(/Reviewed field data|Pending review|Demo data|Stale/i).first()).toBeVisible();

  await signInAs(page, "org_admin");
  await page.goto("/admin/reporting-coverage");
  await expect(page.getByText(/freshness|review state|source/i).first()).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);

  await page.goto("/admin/data-ingestion");
  await expect(page.getByText(/sync|ingestion|stale reconciliation/i).first()).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});
```

- [ ] **Step 7: Verify trust label tests**

Run:

```bash
npm test -- lib/product/data-trust.test.ts
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npx playwright test tests/e2e/phase-3-pilot-integrity.spec.ts --project=desktop-chrome
```

Expected: unit and targeted E2E tests pass.

- [ ] **Step 8: Commit trust labels**

Run:

```bash
git add lib/product/data-trust.ts lib/product/data-trust.test.ts app/\(demo\)/district/page.tsx app/\(demo\)/admin/reporting-coverage/page.tsx app/\(demo\)/admin/data-ingestion/page.tsx app/\(demo\)/admin/audit-evidence/page.tsx tests/e2e/phase-3-pilot-integrity.spec.ts
git commit -m "feat: surface pilot data trust labels"
```

Expected: one commit. Add any shared component path if created.

## Task 5: Add Controlled Ingestion Evidence If Existing Data Is Insufficient

**Files:**

- Create or modify: `services/api/migrations/0010_pilot_data_integrity.sql`
- Modify: `services/api/internal/store/models.go`
- Modify: `services/api/internal/store/*`
- Modify: `services/api/internal/http/router.go`
- Modify: `services/api/internal/http/handlers.go`
- Modify: `services/api/internal/http/handlers_test.go`
- Modify: `docs/database-schema.md`
- Modify: `docs/api.md`

- [ ] **Step 1: Decide whether schema is necessary**

Inspect existing models and admin ingestion route output.

If existing `report_sync_attempts`, `audit_events`, and current status records can show source, validation failures, stale reconciliation, and latest ingestion evidence, skip this task and document the decision in Task 9.

If not, continue with the minimal schema below.

- [ ] **Step 2: Write migration coverage test**

In the existing migration test file, add `0010_pilot_data_integrity.sql` to the expected migration list.

Expected test intent:

```go
if !strings.Contains(string(migrationSQL), "pilot_ingestion_runs") {
    t.Fatal("expected pilot ingestion runs table")
}
```

Use the repo's current migration test helper style.

- [ ] **Step 3: Add minimal ingestion evidence migration**

Create `services/api/migrations/0010_pilot_data_integrity.sql`:

```sql
CREATE TABLE IF NOT EXISTS pilot_ingestion_runs (
    id TEXT PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisations(id),
    source_name TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'partial')),
    records_received INTEGER NOT NULL DEFAULT 0,
    records_imported INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    actor_user_id BIGINT REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pilot_ingestion_runs_org_started
    ON pilot_ingestion_runs (organisation_id, started_at DESC);
```

- [ ] **Step 4: Add store model**

In `services/api/internal/store/models.go`, add:

```go
type PilotIngestionRun struct {
    ID              string
    OrganisationID  int64
    SourceName      string
    SourceReference string
    Status          string
    RecordsReceived int
    RecordsImported int
    RecordsRejected int
    ValidationErrors []string
    ActorUserID     *int64
    StartedAt       time.Time
    CompletedAt     *time.Time
}
```

Adjust package imports for `time` only if not already present.

- [ ] **Step 5: Add query and handler tests before implementation**

In store and handler tests, cover:

- Organisation admin sees own organisation ingestion runs.
- System admin can see platform ingestion runs.
- Reporter cannot access ingestion evidence.
- Failed/partial runs expose validation error counts, not secrets.

Expected command:

```bash
cd services/api && go test ./internal/store ./internal/http
```

Expected: FAIL until queries/handlers are implemented.

- [ ] **Step 6: Implement query and handler**

Add query shape:

```go
func (s *Store) ListPilotIngestionRuns(ctx context.Context, organisationID int64, limit int) ([]PilotIngestionRun, error) {
    // SELECT fields from pilot_ingestion_runs WHERE organisation_id = $1 ORDER BY started_at DESC LIMIT $2
}
```

Add route shape in `router.go`:

```go
router.With(requireAuth, orgAdminOrHigher).Get("/v1/admin/ingestion/runs", handler.ListPilotIngestionRuns)
```

Response shape:

```json
{
  "runs": [
    {
      "id": "ingest_20260516_001",
      "sourceName": "pilot CSV import",
      "sourceReference": "district-upload-2026-05-16.csv",
      "status": "partial",
      "recordsReceived": 20,
      "recordsImported": 18,
      "recordsRejected": 2,
      "validationErrorCount": 2,
      "startedAt": "2026-05-16T08:00:00Z",
      "completedAt": "2026-05-16T08:00:03Z"
    }
  ]
}
```

- [ ] **Step 7: Verify Go tests**

Run:

```bash
cd services/api && go test ./internal/store ./internal/http
```

Expected: PASS.

- [ ] **Step 8: Document ingestion evidence**

Update `docs/api.md` with `GET /v1/admin/ingestion/runs` if added.

Update `docs/database-schema.md` with `pilot_ingestion_runs` if added.

- [ ] **Step 9: Commit ingestion evidence**

Run:

```bash
git add services/api/migrations/0010_pilot_data_integrity.sql services/api/internal/store services/api/internal/http docs/api.md docs/database-schema.md
git commit -m "feat: record pilot ingestion evidence"
```

Expected: one commit. If schema was skipped, commit only docs/code that wire existing evidence and use message `docs: record pilot ingestion evidence decision`.

## Task 6: Add Safety, Privacy, And Terms Surfaces

**Files:**

- Create: `app/(legal)/legal/safety/page.tsx`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`
- Modify: field, district, finder, admin, or export routes where safety links are relevant.
- Test: `tests/e2e/phase-3-pilot-integrity.spec.ts`

- [ ] **Step 1: Create safety page test**

In `tests/e2e/phase-3-pilot-integrity.spec.ts`, add:

```ts
test("pilot safety, privacy, and terms pages are reachable", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /safety/i }).click();
  await expect(page).toHaveURL(/\/legal\/safety/);
  await expect(page.getByRole("heading", { name: /Pilot safety/i })).toBeVisible();
  await expect(page.getByText(/human confirmation/i)).toBeVisible();

  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { name: /Privacy/i })).toBeVisible();

  await page.goto("/legal/terms");
  await expect(page.getByRole("heading", { name: /Terms/i })).toBeVisible();
});
```

- [ ] **Step 2: Run failing E2E safety test**

Run:

```bash
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npx playwright test tests/e2e/phase-3-pilot-integrity.spec.ts --project=desktop-chrome -g "pilot safety"
```

Expected: FAIL because `/legal/safety` or login safety link does not exist.

- [ ] **Step 3: Add safety page**

Create `app/(legal)/legal/safety/page.tsx`:

```tsx
import Link from "next/link";

export default function SafetyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">ClinicPulse pilot boundary</p>
        <h1 className="text-3xl font-semibold tracking-tight">Pilot safety and operational disclaimer</h1>
        <p className="text-muted-foreground">
          ClinicPulse helps teams understand clinic operating status, field reports, and routing context. It does not replace clinical judgment, emergency services, or local operational confirmation.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Human confirmation is required</h2>
        <p className="text-sm text-muted-foreground">
          Clinic availability, service status, queue pressure, and rerouting guidance must be confirmed by responsible staff before real-world patient movement or public communication.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data trust states matter</h2>
        <p className="text-sm text-muted-foreground">
          Data marked as pending review, stale, needs confirmation, demo-seeded, or failed sync should not be treated as reviewed current operating truth.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pilot scope</h2>
        <p className="text-sm text-muted-foreground">
          The pilot is intended for controlled operational evaluation. It is not a legal compliance certification, emergency dispatch system, medical device, or public health authority record.
        </p>
      </section>

      <footer className="flex gap-4 text-sm">
        <Link className="font-medium underline" href="/legal/privacy">Privacy</Link>
        <Link className="font-medium underline" href="/legal/terms">Terms</Link>
      </footer>
    </main>
  );
}
```

- [ ] **Step 4: Link safety page from auth pages**

In `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx`, add a `Safety` link beside existing privacy and terms links:

```tsx
<Link href="/legal/safety">Safety</Link>
```

Preserve the current visual treatment and layout.

- [ ] **Step 5: Add targeted safety notes to pilot-relevant flows**

Add concise safety links or notes to routes where users might act on operational guidance:

- `/field`: queued/unsynced report note.
- `/district`: human confirmation note for rerouting/status decisions.
- `/finder`: availability confirmation note if public users can interpret status.
- `/admin/partner-readiness` or exports: exported data freshness note.

Use short copy:

```tsx
<p className="text-xs text-muted-foreground">
  Pilot safety: confirm stale or pending data before operational decisions. <Link href="/legal/safety" className="underline">Read safety notes</Link>.
</p>
```

- [ ] **Step 6: Verify safety E2E**

Run:

```bash
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npx playwright test tests/e2e/phase-3-pilot-integrity.spec.ts --project=desktop-chrome -g "pilot safety"
```

Expected: PASS.

- [ ] **Step 7: Commit safety surfaces**

Run:

```bash
git add app/\(legal\)/legal/safety/page.tsx app/\(auth\)/login/page.tsx app/\(auth\)/register/page.tsx tests/e2e/phase-3-pilot-integrity.spec.ts
git commit -m "feat: add pilot safety boundaries"
```

Expected: one commit. Add any pilot-relevant route files that received safety notes.

## Task 7: Make Background-Style Processing Idempotent And Visible

**Files:**

- Modify: stale reconciliation service/handler if audit idempotency is missing.
- Modify: partner export/webhook service/handler if retry evidence is missing.
- Modify: `app/(workspace)/admin/data-ingestion/page.tsx`
- Modify: `app/(workspace)/admin/audit-evidence/page.tsx`
- Modify: docs for command-triggered processing.

- [ ] **Step 1: Audit existing processing paths**

Inspect current code paths for:

- `POST /v1/status/reconcile-staleness`
- Partner export generation.
- Webhook test/delivery evidence.
- Sync summary and report sync attempts.

Expected: list whether each path is idempotent, auditable, and visible in admin surfaces.

- [ ] **Step 2: Add tests only for gaps**

For each gap, add targeted tests before implementation.

Example stale reconciliation test shape:

```go
func TestReconcileStatusStalenessIsSafeToRerun(t *testing.T) {
    // Arrange a stale status that has already been marked stale.
    // Run reconciliation twice.
    // Assert the second run does not create duplicate state changes and returns zero updated records.
}
```

Example webhook test shape:

```go
func TestWebhookTestRecordsFailureEvidence(t *testing.T) {
    // Arrange a webhook test failure.
    // Assert partner_webhook_events records failed status and error summary without leaking secrets.
}
```

- [ ] **Step 3: Implement minimal idempotency/evidence fixes**

Only modify paths with failing tests.

Required behavior:

- Rerunning a reconciliation/export/webhook test does not create duplicate business state.
- Failure evidence is visible in admin data ingestion or audit evidence.
- Secret values are never exposed in failure evidence.

- [ ] **Step 4: Add admin visibility**

In admin data ingestion or audit evidence routes, include:

- Last stale reconciliation result.
- Latest export run status.
- Latest webhook test/delivery failures.
- Latest sync validation/duplicate/conflict counts.

- [ ] **Step 5: Verify targeted Go and frontend tests**

Run the exact tests for changed packages, for example:

```bash
cd services/api && go test ./internal/service ./internal/http
npm test -- lib/product/data-trust.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit processing visibility**

Run:

```bash
git add services/api app/\(demo\)/admin/data-ingestion/page.tsx app/\(demo\)/admin/audit-evidence/page.tsx docs/api.md docs/architecture.md docs/deployment.md
git commit -m "feat: expose pilot processing evidence"
```

Expected: one commit. Include only files actually changed.

## Task 8: Enforce Pilot-Critical Placeholder Removal

**Files:**

- Modify: remaining pilot-critical placeholder pages.
- Modify: `tests/e2e/phase-3-pilot-integrity.spec.ts`
- Modify: `lib/product/workspace-config.tsx` if hiding routes.

- [ ] **Step 1: Add E2E placeholder guard**

In `tests/e2e/phase-3-pilot-integrity.spec.ts`, add:

```ts
const pilotCriticalRoutes = [
  "/field",
  "/field/submit-report",
  "/field/sync-queue",
  "/district",
  "/admin/reporting-coverage",
  "/admin/audit-evidence",
  "/admin/data-ingestion",
  "/admin/security",
  "/admin/tenant-health",
  "/admin/partner-readiness",
];

test("pilot-critical routes do not show implementation placeholders", async ({ page }) => {
  await signInAs(page, "org_admin");

  for (const route of pilotCriticalRoutes.filter((route) => route.startsWith("/admin"))) {
    await page.goto(route);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
  }

  await signInAs(page, "reporter");
  for (const route of ["/field", "/field/submit-report", "/field/sync-queue"]) {
    await page.goto(route);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
  }

  await signInAs(page, "district_manager");
  await page.goto("/district");
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});
```

- [ ] **Step 2: Run placeholder guard**

Run:

```bash
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npx playwright test tests/e2e/phase-3-pilot-integrity.spec.ts --project=desktop-chrome -g "pilot-critical routes"
```

Expected: FAIL if any pilot-critical route still renders generic placeholder text.

- [ ] **Step 3: Complete or hide remaining placeholder routes**

For each failing route:

- Complete it with pilot-safe read-only content if data already exists.
- Hide it from navigation if it is not required for pilot.
- Replace generic placeholder with explicit roadmap/sandbox copy only for non-pilot demo routes.

Do not leave `Implementation placeholder` on pilot-critical routes.

- [ ] **Step 4: Verify placeholder guard passes**

Run:

```bash
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npx playwright test tests/e2e/phase-3-pilot-integrity.spec.ts --project=desktop-chrome -g "pilot-critical routes"
```

Expected: PASS.

- [ ] **Step 5: Commit placeholder cleanup**

Run:

```bash
git add app lib tests/e2e/phase-3-pilot-integrity.spec.ts
git commit -m "feat: remove pilot-critical placeholders"
```

Expected: one focused commit containing only placeholder completion/hiding work.

## Task 9: Update Docs, Release Gate, And Phase Status

**Files:**

- Modify: `docs/api.md`
- Modify: `docs/architecture.md`
- Modify: `docs/database-schema.md`
- Modify: `docs/deployment.md`
- Modify: `docs/release.md`
- Modify: `docs/production-readiness-execution-plan.md`
- Create: `docs/phase-3-pilot-data-product-integrity-closeout.md`

- [ ] **Step 1: Update API documentation**

In `docs/api.md`, document only changed endpoints and behavior:

```md
| `GET` | `/v1/sync/summary` | Returns sync health, duplicate/conflict/validation failure counts, stale clinic counts, and latest sync evidence |
| `POST` | `/v1/status/reconcile-staleness` | Idempotently reconciles stale status and records audit evidence |
```

If `GET /v1/admin/ingestion/runs` was added, include it.

- [ ] **Step 2: Update architecture documentation**

In `docs/architecture.md`, add a short `Pilot data trust` section:

```md
## Pilot Data Trust

Pilot-facing operational data carries source, freshness, review, confidence, and evidence context. Browser-local demo state is not treated as pilot source of truth. Field reports become authoritative after server receipt and district review. Stale reconciliation, sync failures, exports, and webhook attempts leave audit or admin evidence so users can distinguish reviewed current data from pending, stale, failed, or demo-seeded state.
```

- [ ] **Step 3: Update database documentation**

In `docs/database-schema.md`, document:

- Which existing tables provide provenance and review evidence.
- Any new `pilot_ingestion_runs` table if added.
- Which states are derived rather than persisted.

- [ ] **Step 4: Update deployment documentation**

In `docs/deployment.md`, add any manual pilot ingestion, reconciliation, export, or webhook evidence commands required for staging.

If no new commands exist, add:

```md
Phase 3 does not add a persistent background worker. Stale reconciliation, exports, webhook tests, and sync evidence remain API-triggered and auditable. Phase 4 will add production observability and scheduling decisions.
```

- [ ] **Step 5: Update release checklist**

In `docs/release.md`, add Phase 3 verification note:

```md
For Phase 3 pilot data handoff, also confirm pilot-critical routes have no implementation-placeholder copy, operational data exposes source/freshness/review state, and safety/privacy/terms links are reachable.
```

- [ ] **Step 6: Create closeout draft**

Create `docs/phase-3-pilot-data-product-integrity-closeout.md`:

```md
# Phase 3 Pilot Data And Product Integrity Closeout

Date: 2026-05-16
Status: Complete after verification

## Completed Outcomes

- Operational data exposes source, freshness, review state, confidence, and evidence context where pilot users act on it.
- Field sync visibility shows queued, synced, duplicate, conflict, validation failure, and failed states where supported by server evidence.
- Ingestion and background-style processing evidence is visible and auditable.
- Pilot-critical routes no longer expose generic implementation-placeholder copy.
- Privacy, terms, and safety boundaries are linked from relevant flows.

## Verification

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git status --short
```

## Residual Risk

- Phase 3 does not add a distributed background worker or production scheduler.
- Legal/privacy copy is a pilot boundary, not legal certification.
- Full observability, alerting, tracing, incident runbooks, and SLOs remain Phase 4.

## Next Phase

Phase 4 - Observability And Operations.
```

- [ ] **Step 7: Update readiness roadmap status after implementation passes**

In `docs/production-readiness-execution-plan.md`, after final verification:

- Set `Current phase: Phase 4 - Observability And Operations`.
- Set Phase 3 status to `Complete`.
- Add closeout link under Phase 3.

Do not mark Phase 3 complete before final verification passes.

- [ ] **Step 8: Commit docs**

Run:

```bash
git add docs/api.md docs/architecture.md docs/database-schema.md docs/deployment.md docs/release.md docs/production-readiness-execution-plan.md docs/phase-3-pilot-data-product-integrity-closeout.md
git commit -m "docs: close phase 3 pilot data integrity"
```

Expected: one docs commit after implementation and verification evidence are real.

## Task 10: Final Verification And PR

**Files:**

- All changed files.

- [ ] **Step 1: Run full frontend/backend verification**

Run:

```bash
npm ci
make verify
```

Expected: PASS.

- [ ] **Step 2: Run full E2E**

Run:

```bash
make test-e2e
```

Expected: PASS.

- [ ] **Step 3: Run security gates**

Run:

```bash
make verify-security
```

Expected: PASS.

- [ ] **Step 4: Run API container smoke**

Run:

```bash
make test-api-container
```

Expected: PASS.

- [ ] **Step 5: Confirm clean worktree**

Run:

```bash
git status --short
```

Expected: no uncommitted changes.

- [ ] **Step 6: Push and create PR**

Run:

```bash
git push -u origin feature/phase-3-pilot-data-product-integrity
gh pr create --base main --head feature/phase-3-pilot-data-product-integrity --title "Phase 3: Pilot data and product integrity" --body-file - <<'PR'
## Summary

- Adds pilot data trust labels for source, freshness, review state, confidence, and evidence.
- Improves field sync integrity visibility for queued, synced, duplicate, conflict, validation failure, and failed states.
- Removes or completes pilot-critical implementation placeholders.
- Adds pilot safety boundaries and updates readiness documentation.

## Verification

- [ ] `npm ci`
- [ ] `make verify`
- [ ] `make test-e2e`
- [ ] `make verify-security`
- [ ] `make test-api-container`
- [ ] `git status --short`
PR
```

Expected: PR opens against `main` with verification notes.

## Self-Review Checklist

Before implementation starts, confirm:

- Every spec requirement maps to a task above.
- New schema is optional and only used if existing evidence cannot satisfy the spec.
- No task requires a distributed worker, legal certification, or new role model.
- Pilot-critical placeholder policy is testable.
- Safety copy avoids clinical, emergency, or compliance overclaims.
- Final verification includes the standing production-readiness gates.
