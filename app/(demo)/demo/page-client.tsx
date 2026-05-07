"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AlertList } from "@/components/demo/alert-list";
import { ClinicMap } from "@/components/demo/clinic-map";
import { ClinicTable } from "@/components/demo/clinic-table";
import { DemoControls } from "@/components/demo/demo-controls";
import { IncidentReplayPanel } from "@/components/demo/incident-replay-panel";
import { PilotReadinessPanel } from "@/components/demo/pilot-readiness-panel";
import { ReportStream } from "@/components/demo/report-stream";
import { StatusSummary } from "@/components/demo/status-summary";
import { buttonVariants } from "@/components/ui/button";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import {
  INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  buildIncidentReplayWebhookPreview,
  incidentReplaySteps,
  type IncidentReplayStepId,
  type IncidentReplayWebhookPreview,
} from "@/lib/demo/incident-replay";
import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  getActiveAlerts,
  getAlternativeClinics,
  getClinicRows,
  getRecentReportStream,
  getStatusCounts,
} from "@/lib/demo/selectors";

const VALID_STATUSES = ["operational", "degraded", "non_functional", "unknown"] as const;

type ValidStatusFilter = (typeof VALID_STATUSES)[number];

function normalizeStatusFilter(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return (VALID_STATUSES.includes(normalized as ValidStatusFilter) ? normalized : "") as
    | ValidStatusFilter
    | "";
}

function formatStatusTransition(from: string, to: string) {
  return `${from.replaceAll("_", " ")} → ${to.replaceAll("_", " ")}`;
}

type DistrictConsolePageProps = {
  syncSummary: SyncSummaryApiResponse | null;
};

