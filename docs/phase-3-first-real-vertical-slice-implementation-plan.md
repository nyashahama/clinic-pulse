# Phase 3 First Real Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real ClinicPulse product handoff: reporter report submission, district review, accepted status update, audit evidence, and admin review context.

**Architecture:** Reuse the existing Go API/Postgres report and review endpoints. Add typed frontend API helpers, product review view models, authenticated server loaders/actions, and role-specific UI integration in `/field`, `/district`, and `/admin`. Keep `/demo` as showcase/sandbox and do not add new roles.

**Tech Stack:** Next.js App Router, React 19, TypeScript, server actions, Go chi API, Postgres, Vitest, Playwright.

---

## Existing Foundation

The backend already supports the core lifecycle:

- `POST /v1/reports` creates pending reports.
- `GET /v1/reports/pending` lists pending reports for district/admin scopes.
- `POST /v1/reports/{reportId}/review` accepts or rejects pending reports.
- Accepted reports update `current_status`.
- Rejected reports do not update `current_status`.
- Submission and review create audit events.

This plan should avoid backend schema changes unless a task exposes a concrete blocker.

## File Map

Create:

- `lib/product/report-review.ts`: product-neutral report review view models, summary helpers, and sorting.
- `lib/product/report-review.test.ts`: unit tests for review mapping and summaries.
- `components/product/report-review-queue.tsx`: reusable pending report queue UI.
- `components/product/report-review-summary.tsx`: compact review pressure/evidence summary for admin/district surfaces.
- `app/(demo)/report-review-actions.ts`: server action for accepting/rejecting pending reports.
- `tests/e2e/phase-3-report-review.spec.ts`: end-to-end role handoff test.
- `docs/phase-3-first-real-vertical-slice-implementation-review.md`: final review doc after implementation.

Modify:

- `lib/demo/api-types.ts`: add review request/response types and narrow review state type.
- `lib/demo/api-client.ts`: add `fetchPendingReports()` and `reviewReport()`.
- `lib/demo/api-client.test.ts`: verify pending/review API URLs and payloads.
- `lib/demo/server-hydration.ts`: add pending report loader for operational roles.
- `lib/demo/server-hydration.test.ts`: verify pending loader behavior and fallback.
- `app/(demo)/district/page.tsx`: load pending reports and pass them into the district client.
- `app/(demo)/demo/page.tsx`: pass `pendingReports={[]}` after the shared district/showcase client prop is added; do not load pending reports for `/demo`.
- `app/(demo)/demo/page-client.tsx`: render district review queue when pending reports are provided.
- `app/(demo)/admin/page.tsx`: load pending reports and pass them into admin client.
- `app/(demo)/admin/page-client.tsx`: render review/evidence summary and pending review backstop.
- `app/(demo)/field/page-client.tsx`: show post-submit pending review feedback and review-state-aware recent reports where available.
- `docs/api.md`: document `GET /v1/reports/pending` and `POST /v1/reports/{reportId}/review` request/response usage.

## Reference Context

- Product direction: `docs/product-roadmap.md`
- Role decision: `docs/product-role-model-decision.md`
- Phase 3 spec: `docs/phase-3-first-real-vertical-slice-spec.md`
- Shell baseline: `docs/phase-2-product-shell-design-system-spec.md`
- Local UI references: `reference-projects/shadcn-admin`, `reference-projects/openpanel`, `reference-projects/appwrite-console`

The local ClinicPulse docs own product decisions. Reference projects are used for queue density, admin evidence framing, empty states, and product-console ergonomics.

## Task 0: Prepare The Implementation Branch

**Files:**

- Read: `docs/phase-3-first-real-vertical-slice-spec.md`
- Read: `docs/product-role-model-decision.md`
- Read: `docs/product-roadmap.md`

- [ ] **Step 1: Create the Phase 3 branch**

Run:

```bash
git checkout -b feature/phase-3-first-real-vertical-slice
```

Expected: Git switches to `feature/phase-3-first-real-vertical-slice`.

- [ ] **Step 2: Confirm the working tree starts clean**

Run:

```bash
git status --short --branch
```

Expected: branch is `feature/phase-3-first-real-vertical-slice` and there are no unrelated product-code changes.

- [ ] **Step 3: Confirm the accepted role boundary**

Run:

```bash
rg -n "four active product roles|do not add every future persona|Phase 3" docs/product-role-model-decision.md docs/product-roadmap.md
```

