import { describe, expect, it } from "vitest";

import type { OfflineReportQueueItem } from "@/lib/demo/types";
import { buildOfflineReportAuditTrail } from "./offline-report-audit";

function queueItem(
  overrides: Partial<OfflineReportQueueItem> = {},
): OfflineReportQueueItem {
  return {
    clientReportId: "queue-1",
    schemaVersion: 1,
    clinicId: "clinic-a",
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

describe("offline report audit trail", () => {
  it("summarizes a newly queued report as a device-held audit trail", () => {
    const trail = buildOfflineReportAuditTrail(queueItem());

    expect(trail).toEqual([
      {
        id: "submitted",
        label: "Field report captured",
        detail: "The field worker completed the report on this device.",
        timestamp: "2026-05-01T08:10:00.000Z",
        tone: "clear",
      },
      {
        id: "queued",
        label: "Saved on this device",
        detail: "ClinicPulse has not accepted this report yet.",
        timestamp: "2026-05-01T08:11:00.000Z",
        tone: "attention",
      },
      {
        id: "status",
        label: "Waiting to sync",
        detail: "The report will sync when ClinicPulse can be reached.",
        timestamp: "2026-05-01T08:12:00.000Z",
        tone: "attention",
      },
    ]);
  });

  it("shows failed sync attempts and the next retry window", () => {
    const trail = buildOfflineReportAuditTrail(
      queueItem({
        attemptCount: 2,
        lastAttemptAt: "2026-05-01T08:20:00.000Z",
        lastError: "fetch failed",
        nextRetryAt: "2026-05-01T08:25:00.000Z",
        syncStatus: "retry_wait",
        updatedAt: "2026-05-01T08:20:10.000Z",
      }),
    );

    expect(trail.map((event) => event.label)).toEqual([
      "Field report captured",
      "Saved on this device",
      "Sync attempt failed",
      "Retry scheduled",
    ]);
    expect(trail.at(2)).toMatchObject({
      detail: "Attempt 2 failed: fetch failed",
      timestamp: "2026-05-01T08:20:00.000Z",
      tone: "blocked",
    });
    expect(trail.at(3)).toMatchObject({
      detail: "ClinicPulse will retry this device report.",
      timestamp: "2026-05-01T08:25:00.000Z",
      tone: "attention",
    });
  });

  it("records the district handoff when a queued report syncs", () => {
    const trail = buildOfflineReportAuditTrail(
      queueItem({
        attemptCount: 1,
        lastAttemptAt: "2026-05-01T08:20:00.000Z",
        lastServerReportId: 42,
        lastServerReviewState: "pending_review",
        syncStatus: "synced",
        updatedAt: "2026-05-01T08:20:05.000Z",
      }),
    );

    expect(trail.at(-1)).toEqual({
      id: "synced",
      label: "Sent for district review",
      detail: "ClinicPulse accepted server report #42 as pending_review.",
      timestamp: "2026-05-01T08:20:05.000Z",
      tone: "clear",
    });
  });
});
