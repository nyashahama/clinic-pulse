import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __setOfflineReportQueueAdapterForTests,
  addOfflineReport,
  clearSyncedOfflineReports,
  listOfflineReports,
  removeOfflineReport,
  updateOfflineReport,
} from "@/lib/demo/offline-queue-store";
import type { OfflineReportQueueItem } from "@/lib/demo/types";

type StoredRecord = OfflineReportQueueItem | { schemaVersion: number; clientReportId: string };

class FakeOfflineReportQueueAdapter {
  records = new Map<string, StoredRecord>();
  putCalls: StoredRecord[] = [];
  deleteCalls: string[] = [];
  getAllCalls = 0;

  async put(item: OfflineReportQueueItem) {
    this.putCalls.push(item);
    this.records.set(item.clientReportId, item);
  }

  async getAll() {
    this.getAllCalls += 1;
    return Array.from(this.records.values());
  }

  async delete(clientReportId: string) {
    this.deleteCalls.push(clientReportId);
    this.records.delete(clientReportId);
  }
}

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
    submittedAt: "2026-05-03T08:00:00.000Z",
    queuedAt: "2026-05-03T08:00:01.000Z",
    updatedAt: "2026-05-03T08:00:01.000Z",
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

describe("offline report queue store", () => {
  let adapter: FakeOfflineReportQueueAdapter;

  beforeEach(() => {
    adapter = new FakeOfflineReportQueueAdapter();
    __setOfflineReportQueueAdapterForTests(adapter);
  });

  afterEach(() => {
    __setOfflineReportQueueAdapterForTests(null);
  });

  it("persists queued reports with stable client ids", async () => {
    const item = queueItem({ clientReportId: "stable-client-id" });

    await addOfflineReport(item);

    expect(await listOfflineReports()).toEqual([item]);
    expect(adapter.records.get("stable-client-id")).toEqual(item);
  });

  it("updates one queued report without rewriting the whole queue", async () => {
    const unchanged = queueItem({ clientReportId: "unchanged-report" });
    const original = queueItem({ clientReportId: "report-to-update" });
    await addOfflineReport(unchanged);
    await addOfflineReport(original);
    adapter.putCalls = [];

    const updated = {
      ...original,
      syncStatus: "retry_wait" as const,
      attemptCount: 1,
      updatedAt: "2026-05-03T08:01:00.000Z",
    };
    await updateOfflineReport(updated);

    expect(adapter.putCalls).toEqual([updated]);
    expect(await listOfflineReports()).toEqual([unchanged, updated]);
  });

  it("keeps conflicted reports until explicitly removed", async () => {
    const conflicted = queueItem({
      clientReportId: "conflicted-report",
      syncStatus: "conflict",
      conflictReason: "Server has a newer reviewed report.",
      updatedAt: "2026-05-03T08:00:00.000Z",
    });
    await addOfflineReport(conflicted);

    await clearSyncedOfflineReports(new Date("2026-05-03T08:10:00.000Z"));

    expect(await listOfflineReports()).toEqual([conflicted]);

    await removeOfflineReport("conflicted-report");

    expect(await listOfflineReports()).toEqual([]);
  });

  it("ignores records with unsupported schema versions", async () => {
    const supported = queueItem({ clientReportId: "schema-v1-report" });
    adapter.records.set("schema-v1-report", supported);
    adapter.records.set("schema-v2-report", {
      clientReportId: "schema-v2-report",
      schemaVersion: 2,
    });

    expect(await listOfflineReports()).toEqual([supported]);
  });

  it("clears synced reports only after the confirmation retention window", async () => {
    const recentSynced = queueItem({
      clientReportId: "recent-synced-report",
      syncStatus: "synced",
      updatedAt: "2026-05-03T08:06:00.000Z",
    });
    const oldSynced = queueItem({
      clientReportId: "old-synced-report",
      syncStatus: "synced",
      updatedAt: "2026-05-03T08:00:00.000Z",
    });
    const queued = queueItem({ clientReportId: "queued-report" });
    await addOfflineReport(recentSynced);
    await addOfflineReport(oldSynced);
    await addOfflineReport(queued);

    await clearSyncedOfflineReports(new Date("2026-05-03T08:10:00.000Z"));

    expect(adapter.deleteCalls).toEqual(["old-synced-report"]);
    expect(await listOfflineReports()).toEqual([recentSynced, queued]);
  });
});