Expected: output confirms Phase 3 keeps reporter, district manager, organisation admin, and system admin as the active authenticated roles.

## Task 1: Add Typed Frontend API Helpers

**Files:**

- Modify: `lib/demo/api-types.ts`
- Modify: `lib/demo/api-client.ts`
- Modify: `lib/demo/api-client.test.ts`

- [ ] **Step 1: Add failing API client tests**

Add tests to `lib/demo/api-client.test.ts`:

```ts
it("fetches pending reports from the review queue endpoint", async () => {
  const fetch = vi.fn(async () =>
    new Response(JSON.stringify([{ id: 42, clinicId: "clinic-1", reviewState: "pending" }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

  const reports = await fetchPendingReports({ baseUrl: "https://api.example.test", fetch });

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0]?.[0]).toBe("https://api.example.test/v1/reports/pending");
  expect(reports[0]?.id).toBe(42);
});

it("posts report review decisions to the report review endpoint", async () => {
  const fetch = vi.fn(async () =>
    new Response(
      JSON.stringify({
        report: { id: 42, clinicId: "clinic-1", reviewState: "accepted" },
        currentStatus: { clinicId: "clinic-1", status: "degraded", freshness: "fresh", updatedAt: "2026-05-11T00:00:00.000Z" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );

  const result = await reviewReport(
    42,
    { decision: "accepted", notes: "District verified" },
    { baseUrl: "https://api.example.test", fetch },
  );

  expect(fetch.mock.calls[0]?.[0]).toBe("https://api.example.test/v1/reports/42/review");
  expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
  expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
    decision: "accepted",
    notes: "District verified",
  });
  expect(result.report.reviewState).toBe("accepted");
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm test -- lib/demo/api-client.test.ts
```

Expected: FAIL because `fetchPendingReports` and `reviewReport` are not exported.

- [ ] **Step 3: Add API types**

In `lib/demo/api-types.ts`, add:

```ts
export type ReportReviewState = "pending" | "accepted" | "rejected";

export type ReviewReportApiInput = {
  decision: "accepted" | "rejected";
  notes?: string;
};

export type ReviewReportApiResponse = {
  report: ReportApiResponse;
  currentStatus?: CurrentStatusApiResponse;
};
```

Update `ReportApiResponse.reviewState` from `string` to `ReportReviewState | string` if a fully strict migration is too wide for this task.

- [ ] **Step 4: Add API client helpers**

In `lib/demo/api-client.ts`, import the new types and add:

```ts
export function fetchPendingReports(options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<ReportApiResponse[]>(["v1", "reports", "pending"], options);
}

export function reviewReport(
  reportId: number | string,
  input: ReviewReportApiInput,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<ReviewReportApiResponse>(
    ["v1", "reports", String(reportId), "review"],
    options,
    {
      body: JSON.stringify(input),
      method: "POST",
    },
  );
}
```

- [ ] **Step 5: Verify API client tests pass**

Run:

```bash
npm test -- lib/demo/api-client.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/demo/api-types.ts lib/demo/api-client.ts lib/demo/api-client.test.ts
git commit -m "feat: add report review api client helpers"
```

## Task 2: Add Product Review View Models

**Files:**

- Create: `lib/product/report-review.ts`
- Create: `lib/product/report-review.test.ts`

- [ ] **Step 1: Write failing view-model tests**

