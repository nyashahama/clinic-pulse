import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MetricTile } from "@/components/product/metric-tile";
import { ProductPanel } from "@/components/product/panel";
import { ReportStream } from "@/components/demo/report-stream";
import {
  ReportReviewQueueView,
  ReportReviewQueueErrorAlert,
  composeReportReviewCallbacks,
  deriveReviewedReportIdsForItems,
  getVisibleReportReviewItems,
  markReportReviewSucceeded,
  pruneReviewedReportIds,
  reconcileReviewedReportStateForItems,
  runReportReviewQueueAction,
} from "@/components/product/report-review-queue";
import { ReportReviewSummary } from "@/components/product/report-review-summary";
import { ProductResponsiveTable } from "@/components/product/responsive-table";
import { SurfaceState } from "@/components/product/surface-state";
import {
  AdminEvidenceTable,
  AdminFilterBar,
  AdminModuleHeader,
  AdminStatusBadge,
  getAdminToneClassName,
} from "@/components/product/admin-module";
import {
  AdminDetailActionPanel,
  AdminDetailEvidenceList,
  AdminDetailHero,
  AdminDetailSignalBar,
  AdminDetailStatStrip,
  AdminDetailTimeline,
  getAdminDetailPressureTone,
} from "@/components/product/admin-detail";
import {
  EvidenceCaseBriefPanel,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidencePacketPanel,
} from "@/components/product/evidence-command";
import {
  WorkspaceClinicDetailLoading,
  WorkspaceDashboardLoading,
} from "@/components/product/workspace-loading";
import {
  clinicOperatingStatuses,
  getClinicStatusCopy,
  normalizeClinicStatus,
} from "@/lib/product/clinic-status";
import { formatEvidenceSource } from "@/lib/product/evidence-command";
import type { PendingReportReview } from "@/lib/product/report-review";

