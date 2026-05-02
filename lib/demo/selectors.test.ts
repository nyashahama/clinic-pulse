import { describe, expect, it } from "vitest";

import { getDemoImage } from "@/lib/demo/images";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import {
  getActiveAlerts,
  getAlternativeClinics,
  getClinicAuditEvents,
  getClinicReports,
  getClinicRows,
  getRecentReportStream,
  getStatusCounts,
} from "@/lib/demo/selectors";
import type { AlertSeverity, AuditEvent, ReportEvent } from "@/lib/demo/types";

function byRecentTimestamp<T extends { createdAt?: string; receivedAt?: string }>(
  left: T,
  right: T,
) {
  return (
    new Date(right.createdAt ?? right.receivedAt ?? 0).getTime() -
    new Date(left.createdAt ?? left.receivedAt ?? 0).getTime()
  );
}

function findClinicIdWithReportsAndAuditEvents() {
  const state = createInitialDemoState();

  return state.clinics.find(
    (clinic) =>
      state.reports.some((report) => report.clinicId === clinic.id) &&
      state.auditEvents.some((event) => event.clinicId === clinic.id),
  )?.id;
}

function addMilliseconds(timestamp: number, milliseconds: number) {
  return new Date(timestamp + milliseconds).toISOString();
}

describe("demo selectors", () => {
  it("counts current clinic statuses and keeps totals aligned with clinic states", () => {
    const state = createInitialDemoState();
    const counts = getStatusCounts(state);

    expect(counts.operational).toBeGreaterThan(0);
    expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(
      state.clinicStates.length,
    );

    expect(counts).toEqual({
      operational: state.clinicStates.filter((entry) => entry.status === "operational").length,
      degraded: state.clinicStates.filter((entry) => entry.status === "degraded").length,
      non_functional: state.clinicStates.filter((entry) => entry.status === "non_functional").length,
      unknown: state.clinicStates.filter((entry) => entry.status === "unknown").length,
    });
  });

  it("joins clinics with current state and image metadata", () => {
    const state = createInitialDemoState();
    const rows = getClinicRows(state);
    const row = rows.find((candidate) => candidate.id === state.clinics[0].id);

    expect(rows).toHaveLength(state.clinics.length);
    expect(row).toBeDefined();

    const clinic = state.clinics.find((candidate) => candidate.id === row!.id);
    const clinicState = state.clinicStates.find((entry) => entry.clinicId === row!.id);

    expect(clinic).toBeDefined();
    expect(clinicState).toBeDefined();
    expect(row).toMatchObject({
      ...clinic!,
      ...clinicState!,
      image: getDemoImage(clinic!.imageKey),
    });
  });

  it("returns unresolved alerts sorted by severity before time", () => {
    const state = createInitialDemoState();
    const alerts = getActiveAlerts(state);
    const severityRank: Record<AlertSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    expect(alerts.every((alert) => alert.status !== "resolved")).toBe(true);
    expect(["critical", "high"]).toContain(alerts[0].severity);
    expect(alerts).toEqual(
      [...alerts].sort((left, right) => {
        const severityDelta = severityRank[right.severity] - severityRank[left.severity];

        if (severityDelta !== 0) {
          return severityDelta;
        }

        return byRecentTimestamp(left, right);
      }),
    );
  });

  it("returns clinic reports and audit events for one clinic in recent-first order", () => {
    const state = createInitialDemoState();
    const clinicId = findClinicIdWithReportsAndAuditEvents();

    expect(clinicId).toBeDefined();

    const existingClinicReports = state.reports.filter((report) => report.clinicId === clinicId);
    const existingClinicAuditEvents = state.auditEvents.filter(
      (event) => event.clinicId === clinicId,
    );
    const maxReportTimestamp = Math.max(
      ...existingClinicReports.map((report) => new Date(report.receivedAt).getTime()),
    );
    const maxAuditTimestamp = Math.max(
      ...existingClinicAuditEvents.map((event) => new Date(event.createdAt).getTime()),
    );
    const olderReport: ReportEvent = {
      ...state.reports.find((report) => report.clinicId === clinicId)!,
      id: "report-selector-older",
      receivedAt: addMilliseconds(maxReportTimestamp, -1_000),
    };
    const newerReport: ReportEvent = {
      ...olderReport,
      id: "report-selector-newer",
      receivedAt: addMilliseconds(maxReportTimestamp, 1_000),
    };
    const olderAuditEvent: AuditEvent = {
      ...state.auditEvents.find((event) => event.clinicId === clinicId)!,
      id: "audit-selector-older",
      createdAt: addMilliseconds(maxAuditTimestamp, -1_000),
    };
    const newerAuditEvent: AuditEvent = {
      ...olderAuditEvent,
      id: "audit-selector-newer",
      createdAt: addMilliseconds(maxAuditTimestamp, 1_000),
    };
    const enrichedState = {
      ...state,
      reports: [olderReport, ...state.reports, newerReport],
      auditEvents: [olderAuditEvent, ...state.auditEvents, newerAuditEvent],
    };

    const reports = getClinicReports(enrichedState, clinicId!);
    const auditEvents = getClinicAuditEvents(enrichedState, clinicId!);

    expect(reports.length).toBeGreaterThanOrEqual(2);
    expect(reports.every((report) => report.clinicId === clinicId)).toBe(true);
    expect(reports).toEqual([...reports].sort(byRecentTimestamp));
    expect(reports[0].id).toBe("report-selector-newer");

    expect(auditEvents.length).toBeGreaterThanOrEqual(2);
    expect(auditEvents.every((event) => event.clinicId === clinicId)).toBe(true);
    expect(auditEvents).toEqual([...auditEvents].sort(byRecentTimestamp));
    expect(auditEvents[0].id).toBe("audit-selector-newer");
  });

  it("returns compatible alternative clinics while excluding the source and ineligible clinics", () => {
    const state = createInitialDemoState();
    const source = state.clinics.find((clinic) => clinic.id === "clinic-mabopane-station");

    expect(source).toBeDefined();

    const alternatives = getAlternativeClinics(state, source!.id, "Pharmacy");

    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.every((clinic) => clinic.id !== source!.id)).toBe(true);
    expect(alternatives.every((clinic) => clinic.services.includes("Pharmacy"))).toBe(true);
    expect(
      alternatives.every(
        (clinic) =>
          clinic.status === "operational" ||
          (clinic.status === "degraded" && clinic.freshness !== "stale"),
      ),
    ).toBe(true);
  });

  it("joins recent report stream items to clinic names and facility codes", () => {
    const state = createInitialDemoState();
    const stream = getRecentReportStream(state);

    expect(stream).toHaveLength(state.reports.length);
    expect(stream).toEqual([...stream].sort(byRecentTimestamp));

    for (const item of stream) {
      const clinic = state.clinics.find((candidate) => candidate.id === item.clinicId);

      expect(clinic).toBeDefined();
      expect(item.clinicName).toBe(clinic!.name);
      expect(item.facilityCode).toBe(clinic!.facilityCode);
    }
  });
});
