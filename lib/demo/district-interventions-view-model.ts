import {
  buildDistrictCommandCenter,
  type DistrictSeverityLabel,
} from "@/lib/demo/district-command-center";
import { buildDistrictCommandClinicInputs } from "@/lib/demo/district-command-center-adapter";
import {
  getActiveAlerts,
  getAlternativeClinics,
  getClinicAuditEvents,
  getClinicRows,
  getRecentReportStream,
} from "@/lib/demo/selectors";
import type {
  Alert,
  AuditEvent,
  ClinicRow,
  DemoState,
  ReportStreamItem,
} from "@/lib/demo/types";

const RETURN_SOURCE = "district-interventions";

export type DistrictInterventionsLens =
  | "all"
  | "routing"
  | "verification"
  | "proof_due"
  | "monitoring";
export type DistrictInterventionsStage = Exclude<DistrictInterventionsLens, "all">;
export type DistrictInterventionsPriority = DistrictSeverityLabel | "all";
export type DistrictInterventionsTone = "clear" | "attention" | "blocked" | "info";

export type DistrictInterventionsFilters = {
  lens: DistrictInterventionsLens;
  priority: DistrictInterventionsPriority;
  service: string;
  query: string;
};

export type DistrictInterventionsMetric = {
  label: string;
  value: string;
  detail: string;
  tone: DistrictInterventionsTone;
};

export type DistrictInterventionsHeader = {
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
};

export type DistrictInterventionsStageLane = {
  id: DistrictInterventionsStage;
  label: string;
  count: number;
  detail: string;
  tone: DistrictInterventionsTone;
};

export type DistrictInterventionRouteOption = {
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  status: ClinicRow["status"];
  freshness: ClinicRow["freshness"];
  service: string;
  clinicHref: string;
};

export type DistrictInterventionTimelineItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  occurredAt: string;
  tone: DistrictInterventionsTone;
};

export type DistrictInterventionAction = {
  id: "stage_plan" | "assign_owner" | "protect_route" | "review_evidence";
  label: string;
  detail: string;
  href: string | null;
  tone: DistrictInterventionsTone;
};

export type DistrictInterventionPlan = {
  planId: string;
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  district: string;
  priority: DistrictSeverityLabel;
  score: number;
  stage: DistrictInterventionsStage;
  stageLabel: string;
  title: string;
  patientImpact: string;
  ownerLabel: string;
  routePlan: string;
  proofStatus: string;
  proofTone: DistrictInterventionsTone;
  verificationNeed: string;
  expectedOutcome: string;
  services: string[];
  updatedAt: string | null;
  clinicHref: string;
  evidenceHref: string;
  severityHref: string;
  routeOptions: DistrictInterventionRouteOption[];
};

export type DistrictInterventionSelectedPlan = DistrictInterventionPlan & {
  actions: DistrictInterventionAction[];
  decisionSummary: Array<{
    label: string;
    value: string;
    detail: string;
    tone: DistrictInterventionsTone;
  }>;
  navigation: {
    nextPlanId: string | null;
    position: number;
    previousPlanId: string | null;
    total: number;
  };
  tabs: Array<{
    id: "decision" | "route" | "proof" | "timeline";
    label: string;
  }>;
  timeline: DistrictInterventionTimelineItem[];
};

export type DistrictInterventionsViewModel = {
  header: DistrictInterventionsHeader;
  metrics: DistrictInterventionsMetric[];
  stageLanes: DistrictInterventionsStageLane[];
  plans: DistrictInterventionPlan[];
  selectedPlan: DistrictInterventionSelectedPlan | null;
  filterOptions: {
    services: string[];
  };
  emptyState: {
    title: string;
    description: string;
  };
};

type BuildDistrictInterventionsViewModelInput = {
  state: DemoState;
  filters: DistrictInterventionsFilters;
  selectedPlanId: string | null;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(value);
}

function encodeRouteId(value: string) {
  return encodeURIComponent(value);
}