Create `lib/product/report-review.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  buildPendingReportReviews,
  summarizePendingReportReviews,
} from "@/lib/product/report-review";
import type { ClinicRow } from "@/lib/demo/types";
import type { ReportApiResponse } from "@/lib/demo/api-types";

const clinic = {
  id: "clinic-1",
  name: "Mamelodi East Community Clinic",
  facilityCode: "GTP-001",
  province: "Gauteng",
  district: "Tshwane North",
  latitude: 0,
  longitude: 0,
  services: ["HIV", "TB"],
  operatingHours: "08:00-16:00",
  imageKey: "clinic-front-01",
  image: {
    src: "/placeholder.jpg",
    alt: "Clinic",
    caption: "Clinic",
    credit: "ClinicPulse",
  },
  clinicId: "clinic-1",
  status: "operational",
  reason: "Open",
  freshness: "fresh",
  lastReportedAt: "2026-05-11T08:00:00.000Z",
  reporterName: "Seed",
  source: "seed",
  staffPressure: "normal",
  stockPressure: "normal",
  queuePressure: "low",
} satisfies ClinicRow;

const report = {
  id: 42,
  clinicId: "clinic-1",
  source: "field_worker",
  offlineCreated: false,
  submittedAt: "2026-05-11T09:00:00.000Z",
  receivedAt: "2026-05-11T09:01:00.000Z",
  status: "degraded",
  reason: "Stock is low",
  staffPressure: "strained",
  stockPressure: "low",
  queuePressure: "moderate",
  reviewState: "pending",
  reporterName: "Reporter One",
} satisfies ReportApiResponse;

describe("report review view models", () => {
  it("joins pending reports to clinic display context", () => {
    const reviews = buildPendingReportReviews([report], [clinic]);

    expect(reviews).toEqual([
      expect.objectContaining({
        reportId: 42,
        clinicName: "Mamelodi East Community Clinic",
        facilityCode: "GTP-001",
        status: "degraded",
        reviewState: "pending",
      }),
    ]);
  });

  it("summarizes pending report pressure", () => {
    expect(summarizePendingReportReviews(buildPendingReportReviews([report], [clinic]))).toEqual({
      pending: 1,
      offline: 0,
      criticalSignals: 0,
      oldestReceivedAt: "2026-05-11T09:01:00.000Z",
    });
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm test -- lib/product/report-review.test.ts
```

Expected: FAIL because `lib/product/report-review.ts` does not exist.

- [ ] **Step 3: Implement the view model**

Create `lib/product/report-review.ts`:

```ts
import type { ReportApiResponse } from "@/lib/demo/api-types";
import type {
  ClinicRow,
  ClinicStatus,
  QueuePressure,
  StaffPressure,
  StockPressure,
} from "@/lib/demo/types";

export type PendingReportReview = {
  reportId: number;
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  district: string;
  reporterName: string;
  source: string;
  offlineCreated: boolean;
  submittedAt: string;
  receivedAt: string;
  status: ClinicStatus | string;
  reason: string;
  staffPressure: StaffPressure | string;
  stockPressure: StockPressure | string;
  queuePressure: QueuePressure | string;
  notes: string;
  reviewState: string;
};

export type PendingReportReviewSummary = {
  pending: number;
  offline: number;
  criticalSignals: number;
  oldestReceivedAt: string | null;
};

function fallbackText(value: string | null | undefined, fallback = "") {
  return value ?? fallback;
}

function isCriticalSignal(report: ReportApiResponse) {
  return (
    report.status === "non_functional" ||
    report.staffPressure === "critical" ||
    report.stockPressure === "stockout" ||
    report.queuePressure === "high"
  );
}

export function buildPendingReportReviews(
  reports: ReportApiResponse[],
  clinics: ClinicRow[],
): PendingReportReview[] {
  const clinicsById = new Map(clinics.map((clinic) => [clinic.id, clinic]));

  return reports
    .filter((report) => report.reviewState === "pending")
    .map((report) => {
      const clinic = clinicsById.get(report.clinicId);

      return {
        reportId: report.id,
        clinicId: report.clinicId,
        clinicName: clinic?.name ?? report.clinicId,
        facilityCode: clinic?.facilityCode ?? "Unknown facility",
        district: clinic?.district ?? "Unknown district",
        reporterName: fallbackText(report.reporterName, "ClinicPulse reporter"),
        source: report.source,
        offlineCreated: report.offlineCreated,
        submittedAt: report.submittedAt,
        receivedAt: report.receivedAt,
        status: report.status,
        reason: fallbackText(report.reason, "No reason supplied."),
        staffPressure: fallbackText(report.staffPressure, "unknown"),
        stockPressure: fallbackText(report.stockPressure, "unknown"),
        queuePressure: fallbackText(report.queuePressure, "unknown"),
        notes: fallbackText(report.notes),
        reviewState: report.reviewState,
      };
    })
    .sort((left, right) => Date.parse(right.receivedAt) - Date.parse(left.receivedAt));
}

export function summarizePendingReportReviews(
  reviews: PendingReportReview[],
): PendingReportReviewSummary {
  const oldestReceivedAt = reviews
    .map((review) => review.receivedAt)
    .sort((left, right) => Date.parse(left) - Date.parse(right))[0] ?? null;

  return {
    pending: reviews.length,
    offline: reviews.filter((review) => review.offlineCreated).length,
    criticalSignals: reviews.filter((review) =>
      review.status === "non_functional" ||
      review.staffPressure === "critical" ||
      review.stockPressure === "stockout" ||
      review.queuePressure === "high",
    ).length,
    oldestReceivedAt,
  };
}
```

