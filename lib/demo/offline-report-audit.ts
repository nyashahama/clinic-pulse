import type { OfflineReportQueueItem } from "@/lib/demo/types";
import type { FieldVisitTone } from "@/lib/demo/field-visit-cockpit";

export type OfflineReportAuditEvent = {
  id: "submitted" | "queued" | "sync-attempt" | "retry" | "synced" | "status";
  label: string;
  detail: string;
  timestamp: string;
  tone: FieldVisitTone;
};

function buildStatusEvent(item: OfflineReportQueueItem): OfflineReportAuditEvent {
  if (item.syncStatus === "syncing") {
    return {
      id: "status",
      label: "Sync in progress",
      detail: "ClinicPulse is receiving this report now.",
      timestamp: item.updatedAt,
      tone: "info",
    };
  }

  if (item.syncStatus === "failed") {
    return {
      id: "status",
      label: "Needs manual retry",
      detail: item.lastError
        ? `Sync is blocked: ${item.lastError}`
        : "Sync is blocked until the field worker retries this report.",
      timestamp: item.updatedAt,
      tone: "blocked",
    };
  }

  if (item.syncStatus === "conflict") {
    return {
      id: "status",
      label: "Needs district review",
      detail:
        item.conflictReason ??
        "ClinicPulse found a conflict while syncing this device report.",
      timestamp: item.updatedAt,
      tone: "blocked",
    };
  }

  return {
    id: "status",
    label: "Waiting to sync",
    detail: "The report will sync when ClinicPulse can be reached.",
    timestamp: item.updatedAt,
    tone: "attention",
  };
}

function buildSyncedEvent(item: OfflineReportQueueItem): OfflineReportAuditEvent {
  const serverReportLabel = item.lastServerReportId
    ? `server report #${item.lastServerReportId}`
    : "a server report";
  const reviewStateLabel = item.lastServerReviewState
    ? ` as ${item.lastServerReviewState}`
    : "";

  return {
    id: "synced",
    label: "Sent for district review",
    detail: `ClinicPulse accepted ${serverReportLabel}${reviewStateLabel}.`,
    timestamp: item.updatedAt,
    tone: "clear",
  };
}

export function buildOfflineReportAuditTrail(
  item: OfflineReportQueueItem,
): OfflineReportAuditEvent[] {
  const events: OfflineReportAuditEvent[] = [
    {
      id: "submitted",
      label: "Field report captured",
      detail: "The field worker completed the report on this device.",
      timestamp: item.submittedAt,
      tone: "clear",
    },
    {
      id: "queued",
      label: "Saved on this device",
      detail: "ClinicPulse has not accepted this report yet.",
      timestamp: item.queuedAt,
      tone: item.syncStatus === "synced" ? "clear" : "attention",
    },
  ];

  if (item.syncStatus === "synced") {
    return [...events, buildSyncedEvent(item)];
  }

  if (item.lastAttemptAt && item.attemptCount > 0) {
    events.push({
      id: "sync-attempt",
      label: item.lastError ? "Sync attempt failed" : "Sync attempted",
      detail: item.lastError
        ? `Attempt ${item.attemptCount} failed: ${item.lastError}`
        : `Attempt ${item.attemptCount} reached ClinicPulse.`,
      timestamp: item.lastAttemptAt,
      tone: item.lastError ? "blocked" : "info",
    });
  }

  if (item.syncStatus === "retry_wait" && item.nextRetryAt) {
    events.push({
      id: "retry",
      label: "Retry scheduled",
      detail: "ClinicPulse will retry this device report.",
      timestamp: item.nextRetryAt,
      tone: "attention",
    });
    return events;
  }

  return [...events, buildStatusEvent(item)];
}
