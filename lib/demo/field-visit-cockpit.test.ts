import { describe, expect, it } from "vitest";

import type { ClinicRow, OfflineReportQueueItem } from "@/lib/demo/types";
import {
  buildFieldVisitCockpitViewModel,
  getOfflineReportStatusLabel,
} from "./field-visit-cockpit";

const baseClinic = {
  id: "clinic-a",
  name: "Clinic A",
  facilityCode: "CPA",
  province: "Gauteng",
  district: "Tshwane",
  latitude: -25.74,
  longitude: 28.13,
  services: ["Primary care"],
  operatingHours: "08:00-16:00",
  imageKey: "clinic-front-01",
  image: {
    src: "/district/clinics/clinic-front-01.jpg",
    alt: "Clinic entrance.",
    caption: "Clinic frontage.",
    credit: "ClinicPulse demo asset",
  },
  clinicId: "clinic-a",
  status: "operational",
  reason: "Routine service available.",
  freshness: "fresh",
  lastReportedAt: "2026-05-01T08:00:00.000Z",
  reporterName: "Seed",
  source: "seed",
  staffPressure: "normal",
  stockPressure: "normal",
  queuePressure: "low",
} satisfies ClinicRow;

function clinic(overrides: Partial<ClinicRow>): ClinicRow {
  return { ...baseClinic, ...overrides };
}

function queueItem(overrides: Partial<OfflineReportQueueItem>): OfflineReportQueueItem {
  return {
    clientReportId: "queue-1",
    schemaVersion: 1,
    clinicId: "clinic-b",
    status: "degraded",
    reason: "Offline report.",
    staffPressure: "strained",
    stockPressure: "low",
    queuePressure: "high",
    notes: "Needs sync.",
    submittedAt: "2026-05-01T08:10:00.000Z",
    queuedAt: "2026-05-01T08:11:00.000Z",
    updatedAt: "2026-05-01T08:12:00.000Z",
    syncStatus: "queued",
    attemptCount: 0,
    nextRetryAt: null,
    lastAttemptAt: null,
    lastError: null,
    lastServerReportId: null,
    lastServerReviewState: null,
    conflictReason: null,
    ...overrides,
  };
}