- [ ] **Step 4: Verify tests pass**

Run:

```bash
npm test -- lib/product/report-review.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product/report-review.ts lib/product/report-review.test.ts
git commit -m "feat: add product report review models"
```

## Task 3: Load Pending Reports And Add Review Server Action

**Files:**

- Modify: `lib/demo/server-hydration.ts`
- Modify: `lib/demo/server-hydration.test.ts`
- Create: `app/(demo)/report-review-actions.ts`

- [ ] **Step 1: Add failing server hydration tests**

In `lib/demo/server-hydration.test.ts`, add coverage that:

```ts
it("does not load pending reports for reporters", async () => {
  await expect(loadPendingReportsForRole("reporter")).resolves.toEqual([]);
});

it("loads pending reports for district and admin roles", async () => {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    expect(String(input)).toContain("/v1/reports/pending");
    return new Response(JSON.stringify([{ id: 42, clinicId: "clinic-1", reviewState: "pending" }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  await expect(
    loadPendingReportsForRole("district_manager", {
      baseUrl: "https://api.example.test",
      fetch,
    }),
  ).resolves.toEqual([expect.objectContaining({ id: 42 })]);
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm test -- lib/demo/server-hydration.test.ts
```

Expected: FAIL because `loadPendingReportsForRole` is not exported.

- [ ] **Step 3: Implement pending report loader**

In `lib/demo/server-hydration.ts`, import `fetchPendingReports` and `ReportApiResponse`, then add:

```ts
export async function loadPendingReportsForRole(
  role: AuthRole,
  options?: ClinicPulseApiClientOptions,
): Promise<ReportApiResponse[]> {
  if (role === "reporter") {
    return [];
  }

  return withSeededFallback(
    () => fetchPendingReports(options),
    () => [],
  );
}
```

- [ ] **Step 4: Add review server action**

Create `app/(demo)/report-review-actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import {
  AuthenticationRequiredError,
  getCurrentSession,
  getSessionCookieHeader,
  requireRole,
} from "@/lib/auth/session";
import type { ReviewReportApiInput } from "@/lib/demo/api-types";
import { reviewReport } from "@/lib/demo/api-client";

const REVIEW_ROLES = ["district_manager", "org_admin", "system_admin"] as const;

export type ReviewPendingReportActionInput = {
  reportId: number;
  decision: ReviewReportApiInput["decision"];
  notes?: string;
};

export async function reviewPendingReportAction(input: ReviewPendingReportActionInput) {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    throw new AuthenticationRequiredError();
  }

  requireRole(await getCurrentSession({ cookieHeader }), REVIEW_ROLES);

  const result = await reviewReport(
    input.reportId,
    {
      decision: input.decision,
      notes: input.notes,
    },
    {
      init: {
        headers: {
          cookie: cookieHeader,
        },
      },
    },
  );

  revalidatePath("/district");
  revalidatePath("/admin");
  revalidatePath(`/district/clinics/${encodeURIComponent(result.report.clinicId)}`);
  revalidatePath("/finder");

  return result;
}
```

- [ ] **Step 5: Verify tests pass**

Run:

```bash
npm test -- lib/demo/server-hydration.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/demo/server-hydration.ts lib/demo/server-hydration.test.ts app/'(demo)'/report-review-actions.ts
git commit -m "feat: load pending report reviews"
```

## Task 4: Build Product Review Queue Components

**Files:**

- Create: `components/product/report-review-summary.tsx`
- Create: `components/product/report-review-queue.tsx`
- Modify: `lib/product/surface-primitives.test.ts`
- Verify: `lib/product/product-boundary.test.ts`

- [ ] **Step 1: Add rendering tests**

In `lib/product/surface-primitives.test.ts`, add static markup tests that render:

```ts
import { ReportReviewSummary } from "@/components/product/report-review-summary";
import { ReportReviewQueueView } from "@/components/product/report-review-queue";
```

Test expectations:

- summary includes pending count, offline count, critical count,
- queue empty state includes "No pending reports",
- queue item includes clinic name, reason, and accept/reject controls.

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- lib/product/surface-primitives.test.ts lib/product/product-boundary.test.ts
```

Expected: FAIL because the new components do not exist.

- [ ] **Step 3: Implement `ReportReviewSummary`**

Create `components/product/report-review-summary.tsx` using only product-safe imports:

```tsx
import { ProductPanel } from "@/components/product/panel";
import type { PendingReportReviewSummary } from "@/lib/product/report-review";

