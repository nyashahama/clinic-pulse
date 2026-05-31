"use client";

import { useMemo, useState } from "react";

import { ScenarioRehearsalBriefing } from "@/components/product/scenario-rehearsal-briefing";
import { ScenarioControlsWorkspace } from "@/components/product/scenario-controls-workspace";
import {
  INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  incidentReplaySteps,
} from "@/lib/workspace/incident-replay";
import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/workspace/clinics";
import { useWorkspaceStore } from "@/lib/workspace/workspace-store";
import {
  buildScenarioControlsViewModel,
  type ScenarioControlCommandId,
} from "@/lib/product/scenario-controls";

function scenarioActionTimestamp(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

export default function ScenarioControlsPageClient() {
  const {
    state,
    applyIncidentReplayStep,
    queueOfflineReport,
    resetWorkspace,
    syncOfflineReports,
    triggerStaffingShortage,
    triggerStockout,
  } = useWorkspaceStore();
  const [lastAction, setLastAction] = useState("Scenario rehearsal cockpit is ready.");
  const [selectedCommandId, setSelectedCommandId] =
    useState<ScenarioControlCommandId>("incident_replay");
  const clinicNameById = useMemo(
    () => new Map(state.clinics.map((clinic) => [clinic.id, clinic.name])),
    [state.clinics],
  );
  const stockoutClinicLabel =
    clinicNameById.get(STOCKOUT_TRIGGER_CLINIC_ID) ?? "Mamelodi East";
  const staffingClinicLabel =
    clinicNameById.get(STAFFING_TRIGGER_CLINIC_ID) ?? "Soshanguve Block F";
  const viewModel = useMemo(
    () =>
      buildScenarioControlsViewModel({
        state,
        stockoutClinicLabel,
        staffingClinicLabel,
        selectedCommandId,
        lastAction,
      }),
    [lastAction, selectedCommandId, staffingClinicLabel, state, stockoutClinicLabel],
  );

  const handleReset = () => {
    resetWorkspace();
    setLastAction("Scenario data reset to the seeded operating state.");
  };

  const handleReplayIncident = () => {
    resetWorkspace();
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

  const handleRunCommand = (commandId: ScenarioControlCommandId) => {
    setSelectedCommandId(commandId);

    switch (commandId) {
      case "reset":
        handleReset();
        return;
      case "incident_replay":
        handleReplayIncident();
        return;
      case "stockout":
        handleTriggerStockout();
        return;
      case "staffing_shortage":
        handleTriggerStaffingShortage();
        return;
      case "offline_sync":
        handleSyncOfflineReports();
        return;
      case "reroute":
        handleTriggerReroute();
        return;
    }
  };

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-admin-module="scenario-controls">
      <ScenarioRehearsalBriefing
        title="Scenario rehearsal cockpit"
        viewModel={viewModel}
        onRunCommand={handleRunCommand}
      />

      <ScenarioControlsWorkspace
        viewModel={viewModel}
        onSelectCommand={setSelectedCommandId}
        onRunCommand={handleRunCommand}
      />
    </div>
  );
}
