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
    src: "/demo/clinics/clinic-front-01.jpg",
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
    expect(model.routeProgressPercent).toBe(100);
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
    expect(model.routeProgressPercent).toBe(50);
  });
});
