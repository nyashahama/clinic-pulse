import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MetricTile } from "@/components/product/metric-tile";
import { ProductPanel } from "@/components/product/panel";
import { ReportReviewQueueView } from "@/components/product/report-review-queue";
import { ReportReviewSummary } from "@/components/product/report-review-summary";
import { ProductResponsiveTable } from "@/components/product/responsive-table";
import { SurfaceState } from "@/components/product/surface-state";
import {
  WorkspaceClinicDetailLoading,
  WorkspaceDashboardLoading,
} from "@/components/product/workspace-loading";
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
    const review: PendingReportReview = {
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
    };

    const html = renderToStaticMarkup(
      createElement(ReportReviewQueueView, {
        items: [review],
        onReview: async () => undefined,
      }),
    );

    expect(html).toContain('data-testid="report-review-item"');
    expect(html).toContain("Mamelodi East Clinic");
    expect(html).toContain("Power outage closed the triage room.");
    expect(html).toContain('data-testid="accept-report-review"');
    expect(html).toContain("Accept");
    expect(html).toContain('data-testid="reject-report-review"');
    expect(html).toContain("Reject");
  });
});
