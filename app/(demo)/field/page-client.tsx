"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FieldClinicList } from "@/components/demo/field-clinic-list";
import { OfflineQueue } from "@/components/demo/offline-queue";
import { ReportForm } from "@/components/demo/report-form";
import { SyncStatus } from "@/components/demo/sync-status";
import { SectionHeader } from "@/components/demo/section-header";
import { Button } from "@/components/ui/button";
import { ClinicPulseApiError } from "@/lib/demo/api-client";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  submitOnlineFieldReport,
  type OnlineFieldReportInput,
} from "@/lib/demo/field-report";
import {
  addOfflineReport,
  listOfflineReports,
  removeOfflineReport,
  updateOfflineReport,
} from "@/lib/demo/offline-queue-store";
import {
  applyOfflineSyncResult,
  isOfflineReportReadyForSync,
  markQueuedItemNetworkFailure,
  markQueuedItemSyncing,
} from "@/lib/demo/offline-sync";
import { getClinicRows } from "@/lib/demo/selectors";
import type { OfflineReportQueueItem } from "@/lib/demo/types";
import { createFieldReport, syncQueuedFieldReports } from "./actions";

const OFFLINE_SAVED_MESSAGE =
  "Report saved offline. It will retry when connectivity returns.";

function createClientReportId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getErrorStatus(error: unknown) {
  if (error instanceof ClinicPulseApiError) {
    return error.status;
  }

  if (error && typeof error === "object" && "status" in error) {
    const status = Number((error as { status: unknown }).status);
    return Number.isFinite(status) ? status : null;
  }

  return null;
}

