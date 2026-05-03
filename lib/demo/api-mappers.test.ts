import { describe, expect, it } from "vitest";

import {
  mapApiAlternative,
  mapApiAuditEvent,
  mapApiClinicDetailToClinicRow,
  mapApiDemoHydrationToState,
  mapApiReport,
  mapApiReportToReportStreamItem,
} from "@/lib/demo/api-mappers";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import type {
  AlternativeApiResponse,
  AuditEventApiResponse,
  ClinicDetailApiResponse,
  CurrentStatusApiResponse,
  ReportApiResponse,
} from "@/lib/demo/api-types";
import { getDemoImage } from "@/lib/demo/images";
import type { AuditEvent, ClinicRow, QueuedOfflineReport, ReportStreamItem } from "@/lib/demo/types";

const clinicDetail: ClinicDetailApiResponse = {
  clinic: {
    id: "clinic-mamelodi-east",
    name: "Mamelodi East Community Clinic",
    facilityCode: "GP-TND-001",
    province: "Gauteng",
    district: "Tshwane North Demo District",
    latitude: -25.7096,
    longitude: 28.3676,
    operatingHours: "Mon-Sat 07:00-19:00",
    facilityType: "clinic",
    verificationStatus: "verified",
    lastVerifiedAt: "2026-04-30T12:00:00.000Z",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-05-01T06:40:00.000Z",
  },
  services: [
    {
      clinicId: "clinic-mamelodi-east",
      serviceName: "Primary care",
      currentAvailability: "available",
      confidenceScore: 0.96,
      lastVerifiedAt: "2026-05-01T06:40:00.000Z",
    },
    {
      clinicId: "clinic-mamelodi-east",
      serviceName: "HIV treatment",
      currentAvailability: "available",
    },
  ],
  currentStatus: {
    clinicId: "clinic-mamelodi-east",
    status: "degraded",
    reason: "Lab courier delayed and queues are stacking.",
    freshness: "needs_confirmation",
    lastReportedAt: "2026-05-01T06:40:00.000Z",
    reporterName: "Nomsa Dlamini",
    source: "clinic_coordinator",
    staffPressure: "strained",
    stockPressure: "low",
    queuePressure: "high",
    confidenceScore: 0.88,
    updatedAt: "2026-05-01T06:41:00.000Z",
  },
};

