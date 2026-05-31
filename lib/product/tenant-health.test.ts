import { describe, expect, it } from "vitest";

import type {
  AdminUserAccessApiResponse,
  ClinicDetailApiResponse,
  PartnerReadinessApiResponse,
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/workspace/api-types";
import { buildTenantHealthViewModel } from "@/lib/product/tenant-health";

const now = "2026-05-22T08:00:00.000Z";

function clinic(id: string, freshness: string): ClinicDetailApiResponse {
  return {
    clinic: {
      id,
      name: `${id} Clinic`,
      facilityCode: id.toUpperCase(),
      province: "Gauteng",
      district: "Tshwane North District",
      facilityType: "clinic",
      verificationStatus: "verified",
      createdAt: now,
      updatedAt: now,
    },
    services: [],
    currentStatus: {
      clinicId: id,
      status: freshness === "fresh" ? "operational" : "unknown",
      freshness,
      updatedAt: now,
      lastReportedAt: now,
      source: "seed",
    },
  };
}

const pendingReport: ReportApiResponse = {
  id: 7,
  clinicId: "clinic-002",
  reporterName: "District Ops Desk",
  source: "seed",
  offlineCreated: false,
  submittedAt: now,
  receivedAt: now,
  status: "unknown",
  reason: "Conflicting field notes need confirmation.",
  reviewState: "pending",
};

const users: AdminUserAccessApiResponse[] = [
  {
    userId: 1,
    email: "sysadmin@clinicpulse.local",
    displayName: "System Admin",
    createdAt: now,
    role: "system_admin",
    organisationId: 1,
    lastSeenAt: null,
  },
  {
    userId: 2,
    email: "manager@clinicpulse.local",
    displayName: "District Manager",
    createdAt: now,
    role: "district_manager",
    organisationId: 1,
    district: "Tshwane North District",
    lastSeenAt: now,
  },
];

const syncSummary: SyncSummaryApiResponse = {
  windowStartedAt: "2026-05-22T06:00:00.000Z",
  offlineReportsReceived: 2,
  duplicateSyncsHandled: 1,
  conflictsNeedingAttention: 1,
  validationFailures: 1,
  pendingOfflineReports: 1,
  needsConfirmationClinics: 1,
  staleClinics: 1,
  medianCurrentStatusAgeHours: 8,
};

const partnerReadiness: PartnerReadinessApiResponse = {
  apiKeys: [],
  webhookSubscriptions: [],
  webhookEvents: [],
  exportRuns: [],
  integrationChecks: [],
};

describe("buildTenantHealthViewModel", () => {
  it("builds a distinct estate health board from tenant evidence", () => {
    const viewModel = buildTenantHealthViewModel({
      clinics: [clinic("clinic-001", "fresh"), clinic("clinic-002", "stale")],
      pendingReports: [pendingReport],
      partnerReadiness,
      syncSummary,
      users,
    });

    expect(viewModel.header.title).toBe("Tenant estate health map");
    expect(viewModel.header.score.label).toBe("Estate score");
    expect(viewModel.metrics.map((metric) => metric.label)).toEqual([
      "Tenant readiness",
      "District footprint",
      "Open health signals",
      "Access review load",
    ]);
    expect(viewModel.districtStack.title).toBe("District health stack");
    expect(viewModel.districtStack.rows).toHaveLength(1);
    expect(viewModel.districtStack.rows[0]).toMatchObject({
      district: "Tshwane North District",
      clinics: 2,
      freshnessRisk: 1,
    });
    expect(viewModel.signalLedger.title).toBe("Health signal ledger");
    expect(viewModel.signalLedger.items.map((item) => item.label)).toEqual([
      "Coverage freshness",
      "Ingestion queue",
      "Privileged access",
      "Partner readiness",
    ]);
    expect(viewModel.actions.map((action) => action.label)).toEqual([
      "Review ingestion",
      "Audit access",
      "Partner readiness",
    ]);
    expect(viewModel.commandBrief.caseBrief.title).toBe("Tenant estate packet");
    expect(viewModel.commandBrief.metrics.map((metric) => metric.label)).toEqual([
      "Tenant readiness",
      "District footprint",
      "Open health signals",
      "Access review load",
    ]);
    expect(viewModel.commandBrief.decision.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/admin/data-ingestion", priority: "primary" }),
        expect.objectContaining({ href: "/admin/access-review", priority: "secondary" }),
      ]),
    );
    expect(viewModel.signalLedger.items[1]?.detail).toContain("1 pending review");
    expect(viewModel.sourceReferences.map((reference) => reference.source)).toEqual([
      "Argo CD",
      "OneUptime",
      "Twenty",
      "shadcn dashboard",
    ]);
  });
});
