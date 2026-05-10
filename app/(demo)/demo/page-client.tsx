"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AlertList } from "@/components/demo/alert-list";
import { ClinicMap } from "@/components/demo/clinic-map";
import { ClinicTable } from "@/components/demo/clinic-table";
import { DistrictCommandBrief } from "@/components/demo/command-center/district-command-brief";
import { InterventionRail } from "@/components/demo/command-center/intervention-rail";
import { SeverityQueue } from "@/components/demo/command-center/severity-queue";
import { SignalAnalytics } from "@/components/demo/command-center/signal-analytics";
import { SupportingOperations } from "@/components/demo/command-center/supporting-operations";
import { VerificationHandover } from "@/components/demo/command-center/verification-handover";
import { DemoControls } from "@/components/demo/demo-controls";
import { IncidentReplayPanel } from "@/components/demo/incident-replay-panel";
import { PilotReadinessPanel } from "@/components/demo/pilot-readiness-panel";
import { ReferenceSectionCards } from "@/components/demo/reference-section-cards";
import { ReportStream } from "@/components/demo/report-stream";
import { StatusSummary } from "@/components/demo/status-summary";
import { buttonVariants } from "@/components/ui/button";
import type { ClientAuthSession } from "@/lib/auth/api";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import {
  buildDistrictCommandCenter,
  type DistrictCommandClinicInput,
} from "@/lib/demo/district-command-center";
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
  consoleHref?: string;
  session: ClientAuthSession;
  syncSummary: SyncSummaryApiResponse | null;
};

function statusRiskRank(status: DistrictCommandClinicInput["status"]) {
  if (status === "non_functional") {
    return 3;
  }

  if (status === "degraded") {
    return 2;
  }

  if (status === "unknown") {
    return 1;
  }

  return 0;
}

