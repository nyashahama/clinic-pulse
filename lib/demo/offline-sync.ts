import type { OfflineSyncApiResult } from "@/lib/demo/offline-sync-types";
import type { OfflineReportQueueItem, OfflineReportQueueStatus } from "@/lib/demo/types";

const MANUAL_RETRY_STATUSES = new Set<OfflineReportQueueStatus>([
  "queued",
  "retry_wait",
  "failed",
  "conflict",
]);
const OPEN_DUPLICATE_STATUSES = new Set<OfflineReportQueueStatus>([
  "queued",
  "syncing",
  "retry_wait",
  "failed",
  "conflict",
]);
const STALE_SYNCING_RECOVERY_MS = 2 * 60 * 1000;
const INTERRUPTED_SYNC_ERROR =
  "Previous offline sync was interrupted before completion.";

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds).toISOString();
}

function getResultErrorMessage(result: OfflineSyncApiResult) {
  return result.error?.message ?? result.error?.code ?? result.warning ?? result.result;
}

function normalizedText(value: string) {
  return value.trim();
}

function sameOfflineReportPayload(
  left: OfflineReportQueueItem,
  right: OfflineReportQueueItem,
) {
  return (
    left.clinicId === right.clinicId &&
    left.status === right.status &&
    normalizedText(left.reason) === normalizedText(right.reason) &&
    left.staffPressure === right.staffPressure &&
    left.stockPressure === right.stockPressure &&
    left.queuePressure === right.queuePressure &&
    normalizedText(left.notes) === normalizedText(right.notes)
  );
}

export function findMatchingOpenOfflineReport(
  items: OfflineReportQueueItem[],
  candidate: OfflineReportQueueItem,
) {
  return (
    items.find(
      (item) =>
        OPEN_DUPLICATE_STATUSES.has(item.syncStatus) &&
        sameOfflineReportPayload(item, candidate),
    ) ?? null
  );
}

export function getNextRetryAt(attemptCount: number, now: Date): string | null {
  if (attemptCount <= 0) {
    return null;
  }

  if (attemptCount === 1) {
    return now.toISOString();
  }

  if (attemptCount === 2) {
    return addMilliseconds(now, 30 * 1000);
  }

  if (attemptCount === 3) {
    return addMilliseconds(now, 2 * 60 * 1000);
  }

  return addMilliseconds(now, 5 * 60 * 1000);
}

export function isOfflineReportReadyForSync(
  item: OfflineReportQueueItem,
  now: Date,
  manualRetry = false,
) {
  if (manualRetry) {
    return MANUAL_RETRY_STATUSES.has(item.syncStatus);
  }

  if (item.syncStatus === "queued") {
    return true;
  }

  return (
    item.syncStatus === "retry_wait" &&
    item.nextRetryAt !== null &&
    Date.parse(item.nextRetryAt) <= now.getTime()
  );
}

export function markQueuedItemSyncing(
  item: OfflineReportQueueItem,
  now: Date,
): OfflineReportQueueItem {
  return {
    ...item,
    syncStatus: "syncing",
    attemptCount: item.attemptCount + 1,
    nextRetryAt: null,
    lastAttemptAt: now.toISOString(),
    lastError: null,
    updatedAt: now.toISOString(),
  };
}

export function applyOfflineSyncResult(
  item: OfflineReportQueueItem,
  result: OfflineSyncApiResult,
  now: Date,
): OfflineReportQueueItem {
  const updatedAt = now.toISOString();

  if (result.clientReportId !== item.clientReportId) {
    return {
      ...item,
      syncStatus: "failed",
      updatedAt,
      nextRetryAt: null,
      lastError: `Offline sync result client id mismatch: expected ${item.clientReportId}, received ${result.clientReportId}.`,
      lastServerReportId: null,
      lastServerReviewState: null,
      conflictReason: null,
    };
  }

  if (result.result === "created" || result.result === "duplicate") {
    return {
      ...item,
      syncStatus: "synced",
      updatedAt,
      nextRetryAt: null,
      lastError: null,
      lastServerReportId: result.report?.id ?? item.lastServerReportId,
      lastServerReviewState:
        result.report?.reviewState ?? item.lastServerReviewState,
      conflictReason: null,
    };
  }

  if (result.result === "conflict") {
    const message = getResultErrorMessage(result);

    return {
      ...item,
      syncStatus: "conflict",
      updatedAt,
      nextRetryAt: null,
      lastError: message,
      conflictReason: message,
    };
  }

  return {
    ...item,
    syncStatus: "failed",
    updatedAt,
    nextRetryAt: null,
    lastError: getResultErrorMessage(result),
    conflictReason: null,
  };
}

export function markQueuedItemNetworkFailure(
  item: OfflineReportQueueItem,
  message: string,
  now: Date,
): OfflineReportQueueItem {
  const attemptCount = item.attemptCount > 0 ? item.attemptCount : 1;

  return {
    ...item,
    syncStatus: "retry_wait",
    attemptCount,
    updatedAt: now.toISOString(),
    lastAttemptAt: now.toISOString(),
    nextRetryAt: getNextRetryAt(attemptCount, now),
    lastError: message,
  };
}

export function recoverStaleSyncingItem(
  item: OfflineReportQueueItem,
  now: Date,
): OfflineReportQueueItem {
  if (item.syncStatus !== "syncing") {
    return item;
  }

  const lastAttemptMs =
    item.lastAttemptAt === null ? Number.NaN : Date.parse(item.lastAttemptAt);
  const shouldRecover =
    Number.isNaN(lastAttemptMs) ||
    now.getTime() - lastAttemptMs >= STALE_SYNCING_RECOVERY_MS;

  if (!shouldRecover) {
    return item;
  }

  return {
    ...item,
    syncStatus: "retry_wait",
    nextRetryAt: getNextRetryAt(item.attemptCount, now),
    lastAttemptAt: Number.isNaN(lastAttemptMs) ? null : item.lastAttemptAt,
    lastError: INTERRUPTED_SYNC_ERROR,
    updatedAt: now.toISOString(),
  };
}

export function recoverStaleSyncingReports(
  items: OfflineReportQueueItem[],
  now: Date,
): OfflineReportQueueItem[] {
  return items.map((item) => recoverStaleSyncingItem(item, now));
}