function clinicHref(clinicId: string) {
  return `/district/clinics/${encodeRouteId(clinicId)}?from=${RETURN_SOURCE}`;
}

function evidenceHref(clinicId: string) {
  return `/district/clinic-evidence?clinic=${encodeRouteId(clinicId)}`;
}

function getStageLabel(stage: DistrictInterventionsStage) {
  if (stage === "routing") {
    return "Routing";
  }

  if (stage === "verification") {
    return "Verification";
  }

  if (stage === "proof_due") {
    return "Proof due";
  }

  return "Monitoring";
}

function toneForPriority(priority: DistrictSeverityLabel): DistrictInterventionsTone {
  if (priority === "critical") {
    return "blocked";
  }

  if (priority === "watch" || priority === "attention") {
    return "attention";
  }

  return "clear";
}

function getStage(plan: {
  availableAlternatives: number;
  freshness: ClinicRow["freshness"];
  hasActiveAlert: boolean;
  isInOfflineQueue: boolean;
  priority: DistrictSeverityLabel;
  status: ClinicRow["status"];
}) {
  if (plan.status === "non_functional") {
    return "routing";
  }

  if (plan.hasActiveAlert || plan.isInOfflineQueue || plan.freshness !== "fresh") {
    return "verification";
  }

  if (plan.priority !== "stable" || plan.availableAlternatives <= 1) {
    return "proof_due";
  }

  return "monitoring";
}

function getOwnerLabel(plan: {
  freshness: ClinicRow["freshness"];
  hasActiveAlert: boolean;
  isInOfflineQueue: boolean;
  status: ClinicRow["status"];
}) {
  if (plan.status === "non_functional") {
    return "District routing lead";
  }

  if (plan.hasActiveAlert) {
    return "District alerting";
  }

  if (plan.isInOfflineQueue) {
    return "Offline sync owner";
  }

  if (plan.freshness !== "fresh") {
    return "Field verification";
  }

  if (plan.status === "degraded") {
    return "Clinic coordinator";
  }

  return "Monitoring owner";
}

function buildRoutePlan(
  clinic: ClinicRow,
  stage: DistrictInterventionsStage,
  routeOptions: DistrictInterventionRouteOption[],
) {
  const service = clinic.services[0] ?? "Primary care";
  const firstOption = routeOptions[0];

  if (stage === "routing" && firstOption) {
    return `Protect ${service} routing through ${firstOption.clinicName}.`;
  }

  if (stage === "routing") {
    return `Escalate ${service} coverage because no compatible alternative is currently ready.`;
  }

  if (stage === "verification") {
    return "Hold routing changes until the owner confirms the latest clinic signal.";
  }

  if (stage === "proof_due") {
    return "Keep the intervention staged until the proof step is attached.";
  }

  return "Keep normal routing available and monitor for new pressure.";
}

function getProofStatus(plan: {
  freshness: ClinicRow["freshness"];
  hasActiveAlert: boolean;
  isInOfflineQueue: boolean;
}): { label: string; tone: DistrictInterventionsTone } {
  if (plan.isInOfflineQueue) {
    return {
      label: "Offline proof pending",
      tone: "attention" satisfies DistrictInterventionsTone,
    };
  }

  if (plan.hasActiveAlert) {
    return {
      label: "Alert confirmation due",
      tone: "attention" satisfies DistrictInterventionsTone,
    };
  }

  if (plan.freshness !== "fresh") {
    return {
      label: "Fresh evidence due",
      tone: "attention" satisfies DistrictInterventionsTone,
    };
  }

  return {
    label: "Evidence current",
    tone: "clear" satisfies DistrictInterventionsTone,
  };
}

function routeOptionsForClinic(
  state: DemoState,
  clinic: ClinicRow,
): DistrictInterventionRouteOption[] {
  const primaryService = clinic.services[0];

  if (!primaryService) {
    return [];
  }

  return getAlternativeClinics(state, clinic.id, primaryService)
    .slice(0, 3)
    .map((alternative) => ({
      clinicId: alternative.id,
      clinicName: alternative.name,
      facilityCode: alternative.facilityCode,
      status: alternative.status,
      freshness: alternative.freshness,
      service: primaryService,
      clinicHref: clinicHref(alternative.id),
    }));
}