type ReportReviewSummaryProps = {
  summary: PendingReportReviewSummary;
  title?: string;
  description?: string;
};

export function ReportReviewSummary({
  summary,
  title = "Report review pressure",
  description = "Pending field reports waiting for operational review.",
}: ReportReviewSummaryProps) {
  const metrics = [
    { label: "Pending", value: summary.pending },
    { label: "Offline", value: summary.offline },
    { label: "Critical", value: summary.criticalSignals },
  ];

  return (
    <ProductPanel title={title} description={description}>
      <dl className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
              {metric.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-content-emphasis">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </ProductPanel>
  );
}
```

- [ ] **Step 4: Implement `ReportReviewQueueView` and `ReportReviewQueue`**

Create `components/product/report-review-queue.tsx` as a client component with two exports:

- `ReportReviewQueueView`: pure render/action view used by unit tests.
- `ReportReviewQueue`: small wrapper that calls `useRouter()` and refreshes after successful review.

`ReportReviewQueueView` accepts:

```ts
type ReportReviewQueueProps = {
  items: PendingReportReview[];
  onReview: (input: { reportId: number; decision: "accepted" | "rejected"; notes?: string }) => Promise<unknown>;
  onReviewed?: () => void;
  title?: string;
  description?: string;
};
```

Behavior:

- Empty state uses `SurfaceState`.
- Each item shows clinic, facility code, status, reason, pressures, reporter/source, received time.
- Each item has "Accept" and "Reject" buttons.
- Use a per-report pending state so one review action does not disable the whole page forever.
- On success, call `onReviewed?.()`.
- `ReportReviewQueue` passes `router.refresh` as `onReviewed`.
- On error, show a compact alert message inside the queue.
- Add stable selectors for the E2E handoff:
  - `data-testid="report-review-queue"`
  - `data-testid="report-review-item"`
  - `data-testid="accept-report-review"`
  - `data-testid="reject-report-review"`

- [ ] **Step 5: Verify product tests pass**

Run:

```bash
npm test -- lib/product/surface-primitives.test.ts lib/product/product-boundary.test.ts
```

Expected: PASS and no product import boundary violations.

- [ ] **Step 6: Commit**

```bash
git add components/product/report-review-summary.tsx components/product/report-review-queue.tsx lib/product/surface-primitives.test.ts lib/product/product-boundary.test.ts
git commit -m "feat: add product report review components"
```

## Task 5: Wire District Review Queue

**Files:**

- Modify: `app/(demo)/district/page.tsx`
- Modify: `app/(demo)/demo/page.tsx`
- Modify: `app/(demo)/demo/page-client.tsx`
- Modify: `tests/e2e/role-dashboard-navigation.spec.ts`

- [ ] **Step 1: Add failing unit or E2E expectation**

Add this district landmark to `tests/e2e/role-dashboard-navigation.spec.ts`:

```ts
"report-review"
```

in the district manager `landmarks` list.

- [ ] **Step 2: Run failing navigation E2E list or targeted test**

Run:

```bash
npm run test:e2e -- tests/e2e/role-dashboard-navigation.spec.ts --project=desktop-chrome
```

Expected: FAIL because `#report-review` is not visible yet.

- [ ] **Step 3: Load pending reports in district page**

In `app/(demo)/district/page.tsx`, load:

```ts
const [syncSummary, pendingReports] = await Promise.all([
  loadSyncSummaryForRole(workflowSession.role, apiOptions),
  loadPendingReportsForRole(workflowSession.role, apiOptions),
]);
```

Pass `pendingReports` into `DistrictConsolePageClient`.

- [ ] **Step 4: Keep the showcase route non-canonical**

In `app/(demo)/demo/page.tsx`, pass an explicit empty pending report list:

```tsx
<DistrictConsolePageClient
  consoleHref="/demo"
  pendingReports={[]}
  session={workflowSession}
  syncSummary={syncSummary}
/>
```

Expected: `/demo` continues to render as showcase/sandbox and does not load pending product review data.

- [ ] **Step 5: Render review queue in district client**

In `app/(demo)/demo/page-client.tsx`:

- add prop `pendingReports?: ReportApiResponse[]`,
- build review items with `buildPendingReportReviews(pendingReports ?? [], clinicRows)`,
- render `ReportReviewSummary` and `ReportReviewQueue` inside `<div id="report-review">`,
- pass `reviewPendingReportAction` as `onReview`,
- place the section near `VerificationHandover` so it reads as part of district command flow.

- [ ] **Step 6: Verify district navigation test passes**

Run:

```bash
npm run test:e2e -- tests/e2e/role-dashboard-navigation.spec.ts --project=desktop-chrome
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/'(demo)'/district/page.tsx app/'(demo)'/demo/page.tsx app/'(demo)'/demo/page-client.tsx tests/e2e/role-dashboard-navigation.spec.ts
git commit -m "feat: show pending report review in district workspace"
```

## Task 6: Wire Admin Review Evidence Context

**Files:**

- Modify: `app/(demo)/admin/page.tsx`
- Modify: `app/(demo)/admin/page-client.tsx`
- Modify: `tests/e2e/role-dashboard-navigation.spec.ts`

- [ ] **Step 1: Add admin pending report props**

In `app/(demo)/admin/page.tsx`, load `pendingReports` with `loadPendingReportsForRole(session.role, apiOptions)` and pass them to `AdminPageClient`.

- [ ] **Step 2: Build admin review summary**

In `app/(demo)/admin/page-client.tsx`:

- add `pendingReports: ReportApiResponse[]` to props,
- compute `pendingReportReviews` from `buildPendingReportReviews(pendingReports, clinics)`,
- include `pendingReportReviews.length` in the existing review lane and readiness copy,
- render `ReportReviewSummary` in the organisation/system review lane,
- render `ReportReviewQueue` as a backstop review section if there are pending reports.

- [ ] **Step 3: Keep admin framing distinct**

Use copy like:

- org admin: "Governance review pressure"
- system admin: "Ingestion review pressure"

Do not duplicate the district page title/copy.

- [ ] **Step 4: Add the admin landmark contract**

In `tests/e2e/role-dashboard-navigation.spec.ts`, add the new admin landmark:

```ts
"admin-review-pressure"
```

Add `id="admin-review-pressure"` to the admin review summary section in `app/(demo)/admin/page-client.tsx`.

- [ ] **Step 5: Verify role dashboard tests**

Run:

```bash
npm run test:e2e -- tests/e2e/role-dashboard-navigation.spec.ts --project=desktop-chrome
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/'(demo)'/admin/page.tsx app/'(demo)'/admin/page-client.tsx tests/e2e/role-dashboard-navigation.spec.ts
git commit -m "feat: show report review evidence in admin workspace"
```

## Task 7: Improve Reporter Submission Feedback

**Files:**

- Modify: `app/(demo)/field/page-client.tsx`

- [ ] **Step 1: Add reporter feedback state**

In `app/(demo)/field/page-client.tsx`, add state:

```ts
const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
```

Clear it before submission and set it after successful online submission:

```ts
setSubmitSuccess("Report submitted and waiting for district review.");
```

- [ ] **Step 2: Render success feedback near submit error**

Render a compact success message below `ReportForm`:

```tsx
{submitSuccess ? (
  <p className="xl:col-start-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
    {submitSuccess}
  </p>
) : null}
```

- [ ] **Step 3: Update recent reports copy**

Change the recent reports description to clarify that backend-backed reports may be pending review:

```tsx
description="The newest reports submitted into the operational record. Pending reports wait for district review before changing current status."
```

- [ ] **Step 4: Run field-related tests**

Run:

```bash
npm test -- lib/demo/field-report.test.ts lib/demo/offline-sync.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/'(demo)'/field/page-client.tsx
git commit -m "feat: clarify pending review after field submission"
```

## Task 8: Add Phase 3 E2E Handoff Test

**Files:**

- Create: `tests/e2e/phase-3-report-review.spec.ts`

- [ ] **Step 1: Write E2E test**

Create a test that:

1. logs in as reporter,
2. goes to `/field`,
3. submits a degraded or non-functional report,
4. logs out,
5. logs in as district manager,
6. verifies the pending report queue appears on `/district`,
7. accepts the pending report,
8. verifies the report leaves the pending queue,
9. logs out,
10. logs in as org admin,
11. verifies admin review/evidence context is visible.

Use durable selectors and accessible text from the components. Avoid relying on generated report IDs.

- [ ] **Step 2: Run the Phase 3 E2E test**

Run:

```bash
CLINICPULSE_E2E_API_PORT=18131 CLINICPULSE_E2E_WEB_PORT=13131 npm run test:e2e -- tests/e2e/phase-3-report-review.spec.ts --project=desktop-chrome
```

Expected after Tasks 5-7 are complete: PASS.

- [ ] **Step 3: Verify selectors are scoped to the new review components**

Confirm the E2E selectors are limited to:

- `data-testid="report-review-queue"`
- `data-testid="report-review-item"`
- `data-testid="accept-report-review"`
- `data-testid="reject-report-review"`

Do not add broad test IDs to existing unrelated surfaces.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/phase-3-report-review.spec.ts components/product/report-review-queue.tsx
git commit -m "test: cover phase 3 report review handoff"
```

## Task 9: Final Verification And Review Doc

**Files:**

- Modify: `docs/api.md`
- Create: `docs/phase-3-first-real-vertical-slice-implementation-review.md`

- [ ] **Step 1: Update API documentation**

Add an authenticated report review section to `docs/api.md`:

````md
## Authenticated Report Review

`GET /v1/reports/pending`

- Roles: district manager, organisation admin, system admin.
- Returns pending reports scoped to the authenticated actor.
- Used by `/district` for primary operational review and `/admin` for governance/backstop evidence.

`POST /v1/reports/{reportId}/review`

Request:

```json
{
  "decision": "accepted",
  "notes": "District verified the field report."
}
```

Response:

```json
{
  "report": {
    "id": 42,
    "clinicId": "clinic-mamelodi-east",
    "reviewState": "accepted"
  },
  "currentStatus": {
    "clinicId": "clinic-mamelodi-east",
    "status": "degraded"
  }
}
```

Accepted reports update `current_status`. Rejected reports remain audit-visible and do not update `current_status`.
````

- [ ] **Step 2: Run unit tests**

Run:

```bash
npm test
```

Expected: all Vitest files pass.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: build completes successfully.

- [ ] **Step 5: Run Go tests**

Run:

```bash
cd services/api && go test ./...
```

Expected: all Go packages pass.

- [ ] **Step 6: Run targeted E2E tests**

Run:

```bash
CLINICPULSE_E2E_API_PORT=18131 CLINICPULSE_E2E_WEB_PORT=13131 npm run test:e2e -- tests/e2e/phase-3-report-review.spec.ts --project=desktop-chrome
CLINICPULSE_E2E_API_PORT=18132 CLINICPULSE_E2E_WEB_PORT=13132 npm run test:e2e -- tests/e2e/role-dashboard-navigation.spec.ts --project=desktop-chrome
```

Expected: both suites pass.

- [ ] **Step 7: Write implementation review**

Create `docs/phase-3-first-real-vertical-slice-implementation-review.md` with:

```md
# Phase 3 First Real Vertical Slice Implementation Review

Date: 2026-05-11
Branch: feature/phase-3-first-real-vertical-slice

## Scope Delivered

- Reporter report submission persists as pending.
- District review queue accepts/rejects pending reports.
- Accepted reports update current status.
- Admin workspace shows review/evidence context.
- `/demo` remains showcase/sandbox.

## Verification

- `npm test`
- `npm run lint`
- `npm run build`
- `cd services/api && go test ./...`
- `npm run test:e2e -- tests/e2e/phase-3-report-review.spec.ts --project=desktop-chrome`
- `npm run test:e2e -- tests/e2e/role-dashboard-navigation.spec.ts --project=desktop-chrome`

## Deferred Work

- Clinic coordinator confirmation workflow.
- Partner/API portal.
- Bulk review actions.
- SLA timers and assignment.
- Alert generation from accepted reports.
```

Record each verification command with its final result before committing the review document.

- [ ] **Step 8: Commit final docs**

```bash
git add docs/api.md docs/phase-3-first-real-vertical-slice-implementation-review.md
git commit -m "docs: record phase 3 implementation review"
```

## Self-Review Checklist

- Phase 3 does not add new authenticated roles.
- `/demo` remains available as showcase/sandbox.
- Product components do not import demo modules.
- Reporter flow remains form-first.
- District manager owns primary operational review.
- Admin surfaces evidence/governance context rather than duplicating the district command center.
- Accepted reports update current status.
- Rejected reports do not update current status.
- E2E proves the role handoff.
