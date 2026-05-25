import type { AuditEvent, DemoState } from "@/lib/demo/types";

export type ScenarioControlCommandId =
  | "reset"
  | "incident_replay"
  | "stockout"
  | "staffing_shortage"
  | "offline_sync"
  | "reroute";

export type ScenarioControlTone = "clear" | "attention" | "blocked" | "info";

export type ScenarioControlsMetric = {
  id: "run_state" | "active_alerts" | "offline_queue" | "audit_events";
  label: string;
  value: string;
  detail: string;
  tone: ScenarioControlTone;
};

export type ScenarioControlCommand = {
  id: ScenarioControlCommandId;
  label: string;
  actionLabel: string;
  shortDescription: string;
  targetLabel: string;
  impactLabel: string;
  impactDescription: string;
  expectedEvidence: string[];
  tone: ScenarioControlTone;
};

export type ScenarioControlCommandGroup = {
  id: "baseline" | "incident" | "data_flow";
  title: string;
  description: string;
  commands: ScenarioControlCommand[];
};

export type ScenarioControlsEvidenceRow = {
  id: string;
  eventType: string;
  clinicName: string;
  actorName: string;
  summary: string;
  createdAt: string;
};

export type ScenarioControlsSafetyNote = {
  label: string;
  detail: string;
};

export type ScenarioControlsViewModel = {
  summaryMetrics: ScenarioControlsMetric[];
  commandGroups: ScenarioControlCommandGroup[];
  selectedCommand: ScenarioControlCommand;
  evidenceRows: ScenarioControlsEvidenceRow[];
  safetyNotes: ScenarioControlsSafetyNote[];
  statusMessage: string;
};

export const scenarioControlCommandIds: ScenarioControlCommandId[] = [
  "reset",
  "incident_replay",
  "stockout",
  "staffing_shortage",
  "offline_sync",
  "reroute",
];