describe("product surface primitives", () => {
  it("renders panel title, description, metadata, and content", () => {
    const html = renderToStaticMarkup(
      createElement(
        ProductPanel,
        {
          title: "Reporting coverage",
          description: "District submission health",
          metadata: "Updated now",
        },
        createElement("p", null, "Coverage rows"),
      ),
    );

    expect(html).toContain("Reporting coverage");
    expect(html).toContain("District submission health");
    expect(html).toContain("Updated now");
    expect(html).toContain("Coverage rows");
  });

  it("renders error state with alert semantics", () => {
    const html = renderToStaticMarkup(
      createElement(SurfaceState, {
        variant: "error",
        title: "Clinic table unavailable",
        description: "Retry before reviewing escalations.",
      }),
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Clinic table unavailable");
    expect(html).toContain("Retry before reviewing escalations.");
  });

  it("renders responsive table with an accessible label", () => {
    const html = renderToStaticMarkup(
      createElement(
        ProductResponsiveTable,
        { label: "Clinic operating table" },
        createElement(
          "table",
          null,
          createElement(
            "tbody",
            null,
            createElement(
              "tr",
              null,
              createElement("td", null, "Mamelodi East"),
            ),
          ),
        ),
      ),
    );

    expect(html).toContain('aria-label="Clinic operating table"');
    expect(html).toContain("Mamelodi East");
  });

  it("renders admin evidence tables with subtle product borders", () => {
    const html = renderToStaticMarkup(
      createElement(AdminEvidenceTable, {
        label: "Ingestion signal evidence",
        rows: [{ id: "offline", signal: "Offline queue", value: "0" }],
        getRowKey: (row: { id: string }) => row.id,
        columns: [
          {
            key: "signal",
            header: "Signal",
            render: (row: { signal: string }) => row.signal,
          },
          {
            key: "value",
            header: "Count",
            render: (row: { value: string }) => row.value,
          },
        ],
      }),
    );

    expect(html).toContain("border-border-subtle");
    expect(html).toContain("bg-bg-default");
    expect(html).toContain("bg-bg-muted/60");
    expect(html).toContain("divide-border-subtle");
    expect(html).not.toContain('class="overflow-hidden rounded-lg border bg-card');
  });

  it("renders admin module chrome with subtle product borders", () => {
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(AdminModuleHeader, {
          eyebrow: "Platform operations",
          title: "Ingestion pressure",
          description: "Read-only review of sync freshness.",
        }),
        createElement(AdminFilterBar, null, createElement("span", null, "Read only evidence")),
      ),
    );

    expect(html).toContain("border-border-subtle");
    expect(html).toContain("bg-bg-default");
    expect(html).not.toContain('class="rounded-lg border bg-card');
    expect(html).not.toContain('class="flex flex-col gap-2 rounded-lg border bg-card');
  });

  it("renders admin status badges from the shared admin tone primitive", () => {
    const html = renderToStaticMarkup(
      createElement(AdminStatusBadge, { tone: "attention" }, "Needs review"),
    );

    expect(html).toContain("Needs review");
    expect(html).toContain("rounded-md");
    expect(html).toContain("bg-amber-50");
  });

  it("renders operational detail pages with hero, actions, metrics, and timeline primitives", () => {
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(AdminDetailHero, {
          eyebrow: "Field evidence",
          title: "Mamelodi East Clinic report",
          description: "Power outage closed the triage room.",
          status: createElement(AdminStatusBadge, { tone: "attention" }, "Needs review"),
          actions: createElement("a", { href: "/admin/reports/42" }, "Open detail"),
        }),
        createElement(AdminDetailStatStrip, {
          stats: [
            {
              label: "Status",
              value: "Degraded",
              detail: "Clinic needs confirmation",
              tone: "attention",
            },
            {
              label: "Queue pressure",
              value: "High",
              detail: "Patient routing risk",
              tone: "blocked",
            },
          ],
        }),
        createElement(
          AdminDetailActionPanel,
          {
            title: "Next action",
            description: "Review the linked clinic and return to the queue.",
          },
          createElement("a", { href: "/district/clinics/clinic-mamelodi-east" }, "Open clinic"),
        ),
        createElement(AdminDetailTimeline, {
          title: "Evidence timeline",
          items: [
            {
              label: "Submitted",
              title: "Field report received",
              description: "Submitted by Sipho Nkosi",
              timestamp: "May 10, 10:30",
            },
          ],
        }),
      ),
    );

    expect(html).toContain("Mamelodi East Clinic report");
    expect(html).toContain("Power outage closed the triage room.");
    expect(html).toContain("Next action");
    expect(html).toContain("Evidence timeline");
    expect(html).toContain("Queue pressure");
    expect(html).toContain("border-l");
  });

  it("renders case-file detail pages with command-center signals and property-list evidence", () => {
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(AdminDetailSignalBar, {
          signals: [
            {
              label: "Review state",
              value: "Pending",
              detail: "Report #42",
              tone: "attention",
            },
            {
              label: "Queue pressure",
              value: "Unknown",
              detail: "Patient routing impact",
              tone: "neutral",
            },
          ],
        }),
        createElement(AdminDetailEvidenceList, {
          title: "Evidence properties",
          description: "Operational facts captured with the field report.",
          items: [
            {
              label: "Clinic",
              value: "Mamelodi East Clinic",
            },
            {
              label: "Reason",
              value: "Power outage closed the triage room.",
              emphasis: true,
            },
          ],
        }),
      ),
    );

    expect(html).toContain("Evidence properties");
    expect(html).toContain("Operational facts captured with the field report.");
    expect(html).toContain("Review state");
    expect(html).toContain("Queue pressure");
    expect(html).toContain("Mamelodi East Clinic");
    expect(html).toContain("Power outage closed the triage room.");
    expect(html).toContain("data-admin-detail-signal");
    expect(html).toContain("xl:grid-cols-4");
    expect(html).toContain("divide-y");
  });

  it("renders evidence command briefs with differentiated primary and secondary actions", () => {
    const actions = [
      {
        label: "Open clinic detail",
        href: "/district/clinics/clinic-mamelodi-east",
        priority: "primary" as const,
        icon: "clinic" as const,
      },
      {
        label: "Return to queue",
        href: "/admin#admin-review-pressure",
        priority: "secondary" as const,
        icon: "queue" as const,
      },
    ];
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(EvidenceCommandHeader, {
          eyebrow: "Field evidence",
          title: "Report evidence brief",
          description: "Power outage closed the triage room.",
          actions: [actions[1]],
        }),
        createElement(EvidenceCommandMetricStrip, {
          metrics: [
            {
              label: "Queue pressure",
              value: "high",
              detail: "Patient routing impact",
              tone: "critical",
              icon: "alert",
            },
          ],
        }),
        createElement(EvidencePacketPanel, {
          title: "Evidence packet",
          description: "Operational facts captured with the report.",
          fields: [
            {
              label: "Clinic",
              value: "Mamelodi East Clinic",
              href: "/district/clinics/clinic-mamelodi-east",
            },
            {
              label: "Status",
              value: "degraded",
              tone: "attention",
            },
          ],
        }),
        createElement(EvidenceDecisionPanel, {
          decision: {
            contextLabel: "Signal response",
            title: "Capacity risk decision",
            chips: [{ label: "degraded", tone: "attention" }],
            nextStep: "Review the clinic context before accepting the field evidence.",
            nextStepTone: "attention",
            impactTitle: "Patient impact",
            impact: "Queues may require rerouting.",
            actions,
          },
        }),
      ),
    );

    expect(html).toContain("Report evidence brief");
    expect(html).toContain("Evidence packet");
    expect(html).toContain("Signal response");
    expect(html).toContain("Capacity risk decision");
    expect(html).toContain("Open clinic detail");
    expect(html).toContain("Return to queue");
    expect(html).toContain("group/button");
    expect(html).toContain("bg-primary");
    expect(html).toContain("bg-bg-muted/60");
  });

  it("keeps five evidence command metrics on one wide row", () => {
    const html = renderToStaticMarkup(
      createElement(EvidenceCommandMetricStrip, {
        metrics: [
          {
            label: "Advisor findings",
            value: "2",
            detail: "Rows needing security review",
            tone: "attention",
          },
          {
            label: "Credential exposure",
            value: "1",
            detail: "0 revoked",
            tone: "stable",
          },
          {
            label: "Webhook delivery",
            value: "0",
            detail: "2 records",
            tone: "stable",
          },
          {
            label: "Privileged access",
            value: "2",
            detail: "Administrator roles",
            tone: "attention",
          },
          {
            label: "Access audit trail",
            value: "100",
            detail: "Audit events",
            tone: "info",
          },
        ],
      }),
    );

    expect(html).toContain("xl:grid-cols-5");
    expect(html).not.toContain("xl:grid-cols-4");
  });

  it("renders evidence case briefs as grouped operational summaries", () => {
    const html = renderToStaticMarkup(
      createElement(EvidenceCaseBriefPanel, {
        title: "Case brief",
        description: "Decision-ready evidence without the raw record table.",
        summary: {
          label: "Signal summary",
          value: "Power outage closed the triage room.",
          emphasis: true,
        },
        primaryFields: [
          {
            label: "Clinic",
            value: "Mamelodi East Clinic",
            href: "/district/clinics/clinic-mamelodi-east",
            emphasis: true,
          },
          {
            label: "Facility",
            value: "GP-TND-001",
          },
        ],
        sections: [
          {
            title: "Operational pressure",
            fields: [
              {
                label: "Queue",
                value: "high",
                tone: "critical",
              },
              {
                label: "Staff",
                value: "strained",
                tone: "attention",
              },
              {
                label: "Notes",
                value: "Generator handover needs confirmation.",
                fullWidth: true,
              },
            ],
          },
        ],
      }),
    );

    expect(html).toContain("Case brief");
    expect(html).toContain("Signal summary");
    expect(html).toContain("Power outage closed the triage room.");
    expect(html).toContain("Operational pressure");
    expect(html).toContain("Mamelodi East Clinic");
    expect(html).toContain("GP-TND-001");
    expect(html).toContain("Generator handover needs confirmation.");
    expect(html).toContain("md:col-span-2");
    expect(html).toContain("grid-cols");
    expect(html).not.toContain("divide-y divide-border-subtle");
  });

  it("maps report pressure values to operational detail tones", () => {
    expect(getAdminDetailPressureTone("unknown")).toBe("neutral");
    expect(getAdminDetailPressureTone("moderate")).toBe("attention");
    expect(getAdminDetailPressureTone("high")).toBe("blocked");
    expect(getAdminDetailPressureTone("normal")).toBe("clear");
    expect(getAdminDetailPressureTone("low", "queue")).toBe("clear");
    expect(getAdminDetailPressureTone("low", "stock")).toBe("attention");
  });

  it("exposes the shared admin tone classes for sibling primitives", () => {
    expect(getAdminToneClassName("clear")).toContain("bg-emerald-50");
    expect(getAdminToneClassName("attention")).toContain("bg-amber-50");
    expect(getAdminToneClassName("blocked")).toContain("bg-destructive/10");
    expect(getAdminToneClassName("info")).toContain("bg-sky-50");
  });

  it("normalizes landing and demo status spellings to one product status key", () => {
    expect(normalizeClinicStatus("non-functional")).toBe("non_functional");
    expect(normalizeClinicStatus("non_functional")).toBe("non_functional");
  });

  it("formats internal evidence sources for product-facing briefs", () => {
    expect(formatEvidenceSource("seed")).toBe("scenario seed");
    expect(formatEvidenceSource("field_worker")).toBe("field worker");
    expect(formatEvidenceSource("field_worker", { offlineCreated: true })).toBe(
      "field worker / synced offline",
    );
  });

  it("owns shared clinic status copy in one product module", () => {
    expect(clinicOperatingStatuses).toEqual([
      "operational",
      "degraded",
      "non_functional",
      "unknown",
    ]);
    expect(getClinicStatusCopy("operational")).toMatchObject({
      label: "Operational",
      description: "Clinic is open and delivering expected services.",
    });
    expect(getClinicStatusCopy("non-functional")).toMatchObject({
      label: "Non-functional",
      description: "Clinic is unavailable for normal patient routing.",
    });
  });

  it("renders metric tile content and trend context", () => {
    const html = renderToStaticMarkup(
      createElement(MetricTile, {
        label: "Open alerts",
        count: 8,
        description: "Active district incidents",
        trend: { value: "+2", direction: "up", context: "since morning" },
      }),
    );

    expect(html).toContain("Open alerts");
    expect(html).toContain("8");
    expect(html).toContain("Active district incidents");
    expect(html).toContain("since morning");
  });

  it("renders workspace dashboard loading skeletons", () => {
    const html = renderToStaticMarkup(createElement(WorkspaceDashboardLoading));

    expect(html).toContain("animate-pulse");
    expect(html).toContain("h-[34rem]");
  });

  it("renders workspace clinic detail loading skeletons", () => {
    const html = renderToStaticMarkup(createElement(WorkspaceClinicDetailLoading));

    expect(html).toContain("animate-pulse");
    expect(html).toContain("h-80");
  });

  it("renders report review summary pressure counts", () => {
    const html = renderToStaticMarkup(
      createElement(ReportReviewSummary, {
        summary: {
          pending: 12,
          offline: 4,
          criticalSignals: 3,
          oldestReceivedAt: "2026-05-10T08:30:00.000Z",
        },
      }),
    );

    expect(html).toContain("Report review pressure");
    expect(html).toContain("Pending");
    expect(html).toContain("12");
    expect(html).toContain("Offline");
    expect(html).toContain("4");
    expect(html).toContain("Critical");
    expect(html).toContain("3");
  });

  it("renders report review queue empty state", () => {
    const html = renderToStaticMarkup(
      createElement(ReportReviewQueueView, {
        items: [],
        onReview: async () => undefined,
      }),
    );

    expect(html).toContain('data-testid="report-review-queue"');
    expect(html).toContain("No pending reports");
  });

  it("renders report review queue item actions", () => {
    const review = createPendingReportReview();

    const html = renderToStaticMarkup(
      createElement(ReportReviewQueueView, {
        items: [review],
        onReview: async () => undefined,
        getReportDetailHref: (item) => `/admin/reports/${item.reportId}?from=admin`,
      }),
    );

    expect(html).toContain('data-testid="report-review-item"');
    expect(html).toContain('data-report-id="42"');
    expect(html).toContain("Mamelodi East Clinic");
    expect(html).toContain("Power outage closed the triage room.");
    expect(html).toContain('href="/admin/reports/42?from=admin"');
    expect(html).toContain("Open details");
    expect(html).toContain('data-testid="accept-report-review"');
    expect(html).toContain("Accept");
    expect(html).toContain('data-testid="reject-report-review"');
    expect(html).toContain("Reject");
  });

  it("renders field visit proof on report review queue items", () => {
    const review = createPendingReportReview({
      visitVerification: {
        accuracyLabel: "Good GPS accuracy",
        capturedAt: "2026-05-10T08:12:00.000Z",
        coordinateLabel: "25.70694°S 28.22944°E",
        distanceLabel: "18 m",
        distanceMeters: 18,
        statusLabel: "Location verified",
        tone: "clear",
      },
    });

    const html = renderToStaticMarkup(
      createElement(ReportReviewQueueView, {
        items: [review],
        onReview: async () => undefined,
      }),
    );

    expect(html).toContain("Visit proof");
    expect(html).toContain("Location verified");
    expect(html).toContain("18 m from selected clinic");
    expect(html).toContain("Good GPS accuracy");
  });

  it("renders report stream items as report detail links", () => {
    const html = renderToStaticMarkup(
      createElement(ReportStream, {
        reports: [
          {
            id: "report-demo-1",
            clinicId: "clinic-mamelodi-east",
            clinicName: "Mamelodi East Clinic",
            facilityCode: "FAC-001",
            reporterName: "Sipho Nkosi",
            source: "field_worker",
            offlineCreated: false,
            submittedAt: "2026-05-10T08:20:00.000Z",
            receivedAt: "2026-05-10T08:30:00.000Z",
            status: "degraded",
            reason: "Queues are backing up after the morning shift change.",
            staffPressure: "strained",
            stockPressure: "ok",
            queuePressure: "high",
            notes: "Needs district review.",
          },
        ],
        selectedClinicId: null,
        consequenceByReportId: {
          "report-demo-1": "District monitoring opened a follow-up task.",
        },
        statusChangeByReportId: {
          "report-demo-1": "Operational to degraded",
        },
        onSelectClinic: vi.fn(),
        getReportDetailHref: (report) => `/demo/reports/${report.id}?from=demo`,
      }),
    );

    expect(html).toContain('href="/demo/reports/report-demo-1?from=demo"');
    expect(html).toContain("Open report detail");
    expect(html).toContain("Mamelodi East Clinic");
  });

  it("sends report review action payload and calls success callback", async () => {
    const onReview = vi.fn(async () => undefined);
    const onReviewed = vi.fn();

    await runReportReviewQueueAction({
      reportId: 42,
      decision: "accepted",
      onReview,
      onReviewed,
    });

    expect(onReview).toHaveBeenCalledWith({
      reportId: 42,
      decision: "accepted",
    });
    expect(onReviewed).toHaveBeenCalledOnce();
  });

  it("passes report review notes through action payload", async () => {
    const onReview = vi.fn(async () => undefined);

    await runReportReviewQueueAction({
      reportId: 42,
      decision: "rejected",
      notes: "Duplicate submission from morning sync.",
      onReview,
    });

    expect(onReview).toHaveBeenCalledWith({
      reportId: 42,
      decision: "rejected",
      notes: "Duplicate submission from morning sync.",
    });
  });

  it("passes empty report review notes through action payload", async () => {
    const onReview = vi.fn(async () => undefined);

    await runReportReviewQueueAction({
      reportId: 42,
      decision: "rejected",
      notes: "",
      onReview,
    });

    expect(onReview).toHaveBeenCalledWith({
      reportId: 42,
      decision: "rejected",
      notes: "",
    });
  });

  it("hides successfully reviewed reports from the visible queue", () => {
    const reviewed = createPendingReportReview({ reportId: 42 });
    const pending = createPendingReportReview({
      reportId: 43,
      clinicName: "Atteridgeville Clinic",
    });

    expect(
      getVisibleReportReviewItems([reviewed, pending], new Set([reviewed.reportId])),
    ).toEqual([pending]);
  });

  it("computes reviewed state after success so duplicate submissions stay hidden", () => {
    const reviewed = createPendingReportReview({ reportId: 42 });
    const pending = createPendingReportReview({ reportId: 43 });
    const reviewedReportIds = markReportReviewSucceeded(new Set(), reviewed.reportId);

    expect(getVisibleReportReviewItems([reviewed, pending], reviewedReportIds)).toEqual([
      pending,
    ]);
  });

  it("prunes reviewed reports that are no longer in incoming items", () => {
    const remaining = createPendingReportReview({ reportId: 43 });

    expect(
      Array.from(pruneReviewedReportIds(new Set([42, 43]), [remaining])),
    ).toEqual([43]);
  });

  it("keeps reviewed reports hidden across refreshed arrays until they disappear", () => {
    const reviewed = createPendingReportReview({ reportId: 42 });
    const refreshedReviewed = createPendingReportReview({
      reportId: 42,
      reason: "Updated copy after refresh.",
    });
    const reviewedReportIds = markReportReviewSucceeded(new Set(), reviewed.reportId);
    const refreshedReviewedReportIds = deriveReviewedReportIdsForItems(
      reviewedReportIds,
      [refreshedReviewed],
    );

    expect(
      getVisibleReportReviewItems([refreshedReviewed], refreshedReviewedReportIds),
    ).toEqual([]);
    expect(
      Array.from(deriveReviewedReportIdsForItems(refreshedReviewedReportIds, [])),
    ).toEqual([]);
  });

  it("prunes stored reviewed reports after disappearance so reappearing reports are visible", () => {
    const report = createPendingReportReview({ reportId: 42 });
    const reviewedReportIds = markReportReviewSucceeded(new Set(), report.reportId);
    const refreshedState = reconcileReviewedReportStateForItems(
      { items: [report], reportIds: reviewedReportIds },
      [],
    );

    expect(Array.from(refreshedState.reportIds)).toEqual([]);
    expect(getVisibleReportReviewItems([report], refreshedState.reportIds)).toEqual([
      report,
    ]);
  });

  it("composes caller and router refresh review callbacks", () => {
    const onReviewed = vi.fn();
    const refresh = vi.fn();

    composeReportReviewCallbacks(onReviewed, refresh)();

    expect(onReviewed).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("returns error feedback when report review action fails", async () => {
    const onReview = vi.fn(async () => {
      throw new Error("Review service unavailable");
    });
    const onReviewed = vi.fn();

    const result = await runReportReviewQueueAction({
      reportId: 42,
      decision: "rejected",
      onReview,
      onReviewed,
    });

    expect(result).toEqual({
      ok: false,
      errorMessage: "Review service unavailable",
    });
    expect(onReviewed).not.toHaveBeenCalled();

    const html = renderToStaticMarkup(
      createElement(ReportReviewQueueErrorAlert, {
        message: result.errorMessage,
      }),
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Review service unavailable");
  });
});

function createPendingReportReview(
  overrides: Partial<PendingReportReview> = {},
): PendingReportReview {
  return {
    reportId: 42,
    clinicId: "clinic-42",
    clinicName: "Mamelodi East Clinic",
    facilityCode: "FAC-0042",
    district: "Tshwane",
    reporterName: "Nurse Dlamini",
    source: "mobile_app",
    offlineCreated: true,
    submittedAt: "2026-05-10T08:15:00.000Z",
    receivedAt: "2026-05-10T08:30:00.000Z",
    status: "non_functional",
    reason: "Power outage closed the triage room.",
    staffPressure: "critical",
    stockPressure: "stockout",
    queuePressure: "high",
    notes: "Generator failed during morning intake.",
    reviewState: "pending",
    ...overrides,
  };
}
