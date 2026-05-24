import type { ClientAuthSession } from "@/lib/auth/api";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import {
  buildDistrictCommandCenter,
  type DistrictSeverityLabel,
} from "@/lib/demo/district-command-center";
import { buildDistrictCommandClinicInputs } from "@/lib/demo/district-command-center-adapter";
import {
  buildDistrictClinicEvidenceViewModel,
  type DistrictClinicEvidenceFilters,
} from "@/lib/demo/district-clinic-evidence-view-model";
import {
  buildDistrictClinicNetworkViewModel,
  type DistrictClinicNetworkFilters,
} from "@/lib/demo/district-clinic-network-view-model";
import {
  buildDistrictInterventionsViewModel,
  type DistrictInterventionsFilters,
} from "@/lib/demo/district-interventions-view-model";
import { getActiveAlerts } from "@/lib/demo/selectors";
import type { DemoState } from "@/lib/demo/types";

export type DistrictHomeTone = "clear" | "attention" | "blocked" | "info";
export type DistrictHomeModuleId =
  | "severity"
  | "network"
  | "evidence"
  | "interventions";
export type DistrictHomeSupportingSectionId =
  | "report-review"
  | "data-trust"
  | "scenario-controls"
  | "field-signal-stream"
  | "clinic-roster";

export type DistrictHomeSignal = {
  label: string;
  value: string;
  detail: string;
  tone: DistrictHomeTone;
};

export type DistrictHomeModuleCard = {
  id: DistrictHomeModuleId;
  title: string;
  href: string;
  value: string;
  label: string;
  detail: string;
  actionLabel: string;
  tone: DistrictHomeTone;
};

export type DistrictHomeCommandMapPin = {
  clinicId: string;
  clinicName: string;
  href: string;
  label: string;
  score: number;
  statusLabel: string;
  freshnessLabel: string;
  coverageLabel: string;
  x: number;
  y: number;
  isSelected: boolean;
  tone: DistrictHomeTone;
};

export type DistrictHomeDecisionTimelineItem = {
  id: "severity" | "evidence" | "intervention";
  label: string;
  title: string;
  detail: string;
  href: string;
  tone: DistrictHomeTone;
};

export type DistrictHomeDecisionPacket = {
  clinicId: string | null;
  clinicName: string;
  severityLabel: string;
  score: number;
  action: string;
  impact: string;
  verification: string;
  evidenceTitle: string;
  evidenceDetail: string;
  interventionTitle: string;
  interventionDetail: string;
  routePlan: string;
  timeline: DistrictHomeDecisionTimelineItem[];
  tone: DistrictHomeTone;
};

export type DistrictHomeViewModel = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: {
      label: string;
      href: string;
    };
    secondaryAction: {
      label: string;
      href: string;
    };
    primaryDecision: {
      clinicId: string | null;
      clinicName: string;
      score: number;
      label: string;
      action: string;
      impact: string;
      verification: string;
      tone: DistrictHomeTone;
    };
    signals: DistrictHomeSignal[];
  };
  moduleCards: DistrictHomeModuleCard[];
  commandPreview: {
    commandMap: {
      scopeLabel: string;
      pins: DistrictHomeCommandMapPin[];
    };
    decisionPacket: DistrictHomeDecisionPacket;
    queueItems: Array<{
      clinicId: string;
      clinicName: string;
      score: number;
      label: string;
      action: string;
      href: string;
      tone: DistrictHomeTone;
    }>;
    selectedClinic: ReturnType<typeof buildDistrictClinicNetworkViewModel>["selectedClinic"];
    selectedEvidence: ReturnType<typeof buildDistrictClinicEvidenceViewModel>["selectedPacket"];
    interventionPlan: ReturnType<typeof buildDistrictInterventionsViewModel>["selectedPlan"];
  };
  supportingSections: Array<{
    id: DistrictHomeSupportingSectionId;
    title: string;
    detail: string;
    tone: DistrictHomeTone;
  }>;
};

type BuildDistrictHomeViewModelInput = {
  pendingEvidenceReportCount: number;
  session: ClientAuthSession;
  state: DemoState;
  syncSummary: SyncSummaryApiResponse | null;
};

const networkFilters: DistrictClinicNetworkFilters = {
  status: "all",
  freshness: "all",
  source: "all",
  service: "all",
  query: "",
};

const evidenceFilters: DistrictClinicEvidenceFilters = {
  kind: "all",
  queue: "all",
  status: "all",
  source: "all",
  clinic: "all",
  query: "",
};

const interventionFilters: DistrictInterventionsFilters = {
  lens: "all",
  priority: "all",
  service: "all",
  query: "",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(value);
}