export default function DistrictConsolePage({ syncSummary }: DistrictConsolePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state,
    resetDemo,
    triggerStockout,
    triggerStaffingShortage,
    syncOfflineReports,
    queueOfflineReport,
    applyIncidentReplayStep,
  } = useDemoStore();

  const clinicRows = useMemo(() => getClinicRows(state), [state]);
  const statusFilter = normalizeStatusFilter(searchParams.get("status"));
  const filteredClinicRows = useMemo(
    () =>
      statusFilter
        ? clinicRows.filter((clinic) => clinic.status === statusFilter)
        : clinicRows,
    [clinicRows, statusFilter],
  );
  const mapClinics = filteredClinicRows.length === 0 ? clinicRows : filteredClinicRows;
  const activeAlerts = useMemo(() => getActiveAlerts(state), [state]);
  const reportStream = useMemo(() => getRecentReportStream(state), [state]);
  const statusCounts = useMemo(() => getStatusCounts(state), [state]);

  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [rerouteClinicId, setRerouteClinicId] = useState<string | null>(null);
  const replayStartGuardRef = useRef(false);
  const replaySessionRef = useRef(0);
  const replayTimeoutRef = useRef<number | null>(null);
  const latestDemoStateRef = useRef(state);
  const [replayStatus, setReplayStatus] = useState<"idle" | "running" | "complete">("idle");
  const [activeReplayStepId, setActiveReplayStepId] = useState<IncidentReplayStepId | null>(
    null,
  );
  const [completedReplayStepIds, setCompletedReplayStepIds] = useState<IncidentReplayStepId[]>([]);
  const [completedReplayAtByStepId, setCompletedReplayAtByStepId] = useState<
    Partial<Record<IncidentReplayStepId, string>>
  >({});
  const [webhookPreview, setWebhookPreview] = useState<IncidentReplayWebhookPreview | null>(null);
  const hasStatusFilter = Boolean(statusFilter);
  const statusFilterLabel = statusFilter.replaceAll("_", " ");
  const replayNonIdle = replayStatus !== "idle";
  const isReplayFilterBypassed = hasStatusFilter && replayStatus !== "idle";

  const openClinicDetail = (clinicId: string) => {
    router.push(`/demo/clinics/${encodeURIComponent(clinicId)}`);
  };

  const visibleClinicRows = replayStatus === "idle" ? mapClinics : clinicRows;

  useEffect(() => {
    latestDemoStateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      replaySessionRef.current += 1;
      replayStartGuardRef.current = false;
      if (replayTimeoutRef.current) {
        window.clearTimeout(replayTimeoutRef.current);
      }
    };
  }, []);

  const clearReplayTimer = () => {
    if (!replayTimeoutRef.current) {
      return;
    }

    window.clearTimeout(replayTimeoutRef.current);
    replayTimeoutRef.current = null;
  };

  const cancelIncidentReplay = () => {
    replaySessionRef.current += 1;
    replayStartGuardRef.current = false;
    clearReplayTimer();
  };

  const runIncidentReplayStep = (stepIndex: number, sessionId: number) => {
    if (sessionId !== replaySessionRef.current) {
      return;
    }

    const step = incidentReplaySteps[stepIndex];

    if (!step) {
      clearReplayTimer();
      replayStartGuardRef.current = false;
      setActiveReplayStepId(null);
      setReplayStatus("complete");
      return;
    }

    const stepNow = new Date().toISOString();

    setActiveReplayStepId(step.id);
    applyIncidentReplayStep(step.id, stepNow);

    if (step.id === "reroute") {
      setRerouteClinicId(INCIDENT_REPLAY_SOURCE_CLINIC_ID);
    }

    if (step.id === "partner_webhook") {
      setWebhookPreview(
        buildIncidentReplayWebhookPreview(latestDemoStateRef.current, stepNow),
      );
    }

    replayTimeoutRef.current = window.setTimeout(() => {
      if (sessionId !== replaySessionRef.current) {
        return;
      }

      setCompletedReplayStepIds((current) => [...current, step.id]);
      setCompletedReplayAtByStepId((current) => ({
        ...current,
        [step.id]: stepNow,
      }));
      runIncidentReplayStep(stepIndex + 1, sessionId);
    }, step.durationMs);
  };

  const startIncidentReplay = () => {
    if (replayStatus !== "idle" || replayStartGuardRef.current) {
      return;
    }

    replayStartGuardRef.current = true;
    clearReplayTimer();
    const sessionId = replaySessionRef.current + 1;
    replaySessionRef.current = sessionId;
    setSelectedClinicId(INCIDENT_REPLAY_SOURCE_CLINIC_ID);
    setRerouteClinicId(null);
    setReplayStatus("running");
    setActiveReplayStepId(null);
    setCompletedReplayStepIds([]);
    setCompletedReplayAtByStepId({});
    setWebhookPreview(null);
    resetDemo();
    replayTimeoutRef.current = window.setTimeout(() => {
      runIncidentReplayStep(0, sessionId);
    }, 0);
  };

  const consequenceByReportId = useMemo(() => {
    const auditByClinic = new Map<string, string>();

    for (const event of state.auditEvents) {
      if (!auditByClinic.has(event.clinicId)) {
        auditByClinic.set(event.clinicId, event.summary);
      }
    }

    return Object.fromEntries(
      reportStream.map((report) => [
        report.id,
        auditByClinic.get(report.clinicId) ?? "District monitoring retained the current routing state.",
      ]),
    );
  }, [reportStream, state.auditEvents]);

  const statusChangeByReportId = useMemo(() => {
    const seenStatusByClinic = new Map<string, string>();
    const entries: Array<[string, string]> = [];
    const timeline = [...reportStream].reverse();

    for (const report of timeline) {
      const previousStatus = seenStatusByClinic.get(report.clinicId);
      const change = previousStatus
        ? formatStatusTransition(previousStatus, report.status)
        : "Initial report";

      entries.push([report.id, change]);
      seenStatusByClinic.set(report.clinicId, report.status);
    }

    return Object.fromEntries(entries);
  }, [reportStream]);

  const recommendedActionByClinicId = useMemo(
    () =>
      Object.fromEntries(
        clinicRows.map((clinic) => {
          const primaryService = clinic.services[0];
          const nextAlternative = primaryService
            ? getAlternativeClinics(state, clinic.id, primaryService)[0]
            : undefined;

          let action = "Monitor service continuity and keep district status fresh.";

          if (clinic.status === "non_functional" && nextAlternative) {
            action = `Reroute ${primaryService.toLowerCase()} to ${nextAlternative.name}.`;
          } else if (clinic.status === "degraded" && nextAlternative) {
            action = `Route overflow to ${nextAlternative.name} while the issue is stabilized.`;
          } else if (
            clinic.freshness === "stale" ||
            clinic.freshness === "unknown" ||
            clinic.freshness === "needs_confirmation"
          ) {
            action = "Confirm with the clinic coordinator before public routing changes.";
          }

          return [clinic.id, action];
        }),
      ),
    [clinicRows, state],
  );

  const handleSyncOfflineReports = () => {
    if (replayNonIdle) {
      return;
    }

    const fallbackClinicId = clinicRows[0]?.id;
    const queuedClinicId = state.offlineQueue[0]?.clinicId ?? fallbackClinicId;

    if (!queuedClinicId) {
      return;
    }

    if (state.offlineQueue.length === 0) {
      queueOfflineReport({
        clinicId: queuedClinicId,
        reporterName: "Sipho Nkosi",
        source: "field_worker",
        status: "degraded",
        reason: "Offline backlog confirmed elevated queues after connectivity returned.",
        staffPressure: "strained",
        stockPressure: "low",
        queuePressure: "high",
        notes: "Seeded from district console to demonstrate a same-session offline sync.",
      });
    }

    syncOfflineReports();
    openClinicDetail(queuedClinicId);
  };

  const handleTriggerReroute = () => {
    if (replayNonIdle) {
      return;
    }

    const rerouteCandidate =
      clinicRows.find(
        (clinic) =>
          clinic.status !== "operational" &&
          clinic.services.length > 0 &&
          getAlternativeClinics(state, clinic.id, clinic.services[0]).length > 0,
      ) ?? null;

    if (!rerouteCandidate) {
      setRerouteClinicId(null);
      return;
    }

    setSelectedClinicId(rerouteCandidate.id);
    setRerouteClinicId(rerouteCandidate.id);
    openClinicDetail(rerouteCandidate.id);
  };

  return (
    <div className="grid gap-4 pb-4">
      <StatusSummary
        counts={statusCounts}
        activeAlertCount={activeAlerts.length}
        offlineQueueCount={state.offlineQueue.length}
        lastSyncAt={state.lastSyncAt}
      />
      {syncSummary ? <PilotReadinessPanel summary={syncSummary} /> : null}
      {hasStatusFilter ? (
        <section className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              {isReplayFilterBypassed ? (
                <>
                  Status filter is paused during replay. Showing all clinics until replay is reset.
                </>
              ) : (
                <>
                  Displaying only{" "}
                  <span className="font-semibold capitalize">{statusFilterLabel}</span> clinics.{" "}
                  {filteredClinicRows.length === 0 ? "No matches yet." : ""}
                </>
              )}
            </p>
            <Link href="/demo" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Clear status filter
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4">
        <ClinicMap
          clinics={visibleClinicRows}
          referenceClinics={clinicRows}
          selectedClinicId={selectedClinicId}
          rerouteClinicId={rerouteClinicId}
          onSelectClinic={openClinicDetail}
        />

        <ClinicTable
          clinics={visibleClinicRows}
          selectedClinicId={selectedClinicId}
          recommendedActionByClinicId={recommendedActionByClinicId}
          onSelectClinic={openClinicDetail}
        />

        <DemoControls
          stockoutClinicLabel="Mamelodi East"
          staffingClinicLabel="Soshanguve Block F"
          offlineQueueCount={state.offlineQueue.length}
          replayRunning={replayNonIdle}
          onReset={() => {
            cancelIncidentReplay();
            setReplayStatus("idle");
            setActiveReplayStepId(null);
            setCompletedReplayStepIds([]);
            setCompletedReplayAtByStepId({});
            setWebhookPreview(null);
            resetDemo();
            setSelectedClinicId(null);
            setRerouteClinicId(null);
          }}
          onReplayIncident={startIncidentReplay}
          onTriggerStockout={() => {
            if (replayNonIdle) {
              return;
            }

            setSelectedClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
            setRerouteClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
            triggerStockout(STOCKOUT_TRIGGER_CLINIC_ID);
            openClinicDetail(STOCKOUT_TRIGGER_CLINIC_ID);
          }}
          onTriggerStaffingShortage={() => {
            if (replayNonIdle) {
              return;
            }

            setSelectedClinicId(STAFFING_TRIGGER_CLINIC_ID);
            setRerouteClinicId(null);
            triggerStaffingShortage(STAFFING_TRIGGER_CLINIC_ID);
            openClinicDetail(STAFFING_TRIGGER_CLINIC_ID);
          }}
          onSyncOfflineReports={handleSyncOfflineReports}
          onTriggerReroute={handleTriggerReroute}
        />

        <IncidentReplayPanel
          status={replayStatus}
          activeStepId={activeReplayStepId}
          completedStepIds={completedReplayStepIds}
          completedAtByStepId={completedReplayAtByStepId}
          webhookPreview={webhookPreview}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <AlertList alerts={activeAlerts} clinics={clinicRows} onSelectClinic={openClinicDetail} />
        <ReportStream
          reports={reportStream}
          selectedClinicId={selectedClinicId}
          consequenceByReportId={consequenceByReportId}
          statusChangeByReportId={statusChangeByReportId}
          onSelectClinic={openClinicDetail}
        />
      </div>
    </div>
  );
}