function isReachabilityFailure(error: unknown) {
  const status = getErrorStatus(error);
  if (status !== null) {
    return status >= 500;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /fetch failed|failed to fetch|network|econnrefused|econnreset|enotfound|etimedout|request failed with 5\d\d/i.test(
    error.message,
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The request failed.";
}

async function persistOfflineReportUpdates(items: OfflineReportQueueItem[]) {
  const persisted: OfflineReportQueueItem[] = [];
  const failed: Array<{ item: OfflineReportQueueItem; error: unknown }> = [];

  for (const item of items) {
    try {
      await updateOfflineReport(item);
      persisted.push(item);
    } catch (error) {
      failed.push({ item, error });
    }
  }

  return { failed, persisted };
}

async function bestEffortRecoverSyncingReports(
  items: OfflineReportQueueItem[],
  message: string,
) {
  const now = new Date();

  for (const item of items) {
    try {
      await updateOfflineReport(markQueuedItemNetworkFailure(item, message, now));
    } catch {
      // If this write also fails, the next queue load will show the last persisted state.
    }
  }
}

function createOfflineReportQueueItem(
  clinicId: string,
  report: OnlineFieldReportInput,
  now = new Date(),
): OfflineReportQueueItem {
  const timestamp = now.toISOString();

  return {
    clientReportId: createClientReportId(),
    schemaVersion: 1,
    clinicId,
    status: report.status,
    reason: report.reason,
    staffPressure: report.staffPressure,
    stockPressure: report.stockPressure,
    queuePressure: report.queuePressure,
    notes: report.notes,
    submittedAt: timestamp,
    queuedAt: timestamp,
    updatedAt: timestamp,
    syncStatus: "queued",
    attemptCount: 0,
    nextRetryAt: null,
    lastAttemptAt: null,
    lastError: null,
    lastServerReportId: null,
    lastServerReviewState: null,
    conflictReason: null,
  };
}

export default function FieldPageClient() {
  const router = useRouter();
  const { state } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    clinics[0]?.id ?? null,
  );
  const [offlineReports, setOfflineReports] = useState<OfflineReportQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const syncInFlight = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadOfflineReports = useCallback(async () => {
    const reports = await listOfflineReports();
    setOfflineReports(reports);
    return reports;
  }, []);

  const selectedClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === selectedClinicId) ?? clinics[0] ?? null,
    [clinics, selectedClinicId],
  );

  const selectedName = selectedClinic?.name ?? "Select a clinic";
  const selectedId = selectedClinic?.id ?? "";

  const saveOfflineReport = useCallback(
    async (report: OnlineFieldReportInput) => {
      await addOfflineReport(createOfflineReportQueueItem(selectedId, report));
      await loadOfflineReports();
    },
    [loadOfflineReports, selectedId],
  );

  const syncQueuedReports = useCallback(
    async (options: { clientReportId?: string; manual?: boolean; assumeOnline?: boolean } = {}) => {
      if (syncInFlight.current || (!isOnline && !options.assumeOnline)) {
        return;
      }

      syncInFlight.current = true;
      setSyncing(true);

      try {
        const reports = await loadOfflineReports();
        const now = new Date();
        const selectedReports = reports.filter((item) => {
          if (options.clientReportId && item.clientReportId !== options.clientReportId) {
            return false;
          }

          return isOfflineReportReadyForSync(item, now, options.manual ?? false);
        });

        if (selectedReports.length === 0) {
          return;
        }

        const syncingReports = selectedReports.map((item) =>
          markQueuedItemSyncing(item, new Date()),
        );
        const syncingPersistence = await persistOfflineReportUpdates(syncingReports);
        if (syncingPersistence.failed.length > 0) {
          const message = `Local queue update failed before sync: ${getErrorMessage(syncingPersistence.failed[0]?.error)}.`;
          await bestEffortRecoverSyncingReports(syncingPersistence.persisted, message);
          await loadOfflineReports();
          return;
        }

        try {
          await loadOfflineReports();
        } catch (error) {
          const message = `Local queue read failed after marking reports syncing: ${getErrorMessage(error)}.`;
          await bestEffortRecoverSyncingReports(syncingReports, message);
          try {
            await loadOfflineReports();
          } catch {
            // The queue will refresh on the next successful IndexedDB read.
          }
          return;
        }

        try {
          const response = await syncQueuedFieldReports(syncingReports);
          const resultsByClientId = new Map(
            response.results.map((result) => [result.clientReportId, result]),
          );
          const updatedReports = syncingReports.map((item) => {
            const result = resultsByClientId.get(item.clientReportId);

            if (!result) {
              const updatedAt = new Date().toISOString();
              return {
                ...item,
                syncStatus: "failed" as const,
                updatedAt,
                nextRetryAt: null,
                lastError: "Offline sync did not return a result for this report.",
                conflictReason: null,
              };
            }

            return applyOfflineSyncResult(item, result, new Date());
          });

          const resultPersistence = await persistOfflineReportUpdates(updatedReports);
          if (resultPersistence.failed.length > 0) {
            const message = `Local queue persistence failed after sync: ${getErrorMessage(resultPersistence.failed[0]?.error)}.`;
            await bestEffortRecoverSyncingReports(
              resultPersistence.failed.map(({ item }) => item),
              message,
            );
          }

          await loadOfflineReports();

          if (updatedReports.some((item) => item.syncStatus === "synced")) {
            router.refresh();
          }
        } catch (error) {
          const nowAfterFailure = new Date();
          const message = getErrorMessage(error);
          const updatedReports = isReachabilityFailure(error)
            ? syncingReports.map((item) =>
                markQueuedItemNetworkFailure(item, message, nowAfterFailure),
              )
            : syncingReports.map((item) => ({
                ...item,
                syncStatus: "failed" as const,
                updatedAt: nowAfterFailure.toISOString(),
                nextRetryAt: null,
                lastError: message,
                conflictReason: null,
              }));

          const failurePersistence = await persistOfflineReportUpdates(updatedReports);
          if (failurePersistence.failed.length > 0) {
            const message = `Local queue persistence failed after sync error: ${getErrorMessage(failurePersistence.failed[0]?.error)}.`;
            await bestEffortRecoverSyncingReports(
              failurePersistence.failed.map(({ item }) => item),
              message,
            );
          }

          await loadOfflineReports();
        }
      } finally {
        syncInFlight.current = false;
        setSyncing(false);
      }
    },
    [isOnline, loadOfflineReports, router],
  );
  const lastSyncedAt = useMemo(
    () =>
      offlineReports
        .filter((item) => item.syncStatus === "synced")
        .map((item) => item.updatedAt)
        .sort()
        .at(-1) ?? state.lastSyncAt,
    [offlineReports, state.lastSyncAt],
  );

  useEffect(() => {
    let isMounted = true;

    void listOfflineReports().then((reports) => {
      if (isMounted) {
        setOfflineReports(reports);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => {
      setIsOnline(true);
      void syncQueuedReports({ assumeOnline: true });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueuedReports]);

  const handleToggleOnline = () => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);

    if (nextOnline) {
      void syncQueuedReports({ assumeOnline: true });
    }
  };

  const handleSubmit = async (report: OnlineFieldReportInput) => {
    if (submitInFlight.current) {
      return false;
    }

    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);

    if (!selectedId) {
      submitInFlight.current = false;
      setSubmitting(false);
      return false;
    }

    try {
      if (isOnline) {
        try {
          await submitOnlineFieldReport({
            clinicId: selectedId,
            refresh: () => router.refresh(),
            report,
            submitReport: createFieldReport,
          });
        } catch (error) {
          if (!isReachabilityFailure(error)) {
            throw error;
          }

          await saveOfflineReport(report);
          setSubmitError(OFFLINE_SAVED_MESSAGE);
        }

        return true;
      }

      await saveOfflineReport(report);
      return true;
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Online report submission failed. Try again when the API is reachable.",
      );
      return false;
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleRemoveReport = async (clientReportId: string) => {
    await removeOfflineReport(clientReportId);
    await loadOfflineReports();
  };

  return (
    <div className="grid gap-4 pb-4">
      <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Field worker"
          title="Mobile reporting flow"
          description="Submit a clinic update from offline or online mode. Queued items merge into district state when back online."
        />
        <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-content-subtle">
            Clinic status stream is currently {isOnline ? "online" : "offline"}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleOnline}
            className="w-full sm:w-auto"
          >
            {isOnline ? "Set offline mode" : "Set online mode"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <FieldClinicList
          clinics={clinics}
          selectedClinicId={selectedId}
          onSelectClinic={setSelectedClinicId}
        />
        <ReportForm
          clinicId={selectedId}
          clinicName={selectedName}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
        {submitError ? (
          <p className="xl:col-start-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OfflineQueue
          queue={offlineReports}
          clinics={clinics}
          canSync={isOnline}
          syncing={syncing}
          onSync={() => void syncQueuedReports()}
          onRetryItem={(clientReportId) =>
            void syncQueuedReports({ clientReportId, manual: true })
          }
          onRemoveItem={(clientReportId) => void handleRemoveReport(clientReportId)}
        />

        <SyncStatus
          isOnline={isOnline}
          queuedReports={offlineReports.length}
          lastSyncedAt={lastSyncedAt}
          onToggleOnline={handleToggleOnline}
          canRetry={offlineReports.length > 0}
          onRetry={
            offlineReports.length > 0
              ? () => void syncQueuedReports({ manual: true })
              : undefined
          }
        />
      </div>

      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Field to district"
          title="What happens next"
          description="Online submissions go straight to district state; offline submissions land in queue."
        />
        <div className="mt-3 grid gap-2 text-sm">
          <p className="text-content-subtle">
            1) Pick a clinic from your assigned list.
          </p>
          <p className="text-content-subtle">
            2) Complete status, staffing, stock, queue, and notes.
          </p>
          <p className="text-content-subtle">
            3) In offline mode, report stays queued and is sent to district when you press sync.
          </p>
          <p className="text-content-subtle">
            4) Open{" "}
            <Link href="/demo" className="text-primary underline underline-offset-4">
              /demo
            </Link>{" "}
            to verify the report stream updates in the operations screen.
          </p>
        </div>
      </section>
    </div>
  );
}
