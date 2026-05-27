"use client";

import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FieldClinicList } from "@/components/demo/field-clinic-list";
import { FieldLocationVerificationPanel } from "@/components/demo/field-location-verification";
import { FieldReportHandoff } from "@/components/demo/field-report-handoff";
import { FieldTaskQueue } from "@/components/demo/field-task-queue";
import { OfflineQueue } from "@/components/demo/offline-queue";
import { type FieldReportFeedback } from "@/components/demo/report-feedback";
import { ReportForm } from "@/components/demo/report-form";
import { SyncStatus } from "@/components/demo/sync-status";
import { SectionHeader } from "@/components/demo/section-header";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ClientAuthSession } from "@/lib/auth/api";
import { ClinicPulseApiError } from "@/lib/demo/api-client";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  submitOnlineFieldReport,
  type OnlineFieldReportInput,
} from "@/lib/demo/field-report";
import type { FieldLocationVerification } from "@/lib/demo/field-location-verification";
import { buildFieldReportHandoffItems } from "@/lib/demo/field-report-handoff";
import {
  buildFieldVisitCockpitViewModel,
  getDefaultFieldVisitClinicId,
} from "@/lib/demo/field-visit-cockpit";
import {
  addOfflineReport,
  listActiveOfflineReports,
  removeOfflineReport,
  updateOfflineReport,
} from "@/lib/demo/offline-queue-store";
import {
  applyOfflineSyncResult,
  countWaitingOfflineReports,
  findMatchingOpenOfflineReport,
  isOfflineReportReadyForSync,
  markQueuedItemNetworkFailure,
  markQueuedItemSyncing,
  recoverStaleSyncingReports,
} from "@/lib/demo/offline-sync";
import { getClinicRows, getRecentReportStream } from "@/lib/demo/selectors";
import type { OfflineReportQueueItem } from "@/lib/demo/types";
import { createFieldReport, syncQueuedFieldReports } from "./actions";

const OFFLINE_SAVED_MESSAGE =
  "Report saved offline. It will retry when connectivity returns.";
const OFFLINE_DUPLICATE_MESSAGE =
  "A matching report is already in the device queue.";
const ONLINE_DUPLICATE_MESSAGE =
  "A matching report was submitted recently or is already waiting for district review.";

function subscribeToOnlineStatus(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

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

async function loadRecoverableOfflineReports(now = new Date()) {
  const reports = await listActiveOfflineReports(now);
  const recoveredReports = recoverStaleSyncingReports(reports, now);
  const recoveredItems = recoveredReports.filter((item, index) => item !== reports[index]);

  if (recoveredItems.length > 0) {
    await persistOfflineReportUpdates(recoveredItems);
  }

  return recoveredReports;
}

function createOfflineReportQueueItem(
  clinicId: string,
  report: OnlineFieldReportInput,
  visitVerification: FieldLocationVerification | null,
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
    visitVerification,
  };
}

type FieldPageClientProps = {
  session: ClientAuthSession;
};