describe("ClinicPulse API mappers", () => {
  it("maps backend hydration payloads into the stable demo state shape", () => {
    const baseState = createInitialDemoState();
    const report: ReportApiResponse = {
      id: 42,
      externalId: "mobile-report-42",
      clinicId: "clinic-mamelodi-east",
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
      offlineCreated: false,
      submittedAt: "2026-05-01T06:35:00.000Z",
      receivedAt: "2026-05-01T06:40:00.000Z",
      status: "degraded",
      reason: "Lab courier delayed and queues are stacking.",
      staffPressure: "strained",
      stockPressure: "low",
      queuePressure: "high",
      notes: "Pharmacy queue moving within target.",
      reviewState: "accepted",
    };
    const auditEvent: AuditEventApiResponse = {
      id: 9,
      externalId: "audit-mobile-9",
      clinicId: "clinic-mamelodi-east",
      actorName: "District Ops Desk",
      eventType: "clinic.status_changed",
      summary: "Clinic status changed after the latest field report.",
      createdAt: "2026-05-01T06:42:00.000Z",
    };
    const queuedReport = {
      ...mapApiReport(report),
      id: "queued-report-1",
      queuedAt: "2026-05-01T06:41:00.000Z",
      syncStatus: "queued",
    } satisfies QueuedOfflineReport;

    const state = mapApiDemoHydrationToState(
      {
        clinics: [clinicDetail],
        reportsByClinicId: {
          "clinic-mamelodi-east": [report],
        },
        auditEventsByClinicId: {
          "clinic-mamelodi-east": [auditEvent],
        },
      },
      {
        ...baseState,
        offlineQueue: [queuedReport],
      },
    );

    expect(state).toMatchObject({
      province: "Gauteng",
      district: "Tshwane North Demo District",
      leads: baseState.leads,
      role: baseState.role,
      lastSyncAt: baseState.lastSyncAt,
    });
    expect(state.clinics).toHaveLength(1);
    expect(state.clinics[0]).toMatchObject({
      id: "clinic-mamelodi-east",
      name: "Mamelodi East Community Clinic",
    });
    expect(state.clinicStates).toEqual([
      expect.objectContaining({
        clinicId: "clinic-mamelodi-east",
        status: "degraded",
      }),
    ]);
    expect(state.reports).toEqual([expect.objectContaining({ id: "mobile-report-42" })]);
    expect(state.auditEvents).toEqual([expect.objectContaining({ id: "audit-mobile-9" })]);
    expect(state.offlineQueue).toHaveLength(1);
  });

  it("maps backend clinic detail and status to ClinicRow-compatible data", () => {
    const row = mapApiClinicDetailToClinicRow(clinicDetail, {
      imageKey: "clinic-front-02",
    });

    expect(row).toEqual({
      id: "clinic-mamelodi-east",
      name: "Mamelodi East Community Clinic",
      facilityCode: "GP-TND-001",
      province: "Gauteng",
      district: "Tshwane North Demo District",
      latitude: -25.7096,
      longitude: 28.3676,
      services: ["Primary care", "HIV treatment"],
      operatingHours: "Mon-Sat 07:00-19:00",
      imageKey: "clinic-front-02",
      clinicId: "clinic-mamelodi-east",
      status: "degraded",
      reason: "Lab courier delayed and queues are stacking.",
      freshness: "needs_confirmation",
      lastReportedAt: "2026-05-01T06:40:00.000Z",
      reporterName: "Nomsa Dlamini",
      source: "clinic_coordinator",
      staffPressure: "strained",
      stockPressure: "low",
      queuePressure: "high",
      image: getDemoImage("clinic-front-02"),
    } satisfies ClinicRow);
  });

  it("maps backend clinic detail without status to unknown ClinicRow defaults", () => {
    const row = mapApiClinicDetailToClinicRow({
      ...clinicDetail,
      currentStatus: undefined,
    });

    expect(row).toMatchObject({
      clinicId: "clinic-mamelodi-east",
      status: "unknown",
      reason: "No current status has been reported.",
      freshness: "unknown",
      lastReportedAt: "2026-05-01T06:40:00.000Z",
      reporterName: "ClinicPulse API",
      source: "seed",
      staffPressure: "unknown",
      stockPressure: "unknown",
      queuePressure: "unknown",
    } satisfies Partial<ClinicRow>);
  });

  it("maps backend reports to report stream items", () => {
    const report: ReportApiResponse = {
      id: 42,
      externalId: "mobile-report-42",
      clinicId: "clinic-mamelodi-east",
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
      offlineCreated: true,
      submittedAt: "2026-05-01T06:35:00.000Z",
      receivedAt: "2026-05-01T06:40:00.000Z",
      status: "operational",
      reason: "All essential services are available.",
      staffPressure: "normal",
      stockPressure: "low",
      queuePressure: "moderate",
      notes: "Pharmacy queue moving within target.",
      reviewState: "accepted",
      confidenceScore: 0.93,
    };

    expect(mapApiReportToReportStreamItem(report, clinicDetail)).toEqual({
      id: "mobile-report-42",
      clinicId: "clinic-mamelodi-east",
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
      offlineCreated: true,
      submittedAt: "2026-05-01T06:35:00.000Z",
      receivedAt: "2026-05-01T06:40:00.000Z",
      status: "operational",
      reason: "All essential services are available.",
      staffPressure: "normal",
      stockPressure: "low",
      queuePressure: "moderate",
      notes: "Pharmacy queue moving within target.",
      clinicName: "Mamelodi East Community Clinic",
      facilityCode: "GP-TND-001",
    } satisfies ReportStreamItem);
  });

  it("maps backend report missing nullable fields to frontend defaults", () => {
    const report: ReportApiResponse = {
      id: 7,
      clinicId: "clinic-mamelodi-east",
      reporterName: undefined,
      source: "clinic_coordinator",
      offlineCreated: false,
      submittedAt: "2026-05-01T06:35:00.000Z",
      receivedAt: "2026-05-01T06:40:00.000Z",
      status: "degraded",
      reason: undefined,
      staffPressure: undefined,
      stockPressure: undefined,
      queuePressure: undefined,
      notes: undefined,
      reviewState: "accepted",
    };

    expect(mapApiReportToReportStreamItem(report, clinicDetail)).toMatchObject({
      id: "report-7",
      reporterName: "ClinicPulse API",
      reason: "",
      staffPressure: "unknown",
      stockPressure: "unknown",
      queuePressure: "unknown",
      notes: "",
    } satisfies Partial<ReportStreamItem>);
  });

  it("maps backend audit events to the existing audit trail shape", () => {
    const event: AuditEventApiResponse = {
      id: 9,
      externalId: "audit-mobile-9",
      clinicId: "clinic-mamelodi-east",
      actorName: "District Ops Desk",
      eventType: "clinic.status_changed",
      summary: "Clinic status changed after the latest field report.",
      createdAt: "2026-05-01T06:42:00.000Z",
    };

    expect(mapApiAuditEvent(event)).toEqual({
      id: "audit-mobile-9",
      clinicId: "clinic-mamelodi-east",
      actorName: "District Ops Desk",
      eventType: "clinic.status_changed",
      summary: "Clinic status changed after the latest field report.",
      createdAt: "2026-05-01T06:42:00.000Z",
    } satisfies AuditEvent);
  });

  it("maps backend audit events missing nullable actor names to defaults", () => {
    const event: AuditEventApiResponse = {
      id: 10,
      clinicId: "clinic-mamelodi-east",
      actorName: undefined,
      eventType: "unexpected.backend_event",
      summary: "An unknown backend event was recorded.",
      createdAt: "2026-05-01T06:42:00.000Z",
    };

    expect(mapApiAuditEvent(event)).toEqual({
      id: "audit-10",
      clinicId: "clinic-mamelodi-east",
      actorName: "ClinicPulse API",
      eventType: "api.preview_opened",
      summary: "An unknown backend event was recorded.",
      createdAt: "2026-05-01T06:42:00.000Z",
    } satisfies AuditEvent);
  });

  it("maps backend alternatives into finder-friendly routing data", () => {
    const alternative: AlternativeApiResponse = {
      clinic: clinicDetail,
      distanceKm: 8.4,
      reasonCode: "degraded",
      rankReason: "Degraded but fresh enough with requested service",
      matchedService: "Primary care",
    };

    expect(mapApiAlternative(alternative, { imageKey: "clinic-front-02" })).toMatchObject({
      clinic: {
        id: "clinic-mamelodi-east",
        status: "degraded",
        imageKey: "clinic-front-02",
      },
      clinicDetail,
      distanceKm: 8.4,
      estimatedMinutes: 24,
      compatibilityServices: ["Primary care"],
      reason: "Degraded but fresh enough with requested service",
      rankReason: "Degraded but fresh enough with requested service",
      reasonCode: "degraded",
      matchedService: "Primary care",
    });
  });

  it("preserves null alternative distance as unknown routing data", () => {
    const alternative: AlternativeApiResponse = {
      clinic: clinicDetail,
      distanceKm: null,
      reasonCode: "service_availability_fallback",
      rankReason: "Requested service availability needs verification before routing",
      matchedService: "Pharmacy",
    };

    expect(mapApiAlternative(alternative)).toMatchObject({
      distanceKm: null,
      estimatedMinutes: null,
      compatibilityServices: ["Pharmacy"],
      reason: "Requested service availability needs verification before routing",
      rankReason: "Requested service availability needs verification before routing",
      reasonCode: "service_availability_fallback",
      matchedService: "Pharmacy",
    });
  });

  it("maps standalone status payloads into row-compatible status fields", () => {
    const status: CurrentStatusApiResponse = {
      clinicId: "clinic-mamelodi-east",
      status: "operational",
      freshness: "fresh",
      updatedAt: "2026-05-01T06:41:00.000Z",
    };

    expect(mapApiClinicDetailToClinicRow({ ...clinicDetail, currentStatus: status })).toMatchObject({
      reason: "",
      lastReportedAt: "2026-05-01T06:41:00.000Z",
      reporterName: "ClinicPulse API",
      source: "seed",
      staffPressure: "unknown",
      stockPressure: "unknown",
      queuePressure: "unknown",
    } satisfies Partial<ClinicRow>);
  });

  it("maps public status payloads without reporter or source fields safely", () => {
    const status = {
      clinicId: "clinic-mamelodi-east",
      status: "degraded",
      reason: "Public status omits internal attribution.",
      freshness: "needs_confirmation",
      staffPressure: "strained",
      stockPressure: "low",
      queuePressure: "moderate",
      updatedAt: "2026-05-01T06:41:00.000Z",
    } satisfies CurrentStatusApiResponse;

    expect(mapApiClinicDetailToClinicRow({ ...clinicDetail, currentStatus: status })).toMatchObject({
      status: "degraded",
      reason: "Public status omits internal attribution.",
      reporterName: "ClinicPulse API",
      source: "seed",
      staffPressure: "strained",
      stockPressure: "low",
      queuePressure: "moderate",
    } satisfies Partial<ClinicRow>);
  });
});
