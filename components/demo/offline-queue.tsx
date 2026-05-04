"use client";

import { AlertCircle, RefreshCw, RotateCcw, Trash2, Wifi, WifiOff } from "lucide-react";

import { EmptyState } from "@/components/demo/empty-state";
import { SectionHeader } from "@/components/demo/section-header";
import { Button } from "@/components/ui/button";
import type {
  ClinicRow,
  OfflineReportQueueItem,
  OfflineReportQueueStatus,
} from "@/lib/demo/types";
import { countWaitingOfflineReports } from "@/lib/demo/offline-sync";

type OfflineQueueProps = {
  queue: OfflineReportQueueItem[];
  clinics: ClinicRow[];
  canSync: boolean;
  syncing: boolean;
  onSync: () => void;
  onRetryItem: (clientReportId: string) => void;
  onRemoveItem: (clientReportId: string) => void;
};

const RETRYABLE_STATUSES = new Set<OfflineReportQueueStatus>([
  "queued",
  "retry_wait",
  "failed",
  "conflict",
]);

const REMOVABLE_STATUSES = new Set<OfflineReportQueueStatus>([
  "synced",
  "failed",
  "conflict",
]);

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getClinicName(clinics: ClinicRow[], clinicId: string) {
  return clinics.find((clinic) => clinic.id === clinicId)?.name ?? clinicId;
}

export function OfflineQueue({
  queue,
  clinics,
  canSync,
  syncing,
  onSync,
  onRetryItem,
  onRemoveItem,
}: OfflineQueueProps) {
  const waitingReportCount = countWaitingOfflineReports(queue);

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Offline queue"
        title="Queued reports"
        description="Reports saved offline wait to sync until connectivity returns."
        actions={
          <Button
            variant={canSync ? "default" : "outline"}
            size="sm"
            onClick={onSync}
            disabled={waitingReportCount === 0 || !canSync || syncing}
            className="inline-flex"
          >
            {syncing ? "Syncing…" : "Sync queued"}
            <RefreshCw className="size-3.5" />
          </Button>
        }
      />

      {queue.length === 0 ? (
        <EmptyState surface="offline-queue" className="mt-4 min-h-40" />
      ) : (
        <div className="mt-4 divide-y divide-border-subtle rounded-md border border-border-subtle">
          {queue.map((item) => (
            <div
              key={item.clientReportId}
              className="grid gap-3 bg-bg-subtle p-3 text-sm text-content-emphasis sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{getClinicName(clinics, item.clinicId)}</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                    <WifiOff className="size-3" />
                    {item.syncStatus}
                  </span>
                  <span className="text-xs text-content-subtle">
                    Attempts: {item.attemptCount}
                  </span>
                </div>

                <div className="mt-2 grid gap-1 break-words text-xs text-content-subtle">
                  <p>
                    Submitted {formatTime(item.submittedAt)}; queued{" "}
                    {formatTime(item.queuedAt)}
                  </p>
                  {item.nextRetryAt ? (
                    <p>Next retry: {formatTime(item.nextRetryAt)}</p>
                  ) : null}
                  {item.lastError ? <p>Last error: {item.lastError}</p> : null}
                  {item.conflictReason ? (
                    <p>Conflict: {item.conflictReason}</p>
                  ) : null}
                  {item.lastServerReportId ? (
                    <p>Server report: #{item.lastServerReportId}</p>
                  ) : null}
                </div>

                {item.notes.trim() ? (
                  <p className="mt-2 break-words text-sm leading-6">{item.notes}</p>
                ) : null}
              </div>

              <div className="flex items-start gap-2 sm:justify-end">
                {RETRYABLE_STATUSES.has(item.syncStatus) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetryItem(item.clientReportId)}
                    disabled={!canSync || syncing}
                    aria-label="Retry report sync"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                ) : null}
                {REMOVABLE_STATUSES.has(item.syncStatus) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveItem(item.clientReportId)}
                    disabled={syncing}
                    aria-label="Remove report from queue"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-md border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-content-subtle">
          {canSync ? <Wifi className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-amber-600" />}
          {canSync ? "Connectivity restored" : "Offline mode active"}
        </span>
        <span className="text-content-subtle">{waitingReportCount} waiting</span>
      </div>
    </section>
  );
}