export default function FieldPageClient({ session }: FieldPageClientProps) {
  const router = useRouter();
  const { state } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
  const recentReports = useMemo(
    () =>
      buildFieldReportHandoffItems({
        clinics,
        reports: getRecentReportStream(state),
      }),
    [clinics, state],
  );
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [offlineReports, setOfflineReports] = useState<OfflineReportQueueItem[]>([]);
  const browserIsOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
  const [onlineOverride, setOnlineOverride] = useState<boolean | null>(null);
  const isOnline = onlineOverride ?? browserIsOnline;
  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const syncInFlight = useRef(false);
  const [submitFeedback, setSubmitFeedback] = useState<FieldReportFeedback | null>(null);
  const [visitVerification, setVisitVerification] = useState<{
    clinicId: string;
    verification: FieldLocationVerification;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [editingOfflineReportId, setEditingOfflineReportId] = useState<string | null>(
    null,
  );

  const loadOfflineReports = useCallback(async () => {
    const reports = await loadRecoverableOfflineReports();
    setOfflineReports(reports);
    return reports;
  }, []);

  const defaultClinicId = useMemo(
    () => getDefaultFieldVisitClinicId({ clinics, offlineReports }),
    [clinics, offlineReports],
  );
  const activeClinicId = selectedClinicId ?? defaultClinicId;
  const selectedClinic = useMemo(
    () =>
      clinics.find((clinic) => clinic.id === activeClinicId) ?? clinics[0] ?? null,
    [activeClinicId, clinics],
  );

  const selectedName = selectedClinic?.name ?? "Select a clinic";
  const selectedId = selectedClinic?.id ?? activeClinicId ?? "";
  const selectedVisitVerification =
    visitVerification?.clinicId === selectedId ? visitVerification.verification : null;
  const editingOfflineReport = useMemo(
    () =>
      offlineReports.find((item) => item.clientReportId === editingOfflineReportId) ??
      null,
    [editingOfflineReportId, offlineReports],
  );

  const showSubmitFeedback = useCallback((feedback: FieldReportFeedback) => {
    setSubmitFeedback(feedback);
  }, []);

  const saveOfflineReport = useCallback(
    async (
      report: OnlineFieldReportInput,
      verification: FieldLocationVerification | null,
    ) => {
      const item = createOfflineReportQueueItem(selectedId, report, verification);
      const reports = await loadOfflineReports();
      const existing = findMatchingOpenOfflineReport(reports, item);
      if (existing) {
        return { item: existing, duplicate: true };
      }

      await addOfflineReport(item);
      await loadOfflineReports();
      return { item, duplicate: false };
    },
    [loadOfflineReports, selectedId],
  );

  const updateSavedOfflineReport = useCallback(
    async (
      item: OfflineReportQueueItem,
      report: OnlineFieldReportInput,
      verification: FieldLocationVerification | null,
    ) => {
      const timestamp = new Date().toISOString();
      const updatedItem: OfflineReportQueueItem = {
        ...item,
        status: report.status,
        reason: report.reason,
        staffPressure: report.staffPressure,
        stockPressure: report.stockPressure,
        queuePressure: report.queuePressure,
        notes: report.notes,
        submittedAt: timestamp,
        updatedAt: timestamp,
        syncStatus: "queued",
        attemptCount: 0,
        nextRetryAt: null,
        lastAttemptAt: null,
        lastError: null,
        lastServerReportId: null,
        lastServerReviewState: null,
        conflictReason: null,
        visitVerification: verification,
      };

      await updateOfflineReport(updatedItem);
      await loadOfflineReports();
      return updatedItem;
    },
    [loadOfflineReports],
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
  const waitingOfflineReportCount = useMemo(
    () => countWaitingOfflineReports(offlineReports),
    [offlineReports],
  );
  const fieldCockpit = useMemo(
    () =>
      buildFieldVisitCockpitViewModel({
        clinics,
        selectedClinicId: activeClinicId,
        offlineReports,
        isOnline,
        lastSyncedAt,
        selectedVisitVerification,
      }),
    [
      clinics,
      activeClinicId,
      offlineReports,
      isOnline,
      lastSyncedAt,
      selectedVisitVerification,
    ],
  );
  const handleJumpToReport = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const target = document.getElementById("submit-report");
    if (!target) {
      return;
    }

    target.scrollIntoView({ block: "start" });
    window.history.replaceState(null, "", "#submit-report");
  }, []);
  const handleJumpToItinerary = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const target = document.getElementById("field-itinerary");
      if (!target) {
        return;
      }

      target.scrollIntoView({ block: "start" });
      window.history.replaceState(null, "", "#field-itinerary");
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    void loadRecoverableOfflineReports().then((reports) => {
      if (isMounted) {
        setOfflineReports(reports);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (browserIsOnline) {
      void syncQueuedReports({ assumeOnline: true });
    }
  }, [browserIsOnline, syncQueuedReports]);

  const handleToggleOnline = () => {
    const nextOnline = !isOnline;
    setOnlineOverride(nextOnline);

    if (nextOnline) {
      void syncQueuedReports({ assumeOnline: true });
    }
  };

  const handleToggleOnlineFromCockpit = () => {
    handleToggleOnline();

    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  };

  const handleSubmit = async (report: OnlineFieldReportInput) => {
    if (submitInFlight.current) {
      return false;
    }

    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitFeedback(null);

    if (!selectedId) {
      submitInFlight.current = false;
      setSubmitting(false);
      return false;
    }

    try {
      if (editingOfflineReport && !isOnline) {
        await updateSavedOfflineReport(
          editingOfflineReport,
          report,
          selectedVisitVerification,
        );
        setEditingOfflineReportId(null);
        showSubmitFeedback({
          tone: "info",
          title: "Saved report updated",
          message: OFFLINE_SAVED_MESSAGE,
          detail: selectedName,
        });
        return true;
      }

      if (isOnline) {
        try {
          const result = await submitOnlineFieldReport({
            clinicId: selectedId,
            refresh: () => router.refresh(),
            report,
            submitReport: createFieldReport,
            visitVerification: selectedVisitVerification,
          });
          if (result.created) {
            if (editingOfflineReport) {
              await removeOfflineReport(editingOfflineReport.clientReportId);
              await loadOfflineReports();
              setEditingOfflineReportId(null);
            }
            showSubmitFeedback({
              tone: "success",
              title: "Report sent to review",
              message: "Waiting for district review.",
              detail: selectedName,
            });
          } else {
            showSubmitFeedback({
              tone: "warning",
              title: "Already in review",
              message: ONLINE_DUPLICATE_MESSAGE,
              detail: selectedName,
            });
            if (editingOfflineReport) {
              return false;
            }
          }
        } catch (error) {
          if (!isReachabilityFailure(error)) {
            throw error;
          }

          if (editingOfflineReport) {
            await updateSavedOfflineReport(
              editingOfflineReport,
              report,
              selectedVisitVerification,
            );
            setEditingOfflineReportId(null);
            showSubmitFeedback({
              tone: "info",
              title: "Saved report updated",
              message: OFFLINE_SAVED_MESSAGE,
              detail: selectedName,
            });
            return true;
          }

          const saved = await saveOfflineReport(report, selectedVisitVerification);
          showSubmitFeedback({
            tone: saved.duplicate ? "warning" : "info",
            title: saved.duplicate ? "Already queued" : "Saved to device",
            message: saved.duplicate ? OFFLINE_DUPLICATE_MESSAGE : OFFLINE_SAVED_MESSAGE,
            detail: selectedName,
          });
        }

        return true;
      }

      const saved = await saveOfflineReport(report, selectedVisitVerification);
      if (saved.duplicate) {
        showSubmitFeedback({
          tone: "warning",
          title: "Already queued",
          message: OFFLINE_DUPLICATE_MESSAGE,
          detail: selectedName,
        });
      } else {
        showSubmitFeedback({
          tone: "info",
          title: "Saved to device",
          message: OFFLINE_SAVED_MESSAGE,
          detail: selectedName,
        });
      }
      return true;
    } catch (error) {
      showSubmitFeedback({
        tone: "error",
        title: "Submission failed",
        message:
          error instanceof Error
            ? error.message
            : "Online report submission failed. Try again when the API is reachable.",
        detail: selectedName,
      });
      return false;
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleRemoveReport = async (clientReportId: string) => {
    await removeOfflineReport(clientReportId);
    await loadOfflineReports();
    if (editingOfflineReportId === clientReportId) {
      setEditingOfflineReportId(null);
    }
  };

  const scrollToReportSection = useCallback(() => {
    requestAnimationFrame(() => {
      document.getElementById("submit-report")?.scrollIntoView({ block: "start" });
      window.history.replaceState(null, "", "#submit-report");
    });
  }, []);

  const handleSelectClinic = useCallback((clinicId: string) => {
    setSelectedClinicId(clinicId);
    setEditingOfflineReportId(null);
    setVisitVerification(null);
  }, []);

  const handleEditReport = (item: OfflineReportQueueItem) => {
    setSelectedClinicId(item.clinicId);
    setEditingOfflineReportId(item.clientReportId);
    setVisitVerification(
      item.visitVerification
        ? { clinicId: item.clinicId, verification: item.visitVerification }
        : null,
    );
    setSubmitFeedback(null);

    scrollToReportSection();
  };

  const handleSelectHandoffClinic = useCallback(
    (clinicId: string) => {
      handleSelectClinic(clinicId);
      scrollToReportSection();
    },
    [handleSelectClinic, scrollToReportSection],
  );

  return (
    <div className="grid gap-4 pb-4" data-role-dashboard={session.role}>
      <section
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm"
        data-field-visit-cockpit
      >
        <div className="grid gap-4 bg-neutral-950 p-4 text-white lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-white/65">
              Field visit cockpit
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-normal text-white sm:text-2xl">
              Field workbench
            </h1>
            <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-white/55">
              Active visit
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              {fieldCockpit.selectedVisit.clinicName}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              {fieldCockpit.selectedVisit.positionLabel} -{" "}
              {fieldCockpit.selectedVisit.reason}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${fieldCockpit.routePositionPercent}%` }}
                />
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-normal text-white/55">
                  Route position
                </p>
                <p className="text-xs font-semibold text-white/75">
                  {fieldCockpit.routePositionLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className={buttonVariants({
                className:
                  "w-full bg-emerald-500 text-neutral-950 hover:bg-emerald-400 sm:w-auto",
                size: "lg",
              })}
              href="#submit-report"
              onClick={handleJumpToReport}
            >
              {fieldCockpit.selectedVisit.primaryActionLabel}
            </Link>
            <Link
              className={buttonVariants({
                className:
                  "w-full border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto",
                size: "lg",
                variant: "outline",
              })}
              href="#field-itinerary"
              onClick={handleJumpToItinerary}
            >
              {fieldCockpit.selectedVisit.secondaryActionLabel}
            </Link>
          </div>
        </div>

        <FieldTaskQueue tasks={fieldCockpit.taskQueue} />

        {selectedClinic ? (
          <FieldLocationVerificationPanel
            key={selectedClinic.id}
            clinic={{
              latitude: selectedClinic.latitude,
              longitude: selectedClinic.longitude,
              name: selectedClinic.name,
            }}
            onVerificationChange={(verification) =>
              setVisitVerification(
                verification
                  ? {
                      clinicId: selectedClinic.id,
                      verification,
                    }
                  : null,
              )
            }
          />
        ) : null}

        <dl className="grid divide-y divide-border-subtle border-b border-border-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <div className="p-4">
            <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Connection
            </dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {fieldCockpit.deviceStrip.connectionLabel}
            </dd>
          </div>
          <div className="p-4">
            <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Saved on this device
            </dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {fieldCockpit.deviceStrip.savedOnDeviceCount}
            </dd>
          </div>
          <div className="p-4">
            <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Needs retry
            </dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {fieldCockpit.deviceStrip.needsRetryCount}
            </dd>
          </div>
          <div className="p-4">
            <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Last synced
            </dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {fieldCockpit.deviceStrip.lastSyncedLabel}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-content-subtle">
            Reports sync when the app is open and ClinicPulse can be reached.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleOnlineFromCockpit}
            className="w-full sm:w-auto"
          >
            {isOnline ? "Set offline mode" : "Set online mode"}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <FieldClinicList
          rows={fieldCockpit.itineraryRows}
          onSelectClinic={handleSelectClinic}
        />
        <div id="submit-report" className="scroll-mt-28">
          <ReportForm
            key={`${selectedId}:${editingOfflineReport?.clientReportId ?? "new"}`}
            clinicId={selectedId}
            clinicName={selectedName}
            onSubmit={handleSubmit}
            submitting={submitting}
            feedback={submitFeedback}
            editingReport={editingOfflineReport}
            visitVerification={selectedVisitVerification}
          />
        </div>
      </div>

      <div id="drafts-sync" className="grid gap-4 lg:grid-cols-2">
        <OfflineQueue
          queue={offlineReports}
          clinics={clinics}
          canSync={isOnline}
          syncing={syncing}
          onEditItem={handleEditReport}
          onSync={() => void syncQueuedReports()}
          onRetryItem={(clientReportId) =>
            void syncQueuedReports({ clientReportId, manual: true })
          }
          onRemoveItem={(clientReportId) => void handleRemoveReport(clientReportId)}
        />

        <SyncStatus
          isOnline={isOnline}
          queuedReports={waitingOfflineReportCount}
          lastSyncedAt={lastSyncedAt}
          onToggleOnline={handleToggleOnline}
          canRetry={waitingOfflineReportCount > 0}
          onRetry={
            waitingOfflineReportCount > 0
              ? () => void syncQueuedReports({ manual: true })
              : undefined
          }
        />
      </div>

      <FieldReportHandoff
        reports={recentReports}
        selectedClinicId={selectedId}
        onSelectClinic={handleSelectHandoffClinic}
      />

      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Field to district"
          title="What happens next"
          description="Online submissions enter district review. Offline submissions land in queue until synced."
        />
        <div className="mt-3 grid gap-2 text-sm">
          <p className="text-content-subtle">
            1) Pick a clinic from your assigned list.
          </p>
          <p className="text-content-subtle">
            2) Complete status, staffing, stock, queue, and notes.
          </p>
          <p className="text-content-subtle">
            3) Online reports wait for district review before changing current status.
          </p>
          <p className="text-content-subtle">
            4) Offline reports stay queued until synced, then enter the same district review flow.
          </p>
        </div>
      </section>
    </div>
  );
}
