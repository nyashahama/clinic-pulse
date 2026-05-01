"use client";

import { AlertTriangle, RefreshCw, Signal, Wifi, WifiOff } from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import { Button } from "@/components/ui/button";

type SyncStatusProps = {
  isOnline: boolean;
  queuedReports: number;
  lastSyncedAt: string | null;
  onToggleOnline: () => void;
  onRetry?: () => void;
  canRetry: boolean;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function SyncStatus({
  isOnline,
  queuedReports,
  lastSyncedAt,
  onToggleOnline,
  onRetry,
  canRetry,
}: SyncStatusProps) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Sync status"
        title="Connectivity"
        description="Toggle connectivity to demo how offline queueing works."
      />

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            Network state
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm">
              {isOnline ? (
                <>
                  <Wifi className="size-4 text-emerald-600" />
                  <span className="font-medium text-content-emphasis">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="size-4 text-amber-600" />
                  <span className="font-medium text-content-emphasis">Offline</span>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleOnline}
              className="inline-flex"
            >
              <Signal className="size-3.5" />
              {isOnline ? "Go offline" : "Go online"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            Offline queue
          </p>
          <p className="mt-1 text-content-emphasis">
            {queuedReports} report{queuedReports === 1 ? "" : "s"} waiting to sync.
          </p>
          <p className="mt-1 text-xs text-content-subtle">
            Last synced: {lastSyncedAt ? formatTime(lastSyncedAt) : "Not synced yet"}
          </p>
        </div>

        {!isOnline && canRetry ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="inline-flex items-center gap-1 font-medium">
              <AlertTriangle className="size-3.5" />
              Retry action required after returning online
            </p>
            {onRetry ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2 inline-flex"
              >
                <RefreshCw className="size-3.5" />
                Retry queue sync
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
