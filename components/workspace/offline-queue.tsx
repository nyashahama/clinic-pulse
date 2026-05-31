"use client";

import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";

import { EmptyState } from "@/components/workspace/empty-state";
import { SectionHeader } from "@/components/workspace/section-header";
import { Button } from "@/components/ui/button";
import { getOfflineReportStatusLabel } from "@/lib/workspace/field-visit-cockpit";
import { buildOfflineReportAuditTrail } from "@/lib/workspace/offline-report-audit";
import type {
  ClinicRow,
  OfflineReportQueueItem,
  OfflineReportQueueStatus,
} from "@/lib/workspace/types";
import { countWaitingOfflineReports } from "@/lib/workspace/offline-sync";
import { cn } from "@/lib/utils";

type OfflineQueueProps = {
  queue: OfflineReportQueueItem[];
  clinics: ClinicRow[];
  canSync: boolean;
  syncing: boolean;
  onEditItem: (item: OfflineReportQueueItem) => void;
  onSync: () => void;
  onRetryItem: (clientReportId: string) => void;
  onRemoveItem: (clientReportId: string) => void;
};

const EDITABLE_STATUSES = new Set<OfflineReportQueueStatus>([
  "queued",
  "retry_wait",
  "failed",
  "conflict",
]);

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

const VISIT_PROOF_TONE_CLASS = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100",
  blocked:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100",
} as const;

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
  onEditItem,
  onSync,
  onRetryItem,
  onRemoveItem,
}: OfflineQueueProps) {
  const waitingReportCount = countWaitingOfflineReports(queue);

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Device queue"
        title="Saved on this device"
        description="Reports stay visible here until ClinicPulse accepts them for district review."
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
          {queue.map((item) => {
            const status = getOfflineReportStatusLabel(item.syncStatus);
            const auditTrail = buildOfflineReportAuditTrail(item);

            return (
              <div
                key={item.clientReportId}
                className="grid gap-3 bg-bg-subtle p-3 text-sm text-content-emphasis sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{getClinicName(clinics, item.clinicId)}</p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium",
                        status.tone === "clear" &&
                          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-100",
                        status.tone === "attention" &&
                          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100",
                        status.tone === "blocked" &&
                          "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100",
                        status.tone === "info" &&
                          "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100",
                      )}
                    >
                      <WifiOff className="size-3" />
                      {status.label}
                    </span>
                    <span className="text-xs text-content-subtle">
                      Attempts: {item.attemptCount}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-content-subtle">
                    {status.detail}
                  </p>

                  <div
                    className="mt-3 space-y-2 border-l border-border-subtle pl-3 text-xs"
                    aria-label={`Device audit trail for ${getClinicName(
                      clinics,
                      item.clinicId,
                    )}`}
                  >
                    <p className="font-semibold uppercase tracking-normal text-content-subtle">
                      Device audit trail
                    </p>
                    {auditTrail.map((event) => (
                      <div key={event.id} className="grid gap-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              event.tone === "clear" && "bg-emerald-500",
                              event.tone === "attention" && "bg-amber-500",
                              event.tone === "blocked" && "bg-red-500",
                              event.tone === "info" && "bg-sky-500",
                            )}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-content-emphasis">
                            {event.label}
                          </span>
                          <span className="text-content-subtle">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        <p className="break-words pl-4 leading-5 text-content-subtle">
                          {event.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  {item.notes.trim() ? (
                    <p className="mt-2 break-words text-sm leading-6">{item.notes}</p>
                  ) : null}

                  {item.visitVerification ? (
                    <div
                      className={cn(
                        "mt-3 rounded-lg border p-3 text-xs",
                        VISIT_PROOF_TONE_CLASS[item.visitVerification.tone],
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold uppercase tracking-normal">
                          Visit proof
                        </p>
                        <span>{item.visitVerification.accuracyLabel}</span>
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1 font-semibold">
                        {item.visitVerification.tone === "blocked" ? (
                          <AlertCircle className="size-3.5" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {item.visitVerification.statusLabel}
                      </p>
                      <p className="mt-1">
                        {item.visitVerification.distanceLabel} from{" "}
                        {getClinicName(clinics, item.clinicId)}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {item.visitVerification.coordinateLabel}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start gap-2 sm:justify-end">
                  {EDITABLE_STATUSES.has(item.syncStatus) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditItem(item)}
                      disabled={syncing}
                      aria-label="Edit saved report"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
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
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-md border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-content-subtle">
          {canSync ? <Wifi className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-amber-600" />}
          {canSync ? "ClinicPulse reachable" : "Saved-device mode active"}
        </span>
        <span className="text-content-subtle">{waitingReportCount} saved</span>
      </div>
    </section>
  );
}