function buildTimeline(
  plan: DistrictInterventionPlan,
  alerts: Alert[],
  reports: ReportStreamItem[],
  auditEvents: AuditEvent[],
): DistrictInterventionTimelineItem[] {
  const activeAlert = alerts.find((alert) => alert.clinicId === plan.clinicId);
  const latestReport = reports.find((report) => report.clinicId === plan.clinicId);
  const latestAudit = auditEvents[0];
  const items: DistrictInterventionTimelineItem[] = [];

  if (activeAlert) {
    items.push({
      id: `alert-${activeAlert.id}`,
      label: "Alert",
      title: activeAlert.recommendedAction,
      detail: activeAlert.type.replaceAll("_", " "),
      occurredAt: activeAlert.createdAt,
      tone: activeAlert.severity === "critical" ? "blocked" : "attention",
    });
  }

  if (latestReport) {
    items.push({
      id: `report-${latestReport.id}`,
      label: "Report",
      title: latestReport.reason,
      detail: latestReport.reporterName,
      occurredAt: latestReport.receivedAt,
      tone: latestReport.status === "operational" ? "clear" : "attention",
    });
  }

  if (latestAudit) {
    items.push({
      id: `audit-${latestAudit.id}`,
      label: "Audit",
      title: latestAudit.summary,
      detail: latestAudit.actorName,
      occurredAt: latestAudit.createdAt,
      tone: "info",
    });
  }

  if (items.length === 0 && plan.updatedAt) {
    items.push({
      id: `signal-${plan.planId}`,
      label: "Signal",
      title: "Clinic signal loaded for intervention review.",
      detail: plan.ownerLabel,
      occurredAt: plan.updatedAt,
      tone: "info",
    });
  }

  return items.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

function buildActions(plan: DistrictInterventionPlan): DistrictInterventionAction[] {
  return [
    {
      id: "stage_plan",
      label: "Stage plan",
      detail: `Stage ${plan.clinicName} for ${plan.stageLabel.toLowerCase()} follow-up.`,
      href: null,
      tone: toneForPriority(plan.priority),
    },
    {
      id: "assign_owner",
      label: "Assign owner",
      detail: plan.ownerLabel,
      href: plan.clinicHref,
      tone: "info",
    },
    {
      id: "protect_route",
      label: "Protect route",
      detail: plan.routePlan,
      href: plan.routeOptions[0]?.clinicHref ?? "/district/clinic-network",
      tone: plan.stage === "routing" ? "blocked" : "attention",
    },
    {
      id: "review_evidence",
      label: "Review evidence",
      detail: plan.proofStatus,
      href: plan.evidenceHref,
      tone: plan.proofTone,
    },
  ];
}

function buildSelectedPlan(
  plan: DistrictInterventionPlan,
  alerts: Alert[],
  reports: ReportStreamItem[],
  auditEvents: AuditEvent[],
  navigation: DistrictInterventionSelectedPlan["navigation"],
): DistrictInterventionSelectedPlan {
  return {
    ...plan,
    actions: buildActions(plan),
    decisionSummary: [
      {
        label: "Priority",
        value: `${plan.priority} ${plan.score}`,
        detail: plan.patientImpact,
        tone: toneForPriority(plan.priority),
      },
      {
        label: "Owner",
        value: plan.ownerLabel,
        detail: plan.verificationNeed,
        tone: "info",
      },
      {
        label: "Proof",
        value: plan.proofStatus,
        detail: plan.evidenceHref,
        tone: plan.proofTone,
      },
    ],
    navigation,
    tabs: [
      { id: "decision", label: "Decision" },
      { id: "route", label: "Route" },
      { id: "proof", label: "Proof" },
      { id: "timeline", label: "Timeline" },
    ],
    timeline: buildTimeline(plan, alerts, reports, auditEvents),
  };
}

function planMatchesQuery(plan: DistrictInterventionPlan, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return [
    plan.clinicName,
    plan.facilityCode,
    plan.district,
    plan.ownerLabel,
    plan.routePlan,
    plan.patientImpact,
    plan.proofStatus,
    ...plan.services,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function planMatchesFilters(
  plan: DistrictInterventionPlan,
  filters: DistrictInterventionsFilters,
) {
  return (
    (filters.lens === "all" || plan.stage === filters.lens) &&
    (filters.priority === "all" || plan.priority === filters.priority) &&
    (filters.service === "all" || plan.services.includes(filters.service)) &&
    planMatchesQuery(plan, filters.query)
  );
}

function planMatchesStageLaneScope(
  plan: DistrictInterventionPlan,
  filters: DistrictInterventionsFilters,
) {
  return (
    (filters.priority === "all" || plan.priority === filters.priority) &&
    (filters.service === "all" || plan.services.includes(filters.service)) &&
    planMatchesQuery(plan, filters.query)
  );
}

function buildMetrics(plans: DistrictInterventionPlan[]): DistrictInterventionsMetric[] {
  const activePlans = plans.filter((plan) => plan.stage !== "monitoring").length;
  const routingMoves = plans.filter((plan) => plan.stage === "routing").length;
  const proofDue = plans.filter((plan) => plan.proofTone !== "clear").length;
  const owners = new Set(plans.filter((plan) => plan.stage !== "monitoring").map((plan) => plan.ownerLabel));

  return [
    {
      label: "Active plans",
      value: formatCount(activePlans),
      detail: "Clinics needing district follow-up",
      tone: activePlans > 0 ? "attention" : "clear",
    },
    {
      label: "Routing moves",
      value: formatCount(routingMoves),
      detail: "Plans changing or protecting patient routing",
      tone: routingMoves > 0 ? "blocked" : "clear",
    },
    {
      label: "Proof due",
      value: formatCount(proofDue),
      detail: "Plans waiting for attached evidence",
      tone: proofDue > 0 ? "attention" : "clear",
    },
    {
      label: "Owner load",
      value: formatCount(owners.size),
      detail: "Distinct owners carrying open plans",
      tone: owners.size > 2 ? "info" : "clear",
    },
  ];
}

function buildStageLanes(plans: DistrictInterventionPlan[]): DistrictInterventionsStageLane[] {
  const count = (stage: DistrictInterventionsStage) =>
    plans.filter((plan) => plan.stage === stage).length;

  return [
    {
      id: "routing",
      label: "Routing",
      count: count("routing"),
      detail: "Protect or change patient flow",
      tone: count("routing") > 0 ? "blocked" : "clear",
    },
    {
      id: "verification",
      label: "Verification",
      count: count("verification"),
      detail: "Confirm owner and current signal",
      tone: count("verification") > 0 ? "attention" : "clear",
    },
    {
      id: "proof_due",
      label: "Proof due",
      count: count("proof_due"),
      detail: "Attach evidence before closure",
      tone: count("proof_due") > 0 ? "attention" : "clear",
    },
    {
      id: "monitoring",
      label: "Monitoring",
      count: count("monitoring"),
      detail: "Keep watch without route changes",
      tone: "info",
    },
  ];
}

export function buildDistrictInterventionsViewModel({
  filters,
  selectedPlanId,
  state,
}: BuildDistrictInterventionsViewModelInput): DistrictInterventionsViewModel {
  const clinicRows = getClinicRows(state);
  const clinicRowsById = new Map(clinicRows.map((clinic) => [clinic.id, clinic]));
  const clinicInputs = buildDistrictCommandClinicInputs(state);
  const clinicInputsById = new Map(clinicInputs.map((clinic) => [clinic.id, clinic]));
  const commandCenter = buildDistrictCommandCenter({
    activeAlertCount: state.alerts.filter((alert) => alert.status !== "resolved").length,
    clinics: clinicInputs,
    lastSyncAt: state.lastSyncAt,
    offlineQueueCount: state.offlineQueue.length,
    selectedClinicId: null,
    session: null,
  });
  const alerts = getActiveAlerts(state);
  const reports = getRecentReportStream(state);
  const allPlans = commandCenter.queue
    .map((item): DistrictInterventionPlan | null => {
      const clinic = clinicRowsById.get(item.clinicId);
      const clinicInput = clinicInputsById.get(item.clinicId);

      if (!clinic || !clinicInput) {
        return null;
      }

      const routeOptions = routeOptionsForClinic(state, clinic);
      const stage = getStage({
        availableAlternatives: item.availableAlternatives,
        freshness: clinic.freshness,
        hasActiveAlert: clinicInput.hasActiveAlert,
        isInOfflineQueue: clinicInput.isInOfflineQueue,
        priority: item.severityLabel,
        status: clinic.status,
      });
      const proof = getProofStatus({
        freshness: clinic.freshness,
        hasActiveAlert: clinicInput.hasActiveAlert,
        isInOfflineQueue: clinicInput.isInOfflineQueue,
      });

      return {
        planId: `intervention-${clinic.id}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        facilityCode: clinic.facilityCode,
        district: clinic.district,
        priority: item.severityLabel,
        score: item.score,
        stage,
        stageLabel: getStageLabel(stage),
        title: item.recommendedAction,
        patientImpact: item.patientImpact,
        ownerLabel: getOwnerLabel({
          freshness: clinic.freshness,
          hasActiveAlert: clinicInput.hasActiveAlert,
          isInOfflineQueue: clinicInput.isInOfflineQueue,
          status: clinic.status,
        }),
        routePlan: buildRoutePlan(clinic, stage, routeOptions),
        proofStatus: proof.label,
        proofTone: proof.tone,
        verificationNeed: item.verificationNeed,
        expectedOutcome: `Stabilise ${clinic.name} and document the next owner.`,
        services: [...clinic.services],
        updatedAt: clinic.lastReportedAt,
        clinicHref: clinicHref(clinic.id),
        evidenceHref: evidenceHref(clinic.id),
        severityHref: "/district/severity-queue",
        routeOptions,
      };
    })
    .filter((plan): plan is DistrictInterventionPlan => plan !== null);
  const stageLanePlans = allPlans.filter((plan) =>
    planMatchesStageLaneScope(plan, filters),
  );
  const plans = allPlans.filter((plan) => planMatchesFilters(plan, filters));
  const selectedBase =
    plans.find((plan) => plan.planId === selectedPlanId) ?? plans[0] ?? null;
  const selectedIndex = selectedBase
    ? plans.findIndex((plan) => plan.planId === selectedBase.planId)
    : -1;
  const selectedPlan = selectedBase
    ? buildSelectedPlan(
        selectedBase,
        alerts,
        reports,
        getClinicAuditEvents(state, selectedBase.clinicId),
        {
          nextPlanId: plans[selectedIndex + 1]?.planId ?? null,
          position: selectedIndex + 1,
          previousPlanId: plans[selectedIndex - 1]?.planId ?? null,
          total: plans.length,
        },
      )
    : null;

  return {
    header: {
      eyebrow: "District command",
      title: "Interventions",
      description:
        "Track active clinic intervention plans from first signal through routing, owner handoff, and proof.",
      primaryAction: {
        label: "Open severity queue",
        href: "/district/severity-queue",
      },
      secondaryAction: {
        label: "Open evidence queue",
        href: "/district/clinic-evidence",
      },
    },
    metrics: buildMetrics(allPlans),
    stageLanes: buildStageLanes(stageLanePlans),
    plans,
    selectedPlan,
    filterOptions: {
      services: Array.from(new Set(allPlans.flatMap((plan) => plan.services))).sort(),
    },
    emptyState: {
      title:
        clinicRows.length === 0
          ? "No intervention signal loaded"
          : "No intervention plans match these filters",
      description:
        clinicRows.length === 0
          ? "Intervention planning will populate when district clinic signals are available."
          : "Clear filters or broaden the stage, priority, service, or search query.",
    },
  };
}