export default function DistrictConsolePage({
  consoleHref = "/demo",
  session,
  syncSummary,
}: DistrictConsolePageProps) {
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
  const [selectedCommandClinicId, setSelectedCommandClinicId] = useState<string | null>(null);
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
    router.push(`${consoleHref}/clinics/${encodeURIComponent(clinicId)}`);
  };

  const selectCommandClinic = (clinicId: string) => {
    setSelectedCommandClinicId(clinicId);
    setSelectedClinicId(clinicId);
  };

  const visibleClinicRows = replayStatus === "idle" ? mapClinics : clinicRows;

  const commandClinicInputs = useMemo<DistrictCommandClinicInput[]>(() => {
    const activeAlertClinicIds = new Set(activeAlerts.map((alert) => alert.clinicId));
    const offlineQueueClinicIds = new Set(state.offlineQueue.map((report) => report.clinicId));
    const reportsByClinicId = new Map<string, typeof reportStream>();

    for (const report of reportStream) {
      const clinicReports = reportsByClinicId.get(report.clinicId) ?? [];
      clinicReports.push(report);
      reportsByClinicId.set(report.clinicId, clinicReports);
    }

    return clinicRows.map((clinic) => {
      const alternativeClinicIds = new Set<string>();

      for (const service of clinic.services) {
        for (const alternative of getAlternativeClinics(state, clinic.id, service)) {
          alternativeClinicIds.add(alternative.id);
        }
      }

      const clinicReports = reportsByClinicId.get(clinic.id) ?? [];
      const latestReport = clinicReports[0];
      const previousReport = clinicReports[1];
      let recentTrend: DistrictCommandClinicInput["recentTrend"] = "unknown";

      if (latestReport && previousReport) {
        const latestRisk = statusRiskRank(latestReport.status);
        const previousRisk = statusRiskRank(previousReport.status);

        if (latestRisk > previousRisk) {
          recentTrend = "worsening";
        } else if (latestRisk < previousRisk) {
          recentTrend = "improving";
        } else {
          recentTrend = "stable";
        }
      }

      return {
        id: clinic.id,
        name: clinic.name,
        district: clinic.district,
        status: clinic.status,
        freshness: clinic.freshness,
        services: clinic.services,
        updatedAt: clinic.lastReportedAt,
        hasActiveAlert: activeAlertClinicIds.has(clinic.id),
        isInOfflineQueue: offlineQueueClinicIds.has(clinic.id),
        alternativeCount: alternativeClinicIds.size,
        recentTrend,
      };
    });
  }, [activeAlerts, clinicRows, reportStream, state]);

  const commandCenter = useMemo(
    () =>
      buildDistrictCommandCenter({
        session,
        clinics: commandClinicInputs,
        activeAlertCount: activeAlerts.length,
        offlineQueueCount: state.offlineQueue.length,
        lastSyncAt: state.lastSyncAt,
        selectedClinicId: selectedCommandClinicId,
      }),
    [
      activeAlerts.length,
      commandClinicInputs,
      selectedCommandClinicId,
      session,
      state.lastSyncAt,
      state.offlineQueue.length,
    ],
  );

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
    setSelectedCommandClinicId(INCIDENT_REPLAY_SOURCE_CLINIC_ID);
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
    setSelectedCommandClinicId(rerouteCandidate.id);
    setRerouteClinicId(rerouteCandidate.id);
    openClinicDetail(rerouteCandidate.id);
  };

  const handleTriggerSelectedCommandReroute = () => {
    if (replayNonIdle || !commandCenter.selectedItem) {
      return;
    }

    const selectedClinic = clinicRows.find(
      (clinic) => clinic.id === commandCenter.selectedItem?.clinicId,
    );
    const primaryService = selectedClinic?.services[0];

    if (
      !selectedClinic ||
      !primaryService ||
      getAlternativeClinics(state, selectedClinic.id, primaryService).length === 0
    ) {
      setRerouteClinicId(null);
      return;
    }

    setSelectedClinicId(selectedClinic.id);
    setSelectedCommandClinicId(selectedClinic.id);
    setRerouteClinicId(selectedClinic.id);
    openClinicDetail(selectedClinic.id);
  };

  const handleResetWalkthrough = () => {
    cancelIncidentReplay();
    setReplayStatus("idle");
    setActiveReplayStepId(null);
    setCompletedReplayStepIds([]);
    setCompletedReplayAtByStepId({});
    setWebhookPreview(null);
    resetDemo();
    setSelectedClinicId(null);
    setSelectedCommandClinicId(null);
    setRerouteClinicId(null);
  };

  return (
    <div className="grid min-w-0 gap-5 pb-6" data-role-dashboard={session.role}>
      <ReferenceSectionCards
        cards={[
          {
            title: "Severity queue",
            value: String(commandCenter.queue.length),
            badge: commandCenter.queue.length > 0 ? "Action" : "Stable",
            trend: commandCenter.queue.length > 0 ? "down" : "neutral",
            footer: "Clinics ranked by action urgency",
            detail: "District users start with the queue before maps and reports.",
          },
          {
            title: "Open alerts",
            value: String(activeAlerts.length),
            badge: activeAlerts.length > 0 ? "Review" : "Clear",
            trend: activeAlerts.length > 0 ? "down" : "neutral",
            footer: "Signals requiring district attention",
            detail: "Alerts stay connected to clinic detail and intervention handoff.",
          },
          {
            title: "Offline reports",
            value: String(state.offlineQueue.length),
            badge: state.offlineQueue.length > 0 ? "Sync" : "Ready",
            trend: state.offlineQueue.length > 0 ? "down" : "neutral",
            footer: "Field updates waiting to merge",
            detail: "Offline queue pressure is visible before readiness evidence.",
          },
          {
            title: "Clinics in scope",
            value: String(clinicRows.length),
            badge: "District",
            trend: "up",
            footer: "Command view is scoped to assigned facilities",
            detail: "Map, queue, and table stay aligned to the same clinic set.",
          },
        ]}
      />

      <DistrictCommandBrief brief={commandCenter.brief} />

      <div
        id="severity-queue"
        className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"
      >
        <SeverityQueue
          items={commandCenter.queue}
          selectedClinicId={commandCenter.selectedItem?.clinicId ?? null}
          onSelectClinic={selectCommandClinic}
        />
        <div id="interventions" className="min-w-0">
          <InterventionRail
            selectedItem={commandCenter.selectedItem}
            intervention={commandCenter.intervention}
            replayDisabled={replayNonIdle}
            onOpenClinic={openClinicDetail}
            onTriggerReroute={handleTriggerSelectedCommandReroute}
            onSyncOfflineReports={handleSyncOfflineReports}
            onStartIncidentReplay={startIncidentReplay}
          />
        </div>
      </div>

      <div id="clinic-network">
        <SignalAnalytics analytics={commandCenter.analytics} />
      </div>
      <div id="verification-handoff">
        <VerificationHandover handover={commandCenter.handover} />
      </div>

      <SupportingOperations>
        {hasStatusFilter ? (
          <section className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
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
              <Link href={consoleHref} className={buttonVariants({ size: "sm", variant: "outline" })}>
                Clear status filter
              </Link>
            </div>
          </section>
        ) : null}

        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <StatusSummary
            counts={statusCounts}
            activeAlertCount={activeAlerts.length}
            offlineQueueCount={state.offlineQueue.length}
            lastSyncAt={state.lastSyncAt}
          />
          {syncSummary ? <PilotReadinessPanel summary={syncSummary} /> : null}
        </div>

        <ClinicMap
          clinics={visibleClinicRows}
          referenceClinics={clinicRows}
          selectedClinicId={selectedClinicId}
          rerouteClinicId={rerouteClinicId}
          onSelectClinic={openClinicDetail}
        />

        <DemoControls
          stockoutClinicLabel="Mamelodi East"
          staffingClinicLabel="Soshanguve Block F"
          offlineQueueCount={state.offlineQueue.length}
          replayRunning={replayNonIdle}
          onReset={handleResetWalkthrough}
          onReplayIncident={startIncidentReplay}
          onTriggerStockout={() => {
            if (replayNonIdle) {
              return;
            }

            setSelectedClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
            setSelectedCommandClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
            setRerouteClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
            triggerStockout(STOCKOUT_TRIGGER_CLINIC_ID);
            openClinicDetail(STOCKOUT_TRIGGER_CLINIC_ID);
          }}
          onTriggerStaffingShortage={() => {
            if (replayNonIdle) {
              return;
            }

            setSelectedClinicId(STAFFING_TRIGGER_CLINIC_ID);
            setSelectedCommandClinicId(STAFFING_TRIGGER_CLINIC_ID);
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

        <div
          id="clinic-evidence"
          className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
        >
          <AlertList alerts={activeAlerts} clinics={clinicRows} onSelectClinic={openClinicDetail} />
          <ReportStream
            reports={reportStream}
            selectedClinicId={selectedClinicId}
            consequenceByReportId={consequenceByReportId}
            statusChangeByReportId={statusChangeByReportId}
            onSelectClinic={openClinicDetail}
          />
        </div>

        <ClinicTable
          clinics={visibleClinicRows}
          selectedClinicId={selectedClinicId}
          recommendedActionByClinicId={recommendedActionByClinicId}
          onSelectClinic={openClinicDetail}
        />
      </SupportingOperations>
    </div>
  );
}
