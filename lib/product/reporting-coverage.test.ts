import { describe, expect, it } from "vitest";

import type {
  ClinicDetailApiResponse,
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { buildReportingCoverageViewModel } from "@/lib/product/reporting-coverage";

const now = "2026-05-22T08:00:00.000Z";

function clinic({
  district = "Tshwane North District",
  freshness,
  id,
  source = "seed",
  status,
}: {
  district?: string;
  freshness: string;
  id: string;
  source?: string;
  status: string;
}): ClinicDetailApiResponse {
  return {
    clinic: {
      id,
      name: `${id} Clinic`,
      facilityCode: id.toUpperCase(),
      province: "Gauteng",
      district,
      facilityType: "clinic",
      verificationStatus: "verified",
      createdAt: now,
      updatedAt: now,
    },
    services: [],
    currentStatus: {
      clinicId: id,
      status,
      freshness,
      updatedAt: now,
      lastReportedAt: now,
      reporterName: "District Ops Desk",
      source,
      staffPressure: "normal",
      stockPressure: "normal",
      queuePressure: "normal",
    },
  };
}

const pendingReport: ReportApiResponse = {
  id: 8,
  clinicId: "clinic-stale",
  reporterName: "District Ops Desk",
  source: "field_worker",
  offlineCreated: true,
  submittedAt: "2026-05-22T07:40:00.000Z",
  receivedAt: "2026-05-22T07:45:00.000Z",
  status: "unknown",
  reason: "Offline report needs backstop review before the status is trusted.",
  reviewState: "pending",
};

const syncSummary: SyncSummaryApiResponse = {
  windowStartedAt: "2026-05-22T06:00:00.000Z",
  offlineReportsReceived: 2,
  duplicateSyncsHandled: 1,
  conflictsNeedingAttention: 0,
  validationFailures: 1,
  pendingOfflineReports: 1,
  needsConfirmationClinics: 1,
  staleClinics: 1,
  medianCurrentStatusAgeHours: 7,
};

describe("buildReportingCoverageViewModel", () => {
  it("builds a ledger-shaped coverage model from clinic freshness and review evidence", () => {
    const viewModel = buildReportingCoverageViewModel({
      clinics: [
        clinic({ id: "clinic-fresh", freshness: "fresh", status: "operational" }),
        clinic({ id: "clinic-stale", freshness: "stale", status: "unknown" }),
        clinic({
          district: "Johannesburg East District",
          freshness: "needs_confirmation",
          id: "clinic-confirm",
          source: "clinic_coordinator",
          status: "degraded",
        }),
      ],
      pendingReports: [pendingReport],
      syncSummary,
    });

    expect(viewModel.header.title).toBe("Reporting coverage");
    expect(viewModel.header.readiness.value).toBe("0%");
    expect(viewModel.header.syncWindow).toContain("22 May 2026");
    expect(viewModel.composition.map((item) => [item.id, item.count])).toEqual([
      ["fresh", 1],
      ["needs_confirmation", 1],
      ["stale", 1],
      ["unknown", 0],
      ["pending_review", 1],
    ]);
    expect(viewModel.districtMatrix.rows).toHaveLength(2);
    expect(viewModel.districtMatrix.rows[0]).toMatchObject({
      district: "Tshwane North District",
      clinics: 2,
      pendingReviews: 1,
      readinessPercent: 0,
    });
    expect(viewModel.ledger.rows[0]).toMatchObject({
      clinicId: "clinic-stale",
      clinicHref: "/district/clinics/clinic-stale?from=admin-reporting-coverage",
      evidenceNote: "Backstop review required before coverage is trusted",
      reviewState: "pending_review",
    });
    expect(viewModel.evidenceReceipt?.clinicName).toBe("clinic-stale Clinic");
    expect(viewModel.evidenceReceipt?.timeline.map((item) => item.label)).toEqual([
      "Submitted",
      "Received",
      "Now",
    ]);
  });
});
