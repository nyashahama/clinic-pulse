import type { OfflineSyncApiResult } from "@/lib/demo/offline-sync-types";
import type { OfflineReportQueueItem } from "@/lib/demo/types";

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds).toISOString();
}

function getResultErrorMessage(result: OfflineSyncApiResult) {
  return result.error?.message ?? result.error?.code ?? result.warning ?? result.result;
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
  const attemptCount = item.attemptCount + 1;

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