function toneForSeverity(severity: DistrictSeverityLabel | null): DistrictHomeTone {
  if (severity === "critical") {
    return "blocked";
  }

  if (severity === "watch" || severity === "attention") {
    return "attention";
  }

  return "clear";
}

function actionTone(count: number): DistrictHomeTone {
  return count > 0 ? "attention" : "clear";
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatStatusLabel(value: string) {
  return statusLabel(value)
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clampPercent(value: number) {
  return Math.min(88, Math.max(12, value));
}

function normalizeMapCoordinate({
  max,
  min,
  value,
}: {
  max: number;
  min: number;
  value: number;
}) {
  if (max === min) {
    return 50;
  }

  return 12 + ((value - min) / (max - min)) * 76;
}

function buildCommandMapPins({
  clinics,
  queueItems,
  selectedClinicId,
}: {
  clinics: ReturnType<typeof buildDistrictClinicNetworkViewModel>["clinics"];
  queueItems: ReturnType<typeof buildDistrictCommandCenter>["queue"];
  selectedClinicId: string | null;
}): DistrictHomeCommandMapPin[] {
  const queueByClinicId = new Map(queueItems.map((item) => [item.clinicId, item]));
  const latitudes = clinics.map((clinic) => clinic.latitude);
  const longitudes = clinics.map((clinic) => clinic.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return clinics
    .map((clinic) => {
      const queueItem = queueByClinicId.get(clinic.clinicId);
      const tone = queueItem
        ? toneForSeverity(queueItem.severityLabel)
        : actionTone(clinic.activeAlertCount);

      return {
        clinicId: clinic.clinicId,
        clinicName: clinic.clinicName,
        href: `/district/clinics/${encodeURIComponent(
          clinic.clinicId,
        )}?from=district-home`,
        label: queueItem ? statusLabel(queueItem.severityLabel) : clinic.coverageLabel,
        score: queueItem?.score ?? 0,
        statusLabel: formatStatusLabel(clinic.status),
        freshnessLabel: formatStatusLabel(clinic.freshness),
        coverageLabel: clinic.coverageLabel,
        x: clampPercent(
          normalizeMapCoordinate({
            max: maxLongitude,
            min: minLongitude,
            value: clinic.longitude,
          }),
        ),
        y: clampPercent(
          100 -
            normalizeMapCoordinate({
              max: maxLatitude,
              min: minLatitude,
              value: clinic.latitude,
            }),
        ),
        isSelected: clinic.clinicId === selectedClinicId,
        tone,
      };
    })
    .sort((left, right) => {
      if (left.isSelected !== right.isSelected) {
        return left.isSelected ? -1 : 1;
      }

      return right.score - left.score || left.clinicName.localeCompare(right.clinicName);
    });
}

function buildDecisionPacket({
  evidence,
  interventionPlan,
  selectedItem,
  selectedTone,
}: {
  evidence: ReturnType<typeof buildDistrictClinicEvidenceViewModel>;
  interventionPlan: ReturnType<typeof buildDistrictInterventionsViewModel>["selectedPlan"];
  selectedItem: ReturnType<typeof buildDistrictCommandCenter>["selectedItem"];
  selectedTone: DistrictHomeTone;
}): DistrictHomeDecisionPacket {
  const selectedEvidence = evidence.selectedPacket;
  const clinicId = selectedItem?.clinicId ?? null;
  const clinicName =
    selectedItem?.clinicName ??
    selectedEvidence?.clinicName ??
    interventionPlan?.clinicName ??
    "No clinic signal loaded";
  const severityHref = clinicId
    ? `/district/clinics/${encodeURIComponent(clinicId)}?from=district-home`
    : "/district/severity-queue";
  const evidenceHref =
    selectedEvidence?.reportHref ?? selectedEvidence?.clinicHref ?? "/district/clinic-evidence";
  const interventionHref = interventionPlan?.severityHref ?? "/district/interventions";
  const fallbackAction =
    "Load district signal before changing routing or intervention state.";
  const fallbackImpact =
    "No patient-impact signal is available until clinic data loads.";
  const fallbackVerification = "Confirm data freshness before operational decisions.";

  return {
    clinicId,
    clinicName,
    severityLabel: selectedItem ? statusLabel(selectedItem.severityLabel) : "No queue item",
    score: selectedItem?.score ?? 0,
    action: selectedItem?.recommendedAction ?? fallbackAction,
    impact: selectedItem?.patientImpact ?? fallbackImpact,
    verification:
      selectedItem?.verificationNeed ??
      selectedEvidence?.verificationNeed ??
      interventionPlan?.verificationNeed ??
      fallbackVerification,
    evidenceTitle: selectedEvidence?.title ?? "No evidence packet selected",
    evidenceDetail:
      selectedEvidence?.recommendedAction ??
      "Review linked evidence before closing the decision.",
    interventionTitle: interventionPlan?.stageLabel ?? "No active plan",
    interventionDetail:
      interventionPlan?.expectedOutcome ??
      "No intervention route plan is selected.",
    routePlan:
      interventionPlan?.routePlan ??
      "No route plan is selected for this clinic.",
    timeline: [
      {
        id: "severity",
        label: "Severity",
        title: selectedItem
          ? `${statusLabel(selectedItem.severityLabel)} ${selectedItem.score}`
          : "No queue item",
        detail: selectedItem?.recommendedAction ?? fallbackAction,
        href: severityHref,
        tone: selectedTone,
      },
      {
        id: "evidence",
        label: "Evidence",
        title: selectedEvidence?.title ?? "Evidence queue",
        detail:
          selectedEvidence?.timelineSummary ??
          "Open the evidence queue before closing this district decision.",
        href: evidenceHref,
        tone: (selectedEvidence?.tone as DistrictHomeTone | undefined) ?? selectedTone,
      },
      {
        id: "intervention",
        label: "Intervention",
        title: interventionPlan?.stageLabel ?? "No active plan",
        detail:
          interventionPlan?.routePlan ??
          "Create or update an intervention plan before changing routing.",
        href: interventionHref,
        tone: (interventionPlan?.proofTone as DistrictHomeTone | undefined) ?? selectedTone,
      },
    ],
    tone: selectedTone,
  };
}

export function buildDistrictHomeViewModel({
  pendingEvidenceReportCount,
  session,
  state,
  syncSummary,
}: BuildDistrictHomeViewModelInput): DistrictHomeViewModel {
  const commandCenter = buildDistrictCommandCenter({
    session,
    clinics: buildDistrictCommandClinicInputs(state),
    activeAlertCount: getActiveAlerts(state).length,
    offlineQueueCount: state.offlineQueue.length,
    lastSyncAt: state.lastSyncAt,
    selectedClinicId: null,
  });
  const selectedClinicId = commandCenter.selectedItem?.clinicId ?? null;
  const network = buildDistrictClinicNetworkViewModel({
    state,
    session,
    filters: networkFilters,
    selectedClinicId,
  });
  const initialEvidence = buildDistrictClinicEvidenceViewModel({
    state,
    filters: evidenceFilters,
    selectedEvidenceId: null,
  });
  const selectedEvidenceId =
    initialEvidence.rows.find((row) => row.clinicId === selectedClinicId)?.evidenceId ?? null;
  const evidence = selectedEvidenceId
    ? buildDistrictClinicEvidenceViewModel({
        state,
        filters: evidenceFilters,
        selectedEvidenceId,
      })
    : initialEvidence;
  const initialInterventions = buildDistrictInterventionsViewModel({
    state,
    filters: interventionFilters,
    selectedPlanId: null,
  });
  const selectedPlanId =
    initialInterventions.plans.find((plan) => plan.clinicId === selectedClinicId)?.planId ?? null;
  const interventions = selectedPlanId
    ? buildDistrictInterventionsViewModel({
        state,
        filters: interventionFilters,
        selectedPlanId,
      })
    : initialInterventions;
  const selectedItem = commandCenter.selectedItem;
  const selectedTone = toneForSeverity(selectedItem?.severityLabel ?? null);
  const routingMoves = interventions.plans.filter((plan) => plan.stage === "routing").length;
  const activePlanCount = interventions.plans.filter((plan) => plan.stage !== "monitoring").length;
  const evidenceDueCount = evidence.rows.filter((row) => row.tone === "blocked").length;
  const alertCount = commandCenter.analytics.activeAlertCount;
  const districtLabel =
    session.district ?? session.organisationName ?? commandCenter.brief.districtLabel;

  return {
    hero: {
      eyebrow: "District command",
      title: `${districtLabel} operating picture`,
      description:
        "Start with the decision that can change patient routing, then move into the module that owns the evidence.",
      primaryAction: {
        label: "Open severity queue",
        href: "/district/severity-queue",
      },
      secondaryAction: {
        label: "Review evidence",
        href: "/district/clinic-evidence",
      },
      primaryDecision: {
        clinicId: selectedItem?.clinicId ?? null,
        clinicName: selectedItem?.clinicName ?? "No clinic signal loaded",
        score: selectedItem?.score ?? 0,
        label: selectedItem ? statusLabel(selectedItem.severityLabel) : "No queue item",
        action:
          selectedItem?.recommendedAction ??
          "Load district signal before changing routing or intervention state.",
        impact:
          selectedItem?.patientImpact ??
          "No patient-impact signal is available until clinic data loads.",
        verification:
          selectedItem?.verificationNeed ??
          "Confirm data freshness before operational decisions.",
        tone: selectedTone,
      },
      signals: [
        {
          label: "Active alerts",
          value: formatCount(alertCount),
          detail: "Open clinic alerts linked to district action",
          tone: actionTone(alertCount),
        },
        {
          label: "Evidence due",
          value: formatCount(evidenceDueCount),
          detail: `${formatCount(pendingEvidenceReportCount)} pending report reviews`,
          tone: actionTone(evidenceDueCount + pendingEvidenceReportCount),
        },
        {
          label: "Routing moves",
          value: formatCount(routingMoves),
          detail: "Plans changing or protecting patient flow",
          tone: actionTone(routingMoves),
        },
        {
          label: "Clinics visible",
          value: formatCount(network.coverage.visibleClinics),
          detail: `${formatCount(network.coverage.routingReadyClinics)} routing-ready clinics`,
          tone: "info",
        },
      ],
    },
    moduleCards: [
      {
        id: "severity",
        title: "Severity queue",
        href: "/district/severity-queue",
        value: formatCount(commandCenter.queue.length),
        label: "Clinics ranked",
        detail: selectedItem
          ? `${selectedItem.clinicName} is the current top decision.`
          : "No clinics are currently ranked for action.",
        actionLabel: "Triage queue",
        tone: selectedTone,
      },
      {
        id: "network",
        title: "Clinic network",
        href: "/district/clinic-network",
        value: formatCount(network.coverage.routingReadyClinics),
        label: "Routing-ready",
        detail: `${formatCount(network.coverage.constrainedClinics)} constrained clinics and ${formatCount(
          network.coverage.freshnessRiskClinics,
        )} signals to verify.`,
        actionLabel: "Inspect capacity",
        tone: actionTone(network.coverage.constrainedClinics + network.coverage.freshnessRiskClinics),
      },
      {
        id: "evidence",
        title: "Clinic evidence",
        href: "/district/clinic-evidence",
        value: formatCount(evidence.rows.length),
        label: "Linked records",
        detail: evidence.header.readiness.detail,
        actionLabel: "Review evidence",
        tone: actionTone(evidenceDueCount),
      },
      {
        id: "interventions",
        title: "Interventions",
        href: "/district/interventions",
        value: formatCount(activePlanCount),
        label: "Active plans",
        detail:
          interventions.selectedPlan?.routePlan ??
          "No active intervention plan is selected.",
        actionLabel: "Manage plans",
        tone: actionTone(activePlanCount),
      },
    ],
    commandPreview: {
      commandMap: {
        scopeLabel: districtLabel,
        pins: buildCommandMapPins({
          clinics: network.clinics,
          queueItems: commandCenter.queue,
          selectedClinicId,
        }),
      },
      decisionPacket: buildDecisionPacket({
        evidence,
        interventionPlan: interventions.selectedPlan,
        selectedItem,
        selectedTone,
      }),
      queueItems: commandCenter.queue.slice(0, 4).map((item) => ({
        clinicId: item.clinicId,
        clinicName: item.clinicName,
        score: item.score,
        label: statusLabel(item.severityLabel),
        action: item.recommendedAction,
        href: `/district/clinics/${encodeURIComponent(
          item.clinicId,
        )}?from=district-home`,
        tone: toneForSeverity(item.severityLabel),
      })),
      selectedClinic: network.selectedClinic,
      selectedEvidence: evidence.selectedPacket,
      interventionPlan: interventions.selectedPlan,
    },
    supportingSections: [
      {
        id: "report-review",
        title: "Report review",
        detail: `${formatCount(pendingEvidenceReportCount)} pending evidence reports need a district decision.`,
        tone: actionTone(pendingEvidenceReportCount),
      },
      {
        id: "data-trust",
        title: "Data trust",
        detail: `${formatCount(syncSummary?.staleClinics ?? 0)} stale and ${formatCount(
          syncSummary?.needsConfirmationClinics ?? 0,
        )} needs-confirmation clinic states.`,
        tone: actionTone(
          (syncSummary?.staleClinics ?? 0) + (syncSummary?.needsConfirmationClinics ?? 0),
        ),
      },
      {
        id: "scenario-controls",
        title: "Scenario controls",
        detail: "Run replay, sync offline reports, or trigger route-impacting incidents.",
        tone: "info",
      },
      {
        id: "field-signal-stream",
        title: "Field signal stream",
        detail: "Recent reports and alerts remain available below the command summary.",
        tone: actionTone(alertCount),
      },
      {
        id: "clinic-roster",
        title: "Clinic roster",
        detail: `${formatCount(network.coverage.totalClinics)} clinics stay available for audit and detail review.`,
        tone: "info",
      },
    ],
  };
}
