import { describe, expect, test } from "vitest";

import type { ClientAuthSession } from "@/lib/auth/api";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import {
  buildDashboardPersonalization,
  buildDistrictSignalChartData,
} from "@/lib/demo/dashboard-personalization";
import type { ClinicRow, ReportStreamItem } from "@/lib/demo/types";

const baseSession: ClientAuthSession = {
  displayName: "Nomsa Dlamini",
  email: "nomsa@clinicpulse.local",
  role: "district_manager",
  district: "Tshwane North",
  organisationId: 12,
};

const clinicRows = [
  {
    id: "clinic-a",
    name: "Mamelodi East Community Clinic",
    facilityCode: "GP-TSH-001",
    province: "Gauteng",
    district: "Tshwane North",
    latitude: -25.7,
    longitude: 28.2,
    services: ["Primary care"],
    operatingHours: "08:00-17:00",
    imageKey: "clinic-front-01",
    status: "non_functional",
    reason: "Power outage stopped normal service.",
    freshness: "fresh",
    lastReportedAt: "2026-05-09T08:00:00.000Z",
    reporterName: "Sipho Nkosi",
    source: "field_worker",
    staffPressure: "critical",
    stockPressure: "normal",
    queuePressure: "high",
    image: {
      src: "/demo/clinics/clinic-front-01.jpg",
      alt: "Clinic front",
      caption: "Clinic front",
      credit: "Demo asset",
    },
  },
] satisfies ClinicRow[];

const reportStream = [
  {
    id: "report-1",
    clinicId: "clinic-a",
    clinicName: "Mamelodi East Community Clinic",
    facilityCode: "GP-TSH-001",
    reporterName: "Sipho Nkosi",
    source: "field_worker",
    offlineCreated: false,
    submittedAt: "2026-05-09T08:00:00.000Z",
    receivedAt: "2026-05-09T08:02:00.000Z",
    status: "non_functional",
    reason: "Power outage stopped normal service.",
    staffPressure: "critical",
    stockPressure: "normal",
    queuePressure: "high",
    notes: "Generator unavailable.",
  },
] satisfies ReportStreamItem[];

const syncSummary: SyncSummaryApiResponse = {
  windowStartedAt: "2026-05-09T00:00:00.000Z",
  offlineReportsReceived: 2,
  duplicateSyncsHandled: 1,
  conflictsNeedingAttention: 0,
  validationFailures: 0,
  pendingOfflineReports: 1,
  needsConfirmationClinics: 1,
  staleClinics: 1,
  medianCurrentStatusAgeHours: 3,
};

describe("dashboard personalization", () => {
  test("personalizes the briefing from active membership context", () => {
    const dashboard = buildDashboardPersonalization({
      session: baseSession,
      district: "Fallback District",
      clinicRows,
      activeAlerts: [],
      reportStream,
      syncSummary,
      offlineQueueCount: 0,
    });

    expect(dashboard.greeting).toContain("Nomsa");
    expect(dashboard.roleLabel).toBe("District manager");
    expect(dashboard.organisationLabel).toBe("Organisation 12");
    expect(dashboard.scopeLabel).toBe("Tshwane North");
    expect(dashboard.districtLabel).toBe("Tshwane North");
    expect(dashboard.clinicCountContext).toBe("1 clinic in scope");
    expect(dashboard.primaryAction.kind).toBe("open_clinic");
    expect(dashboard.primaryAction.clinicId).toBe("clinic-a");
    expect(dashboard.workflowSteps.map((step) => step.id)).toEqual([
      "monitor",
      "triage",
      "act",
      "verify",
    ]);
    expect(dashboard.triageBuckets.find((bucket) => bucket.id === "interrupted")?.count).toBe(1);
  });

  test("falls back to email, demo organisation, and provided district without membership fields", () => {
    const dashboard = buildDashboardPersonalization({
      session: {
        displayName: " ",
        email: "ops@clinicpulse.local",
        role: "system_admin",
      },
      district: "Demo District",
      clinicRows: [],
      activeAlerts: [],
      reportStream: [],
      syncSummary: null,
      offlineQueueCount: 0,
    });

    expect(dashboard.userDisplayName).toBe("ops@clinicpulse.local");
    expect(dashboard.greeting).toContain("ops@clinicpulse.local");
    expect(dashboard.title).toBe("Platform operations briefing");
    expect(dashboard.organisationLabel).toBe("Demo organisation");
    expect(dashboard.scopeLabel).toBe("Demo District");
    expect(dashboard.primaryAction.kind).toBe("open_admin");
  });

  test("prioritizes offline sync when no clinic is non-functional", () => {
    const dashboard = buildDashboardPersonalization({
      session: baseSession,
      district: "Tshwane North",
      clinicRows: clinicRows.map((clinic) => ({
        ...clinic,
        status: "operational",
        reason: "Routine service available.",
      })),
      activeAlerts: [],
      reportStream,
      syncSummary,
      offlineQueueCount: 2,
    });

    expect(dashboard.primaryAction.kind).toBe("sync_offline");
  });

  test("builds signal chart points from report stream", () => {
    const points = buildDistrictSignalChartData(reportStream);

    expect(points).toEqual([
      {
        label: "May 09",
        operational: 0,
        degraded: 0,
        nonFunctional: 1,
        unknown: 0,
      },
    ]);
  });
});