describe("field visit cockpit view model", () => {
  it("sorts itinerary rows by field risk before seeded order", () => {
    const model = buildFieldVisitCockpitViewModel({
      clinics: [
        clinic({ id: "clinic-a", clinicId: "clinic-a", name: "Fresh Clinic" }),
        clinic({
          id: "clinic-b",
          clinicId: "clinic-b",
          name: "Stale Clinic",
          freshness: "stale",
        }),
        clinic({
          id: "clinic-c",
          clinicId: "clinic-c",
          name: "Closed Clinic",
          status: "non_functional",
        }),
      ],
      isOnline: true,
      lastSyncedAt: null,
      offlineReports: [],
      selectedClinicId: "clinic-a",
    });

    expect(model.itineraryRows.map((row) => row.clinicId)).toEqual([
      "clinic-c",
      "clinic-b",
      "clinic-a",
    ]);
    expect(model.selectedVisit.positionLabel).toBe("Stop 3 of 3");
    expect(model.routePositionPercent).toBe(100);
    expect(model.routePositionLabel).toBe("Stop 3 of 3");
  });

  it("defaults the selected visit to the first risk-prioritized stop", () => {
    const model = buildFieldVisitCockpitViewModel({
      clinics: [
        clinic({ id: "clinic-a", clinicId: "clinic-a", name: "Fresh Clinic" }),
        clinic({
          id: "clinic-b",
          clinicId: "clinic-b",
          name: "Closed Clinic",
          status: "non_functional",
          lastReportedAt: "2026-04-30T08:00:00.000Z",
        }),
      ],
      isOnline: true,
      lastSyncedAt: null,
      offlineReports: [],
      selectedClinicId: null,
    });

    expect(model.itineraryRows.map((row) => row.clinicId)).toEqual([
      "clinic-b",
      "clinic-a",
    ]);
    expect(model.selectedVisit.clinicId).toBe("clinic-b");
    expect(model.selectedVisit.positionLabel).toBe("Stop 1 of 2");
  });

  it("maps queue statuses to field-worker language", () => {
    expect(getOfflineReportStatusLabel("queued")).toMatchObject({
      label: "Saved on this device",
      tone: "attention",
    });
    expect(getOfflineReportStatusLabel("retry_wait")).toMatchObject({
      label: "Needs retry",
      tone: "blocked",
    });
    expect(getOfflineReportStatusLabel("synced")).toMatchObject({
      label: "Sent for district review",
      tone: "clear",
    });
  });

  it("shows continue report when the selected clinic already has queued work", () => {
    const model = buildFieldVisitCockpitViewModel({
      clinics: [
        clinic({ id: "clinic-a", clinicId: "clinic-a" }),
        clinic({ id: "clinic-b", clinicId: "clinic-b", name: "Queued Clinic" }),
      ],
      isOnline: false,
      lastSyncedAt: "2026-05-01T08:00:00.000Z",
      offlineReports: [queueItem({ clinicId: "clinic-b" })],
      selectedClinicId: "clinic-b",
    });

    expect(model.selectedVisit.primaryActionLabel).toBe("Continue report");
    expect(model.selectedVisit.queueLabel).toBe("Saved on this device");
    expect(model.deviceStrip.savedOnDeviceCount).toBe(1);
    expect(model.deviceStrip.connectionLabel).toBe("Offline");
    expect(model.routePositionPercent).toBe(50);
    expect(model.routePositionLabel).toBe("Stop 1 of 2");
  });

  it("builds a field task queue from the active stop and device state", () => {
    const model = buildFieldVisitCockpitViewModel({
      clinics: [
        clinic({
          id: "clinic-a",
          clinicId: "clinic-a",
          name: "Fresh Clinic",
        }),
        clinic({
          id: "clinic-b",
          clinicId: "clinic-b",
          name: "Queued Clinic",
          status: "degraded",
        }),
      ],
      isOnline: false,
      lastSyncedAt: "2026-05-01T08:00:00.000Z",
      offlineReports: [
        queueItem({ clinicId: "clinic-b", syncStatus: "retry_wait" }),
        queueItem({
          clientReportId: "queue-2",
          clinicId: "clinic-a",
          syncStatus: "synced",
        }),
      ],
      selectedClinicId: "clinic-b",
    });

    expect(model.taskQueue.map((task) => task.title)).toEqual([
      "Open active stop",
      "Continue clinic report",
      "Retry device sync",
      "District review handoff",
    ]);
    expect(model.taskQueue.map((task) => task.stateLabel)).toEqual([
      "Stop 1 of 2",
      "Needs retry",
      "1 needs retry",
      "1 sent",
    ]);
    expect(model.taskQueue.map((task) => task.href)).toEqual([
      "/field#field-itinerary",
      "/field#submit-report",
      "/field#drafts-sync",
      "/field#recent-reports",
    ]);
  });

  it("shows captured visit proof in the clinic report task", () => {
    const model = buildFieldVisitCockpitViewModel({
      clinics: [clinic({ id: "clinic-a", clinicId: "clinic-a" })],
      isOnline: true,
      lastSyncedAt: null,
      offlineReports: [],
      selectedClinicId: "clinic-a",
      selectedVisitVerification: {
        accuracyLabel: "Good GPS accuracy",
        capturedAt: "2026-05-01T08:05:00.000Z",
        coordinateLabel: "25.70960°S 28.36760°E",
        distanceLabel: "0 m",
        distanceMeters: 0,
        statusLabel: "Location verified",
        tone: "clear",
      },
    });

    expect(model.taskQueue.find((task) => task.id === "clinic-report")).toMatchObject({
      description: "Visit proof captured. Complete status, pressure, and notes.",
      stateLabel: "Location verified",
      tone: "clear",
    });
  });

  it("keeps zero-count field task queue labels readable", () => {
    const model = buildFieldVisitCockpitViewModel({
      clinics: [clinic({ id: "clinic-a", clinicId: "clinic-a" })],
      isOnline: true,
      lastSyncedAt: null,
      offlineReports: [],
      selectedClinicId: "clinic-a",
    });

    expect(model.taskQueue.map((task) => task.stateLabel)).toContain("0 saved");
    expect(model.taskQueue.map((task) => task.stateLabel)).toContain("0 sent");
  });
});
