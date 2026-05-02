"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AlertList } from "@/components/demo/alert-list";
import { ClinicMap } from "@/components/demo/clinic-map";
import { ClinicSidePanel } from "@/components/demo/clinic-side-panel";
import { ClinicTable } from "@/components/demo/clinic-table";
import { DemoControls } from "@/components/demo/demo-controls";
import { ReportStream } from "@/components/demo/report-stream";
import { StatusSummary } from "@/components/demo/status-summary";
import { buttonVariants } from "@/components/ui/button";
import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  getActiveAlerts,
  getAlternativeClinics,
  getClinicReports,
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

function getDefaultSelectedClinicId(stateClinicId: string | undefined, fallbackClinicId: string | undefined) {
  return stateClinicId ?? fallbackClinicId ?? null;
}

function formatStatusTransition(from: string, to: string) {
  return `${from.replaceAll("_", " ")} → ${to.replaceAll("_", " ")}`;
}

export default function DistrictConsolePage() {
  const searchParams = useSearchParams();
  const {
    state,
    resetDemo,
    triggerStockout,
    triggerStaffingShortage,
    syncOfflineReports,
    queueOfflineReport,
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

  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(() =>
    getDefaultSelectedClinicId(activeAlerts[0]?.clinicId, mapClinics[0]?.id),
  );
  const [rerouteClinicId, setRerouteClinicId] = useState<string | null>(null);
  const hasStatusFilter = Boolean(statusFilter);
  const statusFilterLabel = statusFilter.replaceAll("_", " ");

  const selectClinic = (clinicId: string | null) => {
    setSelectedClinicId(clinicId);
    setRerouteClinicId((previous) => (previous === clinicId ? previous : null));
  };

  const resolvedSelectedClinicId =
    selectedClinicId && mapClinics.some((clinic) => clinic.id === selectedClinicId)
      ? selectedClinicId
      : getDefaultSelectedClinicId(activeAlerts[0]?.clinicId, mapClinics[0]?.id);

  const selectedClinic =
    mapClinics.find((clinic) => clinic.id === resolvedSelectedClinicId) ??
    mapClinics[0] ??
    null;

  const clinicReports = useMemo(
    () => (selectedClinic ? getClinicReports(state, selectedClinic.id) : []),
    [selectedClinic, state],
  );
  const clinicAlerts = useMemo(
    () =>
      selectedClinic
        ? activeAlerts.filter((alert) => alert.clinicId === selectedClinic.id)
        : [],
    [activeAlerts, selectedClinic],
  );
  const selectedService = selectedClinic?.services[0];
  const alternatives = useMemo(
    () =>
      selectedClinic && selectedService
        ? getAlternativeClinics(state, selectedClinic.id, selectedService).slice(0, 3)
        : [],
    [selectedClinic, selectedService, state],
  );

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

    selectClinic(queuedClinicId);
    syncOfflineReports();
  };

  const handleTriggerReroute = () => {
    const rerouteCandidate =
      clinicRows.find(
        (clinic) =>
          clinic.status !== "operational" &&
          clinic.services.length > 0 &&
          getAlternativeClinics(state, clinic.id, clinic.services[0]).length > 0,
      ) ?? selectedClinic;

    if (!rerouteCandidate) {
      setRerouteClinicId(null);
      return;
    }

    setSelectedClinicId(rerouteCandidate.id);
    setRerouteClinicId(rerouteCandidate.id);
  };

  return (
    <div className="grid gap-4 pb-4">
      <StatusSummary
        counts={statusCounts}
        activeAlertCount={activeAlerts.length}
        offlineQueueCount={state.offlineQueue.length}
        lastSyncAt={state.lastSyncAt}
      />
      {hasStatusFilter ? (
        <section className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              Displaying only <span className="font-semibold capitalize">{statusFilterLabel}</span>{" "}
              clinics. {filteredClinicRows.length === 0 ? "No matches yet." : ""}
            </p>
            <Link href="/demo" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Clear status filter
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,0.95fr)]">
        <div className="grid gap-4">
          <ClinicMap
            clinics={mapClinics}
            referenceClinics={clinicRows}
            selectedClinicId={selectedClinic?.id ?? null}
            rerouteClinicId={rerouteClinicId}
            onSelectClinic={selectClinic}
          />

          <ClinicTable
            clinics={filteredClinicRows}
            selectedClinicId={selectedClinic?.id ?? null}
            recommendedActionByClinicId={recommendedActionByClinicId}
            onSelectClinic={selectClinic}
          />
        </div>

        <div className="grid gap-4">
          <ClinicSidePanel
            clinic={selectedClinic}
            latestReport={clinicReports[0] ?? null}
            alerts={clinicAlerts}
            alternatives={alternatives}
            rerouteActive={rerouteClinicId === selectedClinic?.id}
          />

          <DemoControls
            stockoutClinicLabel="Mamelodi East"
            staffingClinicLabel="Soshanguve Block F"
            offlineQueueCount={state.offlineQueue.length}
            onReset={() => {
              resetDemo();
              setSelectedClinicId(null);
              setRerouteClinicId(null);
            }}
            onTriggerStockout={() => {
              setSelectedClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
              setRerouteClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
              triggerStockout(STOCKOUT_TRIGGER_CLINIC_ID);
            }}
            onTriggerStaffingShortage={() => {
              setSelectedClinicId(STAFFING_TRIGGER_CLINIC_ID);
              setRerouteClinicId(null);
              triggerStaffingShortage(STAFFING_TRIGGER_CLINIC_ID);
            }}
            onSyncOfflineReports={handleSyncOfflineReports}
            onTriggerReroute={handleTriggerReroute}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <AlertList alerts={activeAlerts} clinics={clinicRows} onSelectClinic={selectClinic} />
        <ReportStream
          reports={reportStream}
          selectedClinicId={selectedClinic?.id ?? null}
          consequenceByReportId={consequenceByReportId}
          statusChangeByReportId={statusChangeByReportId}
          onSelectClinic={selectClinic}
        />
      </div>
    </div>
  );
}
