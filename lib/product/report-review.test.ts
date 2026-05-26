import { describe, expect, it } from "vitest";

import {
  buildPendingReportReviews,
  summarizePendingReportReviews,
} from "@/lib/product/report-review";
import type { ReportApiResponse } from "@/lib/demo/api-types";
import type { ClinicRow } from "@/lib/demo/types";

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
  notes: "Please verify pharmacy stock.",
  visitVerification: {
    accuracyLabel: "Good GPS accuracy",
    capturedAt: "2026-05-11T08:59:00.000Z",
    coordinateLabel: "25.70694°S 28.22944°E",
    distanceLabel: "18 m",
    distanceMeters: 18,
    statusLabel: "Location verified",
    tone: "clear",
  },
} satisfies ReportApiResponse;

describe("buildPendingReportReviews", () => {
  it("joins pending reports to clinic display context", () => {
    expect(buildPendingReportReviews([report], [clinic])).toEqual([
      {
        reportId: 42,
        clinicId: "clinic-1",
        clinicName: "Mamelodi East Community Clinic",
        facilityCode: "GTP-001",
        district: "Tshwane North",
        reporterName: "Reporter One",
        source: "field_worker",
        offlineCreated: false,
        submittedAt: "2026-05-11T09:00:00.000Z",
        receivedAt: "2026-05-11T09:01:00.000Z",
        status: "degraded",
        reason: "Stock is low",
        staffPressure: "strained",
        stockPressure: "low",
        queuePressure: "moderate",
        notes: "Please verify pharmacy stock.",
        reviewState: "pending",
        visitVerification: {
          accuracyLabel: "Good GPS accuracy",
          capturedAt: "2026-05-11T08:59:00.000Z",
          coordinateLabel: "25.70694°S 28.22944°E",
          distanceLabel: "18 m",
          distanceMeters: 18,
          statusLabel: "Location verified",
          tone: "clear",
        },
      },
    ]);
  });

  it("excludes non-pending reports", () => {
    const acceptedReport = {
      ...report,
      id: 43,
      reviewState: "accepted",
    } satisfies ReportApiResponse;

    expect(buildPendingReportReviews([report, acceptedReport], [clinic])).toHaveLength(1);
  });

  it("uses fallback values for unknown clinics and missing optional report fields", () => {
    const sparseReport = {
      id: 44,
      clinicId: "unknown-clinic",
      source: "partner_api",
      offlineCreated: true,
      submittedAt: "2026-05-11T07:55:00.000Z",
      receivedAt: "2026-05-11T08:05:00.000Z",
      status: "unknown",
      reviewState: "pending",
    } satisfies ReportApiResponse;

    expect(buildPendingReportReviews([sparseReport], [])).toEqual([
      {
        reportId: 44,
        clinicId: "unknown-clinic",
        clinicName: "unknown-clinic",
        facilityCode: "Unknown facility",
        district: "Unknown district",
        reporterName: "ClinicPulse reporter",
        source: "partner_api",
        offlineCreated: true,
        submittedAt: "2026-05-11T07:55:00.000Z",
        receivedAt: "2026-05-11T08:05:00.000Z",
        status: "unknown",
        reason: "No reason supplied.",
        staffPressure: "unknown",
        stockPressure: "unknown",
        queuePressure: "unknown",
        notes: "",
        reviewState: "pending",
      },
    ]);
  });

  it("sorts pending reviews by newest received timestamp first", () => {
    const olderReport = {
      ...report,
      id: 45,
      receivedAt: "2026-05-11T08:59:00.000Z",
    } satisfies ReportApiResponse;
    const newestReport = {
      ...report,
      id: 46,
      receivedAt: "2026-05-11T10:30:00.000Z",
    } satisfies ReportApiResponse;

    expect(
      buildPendingReportReviews([olderReport, report, newestReport], [clinic]).map(
        (review) => review.reportId,
      ),
    ).toEqual([46, 42, 45]);
  });
});

describe("summarizePendingReportReviews", () => {
  it("counts pending, offline, critical signals, and oldest received timestamp", () => {
    const reviews = buildPendingReportReviews(
      [
        report,
        {
          ...report,
          id: 47,
          offlineCreated: true,
          receivedAt: "2026-05-11T07:30:00.000Z",
          status: "non_functional",
          staffPressure: "normal",
          stockPressure: "normal",
          queuePressure: "low",
        },
        {
          ...report,
          id: 48,
          offlineCreated: true,
          receivedAt: "2026-05-11T08:30:00.000Z",
          status: "operational",
          staffPressure: "critical",
          stockPressure: "stockout",
          queuePressure: "high",
        },
      ],
      [clinic],
    );

    expect(summarizePendingReportReviews(reviews)).toEqual({
      pending: 3,
      offline: 2,
      criticalSignals: 2,
      oldestReceivedAt: "2026-05-11T07:30:00.000Z",
    });
  });

  it("returns null oldest timestamp when there are no reviews", () => {
    expect(summarizePendingReportReviews([])).toEqual({
      pending: 0,
      offline: 0,
      criticalSignals: 0,
      oldestReceivedAt: null,
    });
  });
});