type BuildScenarioControlsViewModelInput = {
  state: DemoState;
  stockoutClinicLabel: string;
  staffingClinicLabel: string;
  selectedCommandId: ScenarioControlCommandId;
  lastAction: string;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function toneForCount(count: number): ScenarioControlTone {
  return count > 0 ? "attention" : "clear";
}

function buildEvidenceRows(
  auditEvents: AuditEvent[],
  clinicNameById: Map<string, string>,
): ScenarioControlsEvidenceRow[] {
  return auditEvents.slice(0, 6).map((event) => ({
    id: event.id,
    eventType: event.eventType,
    clinicName: clinicNameById.get(event.clinicId) ?? event.clinicId,
    actorName: event.actorName,
    summary: event.summary,
    createdAt: event.createdAt,
  }));
}

function buildCommandGroups({
  stockoutClinicLabel,
  staffingClinicLabel,
  offlineQueueCount,
}: {
  stockoutClinicLabel: string;
  staffingClinicLabel: string;
  offlineQueueCount: number;
}): ScenarioControlCommandGroup[] {
  return [
    {
      id: "baseline",
      title: "Baseline",
      description: "Return the workspace to a known operating state.",
      commands: [
        {
          id: "reset",
          label: "Reset scenario",
          actionLabel: "Reset scenario",
          shortDescription: "Restore seeded district state and clear queued local reports.",
          targetLabel: "District operating baseline",
          impactLabel: "State reset",
          impactDescription:
            "Clears local scenario changes, returns clinic states to the seeded baseline, and removes queued offline reports.",
          expectedEvidence: [
            "Seeded clinic state",
            "Open alerts restored",
            "Audit stream reset",
          ],
          tone: "info",
        },
      ],
    },
    {
      id: "incident",
      title: "Incident rehearsal",
      description: "Exercise operational pressure paths and routing evidence.",
      commands: [
        {
          id: "incident_replay",
          label: "Replay incident",
          actionLabel: "Replay incident",
          shortDescription: "Run the full report, alert, reroute, audit, and webhook chain.",
          targetLabel: stockoutClinicLabel,
          impactLabel: "End-to-end chain",
          impactDescription:
            "Applies each incident step in sequence so the page shows the complete evidence trail for one operational disruption.",
          expectedEvidence: [
            "Field report",
            "District alert",
            "Reroute recommendation",
            "Partner webhook",
          ],
          tone: "attention",
        },
        {
          id: "stockout",
          label: "Trigger stockout",
          actionLabel: "Trigger stockout",
          shortDescription: "Escalate medicines pressure for a selected clinic.",
          targetLabel: stockoutClinicLabel,
          impactLabel: "Medicines incident",
          impactDescription:
            "Moves the clinic into degraded or non-functional stock status and opens a stockout alert for routing review.",
          expectedEvidence: [
            "Clinic status update",
            "Stockout alert",
            "Audit trail entry",
          ],
          tone: "blocked",
        },
        {
          id: "staffing_shortage",
          label: "Trigger staffing shortage",
          actionLabel: "Trigger staffing shortage",
          shortDescription: "Create a constrained-throughput staffing incident.",
          targetLabel: staffingClinicLabel,
          impactLabel: "Staffing pressure",
          impactDescription:
            "Marks the clinic as degraded from critical nurse shortage and raises queue pressure for district follow-up.",
          expectedEvidence: [
            "Clinic status update",
            "Staffing alert",
            "Audit trail entry",
          ],
          tone: "attention",
        },
        {
          id: "reroute",
          label: "Trigger reroute scenario",
          actionLabel: "Trigger reroute scenario",
          shortDescription: "Focus the state on an alternative-routing recommendation.",
          targetLabel: stockoutClinicLabel,
          impactLabel: "Routing proof",
          impactDescription:
            "Combines stock pressure with a reroute event so the audit stream shows the recommended alternative clinic.",
          expectedEvidence: [
            "Stock pressure",
            "Alternative route",
            "Audit trail entry",
          ],
          tone: "attention",
        },
      ],
    },
    {
      id: "data_flow",
      title: "Data flow",
      description: "Exercise offline report ingestion and sync evidence.",
      commands: [
        {
          id: "offline_sync",
          label: "Sync offline reports",
          actionLabel: "Sync offline reports",
          shortDescription:
            offlineQueueCount > 0
              ? `Flush ${pluralize(offlineQueueCount, "queued report")} into the district stream.`
              : "Seed and sync one offline report into the district stream.",
          targetLabel:
            offlineQueueCount > 0
              ? pluralize(offlineQueueCount, "queued report")
              : "Offline field report",
          impactLabel: "Sync path",
          impactDescription:
            "Confirms that local field-report evidence can move into the shared scenario stream and refresh sync state.",
          expectedEvidence: [
            "Offline receipt",
            "Sync event",
            "Last sync update",
          ],
          tone: offlineQueueCount > 0 ? "attention" : "info",
        },
      ],
    },
  ];
}

export function buildScenarioControlsViewModel({
  state,
  stockoutClinicLabel,
  staffingClinicLabel,
  selectedCommandId,
  lastAction,
}: BuildScenarioControlsViewModelInput): ScenarioControlsViewModel {
  const activeAlerts = state.alerts.filter((alert) => alert.status !== "resolved");
  const offlineQueueCount = state.offlineQueue.length;
  const nonOperationalClinicCount = state.clinicStates.filter(
    (clinicState) => clinicState.status !== "operational",
  ).length;
  const clinicNameById = new Map(
    state.clinics.map((clinic) => [clinic.id, clinic.name]),
  );
  const commandGroups = buildCommandGroups({
    stockoutClinicLabel,
    staffingClinicLabel,
    offlineQueueCount,
  });
  const commands = commandGroups.flatMap((group) => group.commands);
  const selectedCommand =
    commands.find((command) => command.id === selectedCommandId) ?? commands[0];

  return {
    summaryMetrics: [
      {
        id: "run_state",
        label: "Run state",
        value: "Ready",
        detail:
          nonOperationalClinicCount > 0
            ? `${pluralize(nonOperationalClinicCount, "clinic", "clinics")} outside baseline`
            : "All clinics match the operating baseline",
        tone: "clear",
      },
      {
        id: "active_alerts",
        label: "Active alerts",
        value: String(activeAlerts.length),
        detail: "Open scenario signals",
        tone: toneForCount(activeAlerts.length),
      },
      {
        id: "offline_queue",
        label: "Offline queue",
        value: String(offlineQueueCount),
        detail: "Reports waiting for sync",
        tone: toneForCount(offlineQueueCount),
      },
      {
        id: "audit_events",
        label: "Audit events",
        value: String(state.auditEvents.length),
        detail: "Latest evidence available below",
        tone: state.auditEvents.length > 0 ? "info" : "attention",
      },
    ],
    commandGroups,
    selectedCommand,
    evidenceRows: buildEvidenceRows(state.auditEvents, clinicNameById),
    safetyNotes: [
      {
        label: "Browser-local run",
        detail: "Scenario actions update this review session only.",
      },
      {
        label: "Audit trail generated",
        detail: "Every run adds or refreshes evidence in the local audit stream.",
      },
      {
        label: "Reset available",
        detail: "Return to the seeded operating state at any point.",
      },
    ],
    statusMessage: lastAction,
  };
}
