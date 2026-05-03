import { describe, expect, it } from "vitest";

import {
  applyOfflineSyncResult,
  getNextRetryAt,
  markQueuedItemNetworkFailure,
  markQueuedItemSyncing,
} from "@/lib/demo/offline-sync";
import type { OfflineSyncApiResult } from "@/lib/demo/offline-sync-types";
import type { OfflineReportQueueItem } from "@/lib/demo/types";

const now = new Date("2026-05-03T08:00:00.000Z");

function queueItem(
  overrides: Partial<OfflineReportQueueItem> = {},
): OfflineReportQueueItem {
  return {
    clientReportId: "client-report-1",
    schemaVersion: 1,
    clinicId: "clinic-mamelodi-east",
    status: "degraded",
    reason: "Pharmacy queue is backing up.",
    staffPressure: "strained",
    stockPressure: "low",
    queuePressure: "high",
    notes: "Queue pressure is visible from reception.",
    submittedAt: "2026-05-03T07:55:00.000Z",
    queuedAt: "2026-05-03T07:55:01.000Z",
    updatedAt: "2026-05-03T07:55:01.000Z",
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

describe("offline sync retry planning", () => {
  it("uses immediate retry for first attempt", () => {
    expect(getNextRetryAt(1, now)).toBe(now.toISOString());
  });

  it("uses thirty second retry after second attempt", () => {
    expect(getNextRetryAt(2, now)).toBe("2026-05-03T08:00:30.000Z");
  });

  it("uses two minute retry after third attempt", () => {
    expect(getNextRetryAt(3, now)).toBe("2026-05-03T08:02:00.000Z");
  });

  it("uses five minute retry after later attempts", () => {
    expect(getNextRetryAt(4, now)).toBe("2026-05-03T08:05:00.000Z");
    expect(getNextRetryAt(8, now)).toBe("2026-05-03T08:05:00.000Z");
  });
});

describe("offline sync item transitions", () => {
  it("marks queued items as syncing and records the attempt", () => {
    expect(markQueuedItemSyncing(queueItem(), now)).toMatchObject({
      syncStatus: "syncing",
      attemptCount: 1,
      lastAttemptAt: now.toISOString(),
      nextRetryAt: null,
      lastError: null,
      updatedAt: now.toISOString(),
    });
  });

  it("maps created and duplicate API results to synced queue items", () => {
    const item = queueItem({
      syncStatus: "syncing",
      attemptCount: 2,
      lastError: "Previous network failure",
      conflictReason: "Previous conflict",
      nextRetryAt: "2026-05-03T08:02:00.000Z",
    });
    const created: OfflineSyncApiResult = {
      clientReportId: "client-report-1",
      result: "created",
      report: { id: 42, reviewState: "pending_review" },
    };
    const duplicate: OfflineSyncApiResult = {
      clientReportId: "client-report-1",
      result: "duplicate",
      report: { id: 43, reviewState: "approved" },
    };

    expect(applyOfflineSyncResult(item, created, now)).toMatchObject({
      syncStatus: "synced",
      lastServerReportId: 42,
      lastServerReviewState: "pending_review",
      nextRetryAt: null,
      lastError: null,
      conflictReason: null,
      updatedAt: now.toISOString(),
    });
    expect(applyOfflineSyncResult(item, duplicate, now)).toMatchObject({
      syncStatus: "synced",
      lastServerReportId: 43,
      lastServerReviewState: "approved",
    });
  });

  it("maps conflict API results to conflict queue items", () => {
    const result: OfflineSyncApiResult = {
      clientReportId: "client-report-1",
      result: "conflict",
      error: {
        code: "REPORT_CONFLICT",
        message: "A newer clinic report already exists.",
      },
    };

    expect(applyOfflineSyncResult(queueItem(), result, now)).toMatchObject({
      syncStatus: "conflict",
      lastError: "A newer clinic report already exists.",
      conflictReason: "A newer clinic report already exists.",
      nextRetryAt: null,
      updatedAt: now.toISOString(),
    });
  });

  it("maps validation errors to failed queue items", () => {
    const result: OfflineSyncApiResult = {
      clientReportId: "client-report-1",
      result: "validation_error",
      error: {
        code: "INVALID_STATUS",
        message: "Status is not valid for this clinic.",
        fields: ["status"],
      },
    };

    expect(applyOfflineSyncResult(queueItem(), result, now)).toMatchObject({
      syncStatus: "failed",
      lastError: "Status is not valid for this clinic.",
      nextRetryAt: null,
      conflictReason: null,
      updatedAt: now.toISOString(),
    });
  });

  it("normalizes direct queued item network failures to a first failed attempt", () => {
    const item = queueItem({ attemptCount: 0 });

    expect(markQueuedItemNetworkFailure(item, "Network unavailable", now)).toMatchObject({
      syncStatus: "retry_wait",
      attemptCount: 1,
      lastAttemptAt: now.toISOString(),
      nextRetryAt: "2026-05-03T08:00:00.000Z",
      lastError: "Network unavailable",
      updatedAt: now.toISOString(),
    });
  });

  it("does not increment network failures that already have an attempt count", () => {
    const item = queueItem({ attemptCount: 2 });

    expect(markQueuedItemNetworkFailure(item, "Network unavailable", now)).toMatchObject({
      syncStatus: "retry_wait",
      attemptCount: 2,
      lastAttemptAt: now.toISOString(),
      nextRetryAt: "2026-05-03T08:00:30.000Z",
      lastError: "Network unavailable",
      updatedAt: now.toISOString(),
    });
  });

  it("does not double-count a failed sync attempt after marking syncing", () => {
    const syncing = markQueuedItemSyncing(queueItem(), now);

    expect(markQueuedItemNetworkFailure(syncing, "Network unavailable", now)).toMatchObject({
      syncStatus: "retry_wait",
      attemptCount: 1,
      nextRetryAt: now.toISOString(),
    });
  });

  it("fails sync results whose client id does not match the queued item", () => {
    const item = queueItem({
      clientReportId: "queued-client-report",
      lastServerReportId: null,
      lastServerReviewState: null,
    });
    const result: OfflineSyncApiResult = {
      clientReportId: "different-client-report",
      result: "created",
      report: { id: 42, reviewState: "pending_review" },
    };

    expect(applyOfflineSyncResult(item, result, now)).toMatchObject({
      clientReportId: "queued-client-report",
      syncStatus: "failed",
      lastError:
        "Offline sync result client id mismatch: expected queued-client-report, received different-client-report.",
      lastServerReportId: null,
      lastServerReviewState: null,
      nextRetryAt: null,
      conflictReason: null,
      updatedAt: now.toISOString(),
    });
  });
});
