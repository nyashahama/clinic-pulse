"use client";

import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

import { EmptyState } from "@/components/demo/empty-state";
import { SectionHeader } from "@/components/demo/section-header";
import { Button } from "@/components/ui/button";
import type { ClinicRow, QueuedOfflineReport } from "@/lib/demo/types";

type OfflineQueueProps = {
  queue: QueuedOfflineReport[];
  clinics: ClinicRow[];
  canSync: boolean;
  syncing: boolean;
  onSync: () => void;
};

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
}: OfflineQueueProps) {
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
            disabled={queue.length === 0 || !canSync || syncing}
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
        <div className="mt-4 space-y-2">
          {queue.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-border-subtle bg-bg-subtle p-3 text-sm text-content-emphasis"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{getClinicName(clinics, item.clinicId)}</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                  <span className="relative flex size-3">
                    <WifiOff className="size-3" />
                  </span>
                  {item.syncStatus}
                </span>
              </div>

              <p className="mt-2 text-xs text-content-subtle">
                Queued by {item.reporterName} at {formatTime(item.queuedAt)}
              </p>
              <p className="mt-2 text-sm leading-6">{item.notes}</p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-md border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-content-subtle">
          {canSync ? <Wifi className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-amber-600" />}
          {canSync ? "Connectivity restored" : "Offline mode active"}
        </span>
        <span className="text-content-subtle">{queue.length} queued</span>
      </div>
    </section>
  );
}
