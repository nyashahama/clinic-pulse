"use client";

import { useMemo, useState } from "react";

import { DemoControls } from "@/components/demo/demo-controls";
import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import {
  INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  incidentReplaySteps,
} from "@/lib/demo/incident-replay";
import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";
import { useDemoStore } from "@/lib/demo/demo-store";
import type { AuditEvent } from "@/lib/demo/types";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  StatusBadge,
  toneForAttention,
} from "../governance-formatters";

type ScenarioAuditRow = {
  id: string;
  eventType: string;
  clinicName: string;
  actorName: string;
  summary: string;
  createdAt: string;
};

function buildScenarioAuditRows(
  auditEvents: AuditEvent[],
  clinicNameById: Map<string, string>,
): ScenarioAuditRow[] {
  return auditEvents.slice(0, 6).map((event) => ({
    id: event.id,
    eventType: event.eventType,
    clinicName: clinicNameById.get(event.clinicId) ?? event.clinicId,
    actorName: event.actorName,
    summary: event.summary,
    createdAt: event.createdAt,
  }));
}

function scenarioActionTimestamp(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

export default function ScenarioControlsPageClient() {
  const {
    state,
    applyIncidentReplayStep,
    queueOfflineReport,
    resetDemo,
    syncOfflineReports,
    triggerStaffingShortage,
    triggerStockout,
  } = useDemoStore();
  const [lastAction, setLastAction] = useState("Scenario controls are ready.");
  const clinicNameById = useMemo(
    () => new Map(state.clinics.map((clinic) => [clinic.id, clinic.name])),
    [state.clinics],
  );
  const stockoutClinicLabel =
    clinicNameById.get(STOCKOUT_TRIGGER_CLINIC_ID) ?? "Mamelodi East";
  const staffingClinicLabel =
    clinicNameById.get(STAFFING_TRIGGER_CLINIC_ID) ?? "Soshanguve Block F";
  const activeAlerts = state.alerts.filter((alert) => alert.status !== "resolved");
  const nonOperationalClinicCount = state.clinicStates.filter(
    (clinicState) => clinicState.status !== "operational",
  ).length;
  const latestAuditRows = buildScenarioAuditRows(state.auditEvents, clinicNameById);

  const handleReset = () => {
    resetDemo();
    setLastAction("Scenario data reset to the seeded operating state.");
  };

  const handleReplayIncident = () => {
    resetDemo();
    incidentReplaySteps.forEach((step, index) => {
      applyIncidentReplayStep(step.id, scenarioActionTimestamp(index));
    });
    setLastAction(
      "Incident replay applied across field report, alert, reroute, audit, and webhook evidence.",
    );
  };

  const handleTriggerStockout = () => {
    triggerStockout(STOCKOUT_TRIGGER_CLINIC_ID);
    setLastAction(`${stockoutClinicLabel} moved into a stockout scenario.`);
  };

  const handleTriggerStaffingShortage = () => {
    triggerStaffingShortage(STAFFING_TRIGGER_CLINIC_ID);
    setLastAction(`${staffingClinicLabel} moved into a staffing shortage scenario.`);
  };

  const handleSyncOfflineReports = () => {
    const queuedClinicId = state.offlineQueue[0]?.clinicId ?? STOCKOUT_TRIGGER_CLINIC_ID;

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
        notes: "Seeded from scenario controls to demonstrate same-session offline sync.",
      });
    }

    syncOfflineReports();
    setLastAction("Offline reports synced into the scenario stream.");
  };

  const handleTriggerReroute = () => {
    triggerStockout(INCIDENT_REPLAY_SOURCE_CLINIC_ID);
    applyIncidentReplayStep("reroute");
    setLastAction("Reroute evidence recorded for the active stockout scenario.");
  };

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-admin-module="scenario-controls">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Scenario controls"
        description="Reset, replay, and seed scenario state from the platform control plane while keeping the resulting audit evidence visible."
      />

      <AdminMetricStrip
        metrics={[
          {
            label: "Active alerts",
            value: formatCount(activeAlerts.length),
            detail: "Open scenario signals in the shared district state",
            tone: toneForAttention(activeAlerts.length),
          },
          {
            label: "Offline queue",
            value: formatCount(state.offlineQueue.length),
            detail: "Reports waiting for sync from local scenario state",
            tone: toneForAttention(state.offlineQueue.length),
          },
          {
            label: "Non-operational clinics",
            value: formatCount(nonOperationalClinicCount),
            detail: "Clinics outside the operational status baseline",
            tone: toneForAttention(nonOperationalClinicCount),
          },
          {
            label: "Last sync",
            value: formatDateTime(state.lastSyncAt),
            detail: `${formatCount(state.auditEvents.length)} audit evidence events`,
            tone: "info",
          },
        ]}
      />

      <AdminFilterBar>
        <StatusBadge tone={activeAlerts.length > 0 ? "attention" : "clear"}>
          Shared scenario state
        </StatusBadge>
        <span className="text-sm text-muted-foreground">{lastAction}</span>
      </AdminFilterBar>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(320px,0.42fr)_minmax(0,0.58fr)]">
        <DemoControls
          stockoutClinicLabel={stockoutClinicLabel}
          staffingClinicLabel={staffingClinicLabel}
          offlineQueueCount={state.offlineQueue.length}
          replayRunning={false}
          onReset={handleReset}
          onReplayIncident={handleReplayIncident}
          onTriggerStockout={handleTriggerStockout}
          onTriggerStaffingShortage={handleTriggerStaffingShortage}
          onSyncOfflineReports={handleSyncOfflineReports}
          onTriggerReroute={handleTriggerReroute}
        />

        <AdminEvidenceTable
          label="Scenario audit evidence"
          rows={latestAuditRows}
          getRowKey={(row) => row.id}
          emptyState={
            <AdminEmptyState
              title="No scenario audit evidence"
              description="Run a scenario control to record audit evidence in the shared demo state."
            />
          }
          columns={[
            {
              key: "event",
              header: "Event",
              render: (row) => (
                <StatusBadge tone={row.eventType.includes("webhook") ? "clear" : "info"}>
                  {formatLabel(row.eventType)}
                </StatusBadge>
              ),
            },
            {
              key: "clinic",
              header: "Clinic",
              render: (row) => row.clinicName,
            },
            {
              key: "summary",
              header: "Evidence",
              render: (row) => (
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{row.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.actorName} at {formatDateTime(row.createdAt)}
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
