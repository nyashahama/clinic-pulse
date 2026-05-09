import type { ClientAuthSession } from "@/lib/auth/api";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import type { Alert, ClinicRow, ClinicStatus, ReportStreamItem } from "@/lib/demo/types";

export type DashboardActionKind =
  | "open_clinic"
  | "sync_offline"
  | "review_alerts"
  | "review_stale"
  | "open_admin"
  | "open_field"
  | "monitor";

export type DashboardPrimaryAction = {
  kind: DashboardActionKind;
  label: string;
  description: string;
  clinicId?: string;
};

export type DashboardWorkflowStep = {
  id: "monitor" | "triage" | "act" | "verify";
  label: string;
  description: string;
  metric: string;
};

export type DashboardTriageBucket = {
  id: "interrupted" | "alerts" | "offline" | "stale";
  label: string;
  count: number;
  tone: "critical" | "warning" | "info" | "neutral";
};

export type DashboardSignalChartPoint = {
  label: string;
  operational: number;
  degraded: number;
  nonFunctional: number;
  unknown: number;
};

export type DashboardPersonalization = {
  userDisplayName: string;
  greeting: string;
  title: string;
  roleLabel: string;
  organisationLabel: string;
  districtLabel: string;
  scopeLabel: string;
  clinicCountContext: string;
  briefing: string;
  summary: string;
  workflowSteps: DashboardWorkflowStep[];
  primaryAction: DashboardPrimaryAction;
  primaryActions: DashboardPrimaryAction[];
  triageBuckets: DashboardTriageBucket[];
};

type BuildDashboardPersonalizationInput = {
  session: ClientAuthSession;
  district?: string;
  clinicRows: ClinicRow[];
  activeAlerts: Alert[];
  reportStream: ReportStreamItem[];
  syncSummary?: SyncSummaryApiResponse | null;
  offlineQueueCount?: number;
};

const ROLE_LABELS: Record<ClientAuthSession["role"], string> = {
  district_manager: "District manager",
  org_admin: "Organisation admin",
  system_admin: "System admin",
  reporter: "Reporter",
};

const ROLE_TITLES: Record<ClientAuthSession["role"], string> = {
  district_manager: "District command briefing",
  org_admin: "Organisation operations briefing",
  system_admin: "Platform operations briefing",
  reporter: "Field reporting handoff",
};

function getDisplayName(session: ClientAuthSession) {
  return session.displayName.trim() || session.email;
}

function getFirstName(displayName: string) {
  return displayName.split(/\s+/)[0] ?? displayName;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatOrganisationLabel(organisationId: number | undefined) {
  return organisationId === undefined ? "Demo organisation" : `Organisation ${organisationId}`;
}

function getDistrictLabel(input: BuildDashboardPersonalizationInput) {
  return input.session.district ?? input.district ?? "Demo district";
}

function countByStatus(clinicRows: ClinicRow[], status: ClinicStatus) {
  return clinicRows.filter((clinic) => clinic.status === status).length;
}

function getActiveHighPriorityAlerts(activeAlerts: Alert[]) {
  return activeAlerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "high",
  );
}

function findTopInterruptedClinic(clinicRows: ClinicRow[]) {
  return clinicRows.find((clinic) => clinic.status === "non_functional");
}

function buildPrimaryAction(input: BuildDashboardPersonalizationInput): DashboardPrimaryAction {
  const interruptedClinic = findTopInterruptedClinic(input.clinicRows);
  if (interruptedClinic) {
    return {
      kind: "open_clinic",
      label: `Open ${interruptedClinic.name}`,
      description: "Review the interruption, alternatives, and rerouting evidence.",
      clinicId: interruptedClinic.id,
    };
  }

  const highPriorityAlert = getActiveHighPriorityAlerts(input.activeAlerts)[0];
  if (highPriorityAlert) {
    return {
      kind: "review_alerts",
      label: "Review active alert",
      description: highPriorityAlert.recommendedAction,
      clinicId: highPriorityAlert.clinicId,
    };
  }

  const offlineQueueCount =
    input.offlineQueueCount ?? input.syncSummary?.pendingOfflineReports ?? 0;
  if (offlineQueueCount > 0) {
    return {
      kind: "sync_offline",
      label: "Sync offline reports",
      description: `Flush ${pluralize(offlineQueueCount, "queued report")} into the district feed.`,
    };
  }

  const staleCount =
    (input.syncSummary?.needsConfirmationClinics ?? 0) + (input.syncSummary?.staleClinics ?? 0);
  if (staleCount > 0) {
    return {
      kind: "review_stale",
      label: "Confirm stale signals",
      description: `Review ${pluralize(staleCount, "clinic")} needing confirmation or fresh evidence.`,
    };
  }

  if (input.session.role === "reporter") {
    return {
      kind: "open_field",
      label: "Continue field reporting",
      description: "Use the field workflow to submit the latest clinic status.",
    };
  }

  return {
    kind: input.session.role === "system_admin" ? "open_admin" : "monitor",
    label: input.session.role === "system_admin" ? "Review admin workspace" : "Keep monitoring",
    description: "No urgent interruptions are ahead of the routine operational review.",
  };
}

function buildPrimaryActions(primaryAction: DashboardPrimaryAction): DashboardPrimaryAction[] {
  const secondaryActions: DashboardPrimaryAction[] = [
    {
      kind: "review_alerts",
      label: "Review alerts",
      description: "Check active operational exceptions and recommended next steps.",
    },
    {
      kind: "review_stale",
      label: "Check stale signals",
      description: "Confirm clinics where current status confidence is aging.",
    },
    {
      kind: "monitor",
      label: "Monitor coverage",
      description: "Scan the district map, queue, and recent report stream.",
    },
  ];

  return [
    primaryAction,
    ...secondaryActions.filter((action) => action.kind !== primaryAction.kind),
  ];
}

function buildTriageBuckets(input: BuildDashboardPersonalizationInput): DashboardTriageBucket[] {
  const offlineQueueCount =
    input.offlineQueueCount ?? input.syncSummary?.pendingOfflineReports ?? 0;

  return [
    {
      id: "interrupted",
      label: "Interrupted clinics",
      count: countByStatus(input.clinicRows, "non_functional"),
      tone: "critical",
    },
    {
      id: "alerts",
      label: "High-priority alerts",
      count: getActiveHighPriorityAlerts(input.activeAlerts).length,
      tone: "warning",
    },
    {
      id: "offline",
      label: "Offline reports",
      count: offlineQueueCount,
      tone: offlineQueueCount > 0 ? "info" : "neutral",
    },
    {
      id: "stale",
      label: "Stale signals",
      count: (input.syncSummary?.needsConfirmationClinics ?? 0) + (input.syncSummary?.staleClinics ?? 0),
      tone: "warning",
    },
  ];
}

function buildWorkflowSteps(input: BuildDashboardPersonalizationInput): DashboardWorkflowStep[] {
  const interruptedCount = countByStatus(input.clinicRows, "non_functional");
  const degradedCount = countByStatus(input.clinicRows, "degraded");
  const offlineQueueCount =
    input.offlineQueueCount ?? input.syncSummary?.pendingOfflineReports ?? 0;
  const recentReportCount = input.reportStream.length;

  return [
    {
      id: "monitor",
      label: "Monitor",
      description: "Read the current district signal before acting.",
      metric: pluralize(input.clinicRows.length, "clinic"),
    },
    {
      id: "triage",
      label: "Triage",
      description: "Put interrupted and degraded services ahead of routine checks.",
      metric: `${interruptedCount} down, ${degradedCount} degraded`,
    },
    {
      id: "act",
      label: "Act",
      description: "Open the recommended clinic, alert, sync, or confirmation workflow.",
      metric: input.syncSummary ? pluralize(offlineQueueCount, "queued report") : "Live controls ready",
    },
    {
      id: "verify",
      label: "Verify",
      description: "Confirm the action through reports, audit events, and replay evidence.",
      metric: pluralize(recentReportCount, "recent report"),
    },
  ];
}

function buildBriefing(
  input: BuildDashboardPersonalizationInput,
  districtLabel: string,
  primaryAction: DashboardPrimaryAction,
) {
  switch (input.session.role) {
    case "org_admin":
      return `Track partner readiness and operational exceptions across ${districtLabel}. Next: ${primaryAction.label}.`;
    case "system_admin":
      return `Watch protected workflow health, data freshness, and cross-workflow evidence for ${districtLabel}. Next: ${primaryAction.label}.`;
    case "reporter":
      return `This dashboard is a handoff view. Field reports should continue in the reporting workflow. Next: ${primaryAction.label}.`;
    case "district_manager":
    default:
      return `Manage service availability, rerouting, stale confirmations, and offline sync for ${districtLabel}. Next: ${primaryAction.label}.`;
  }
}

export function buildDashboardPersonalization(
  input: BuildDashboardPersonalizationInput,
): DashboardPersonalization {
  const userDisplayName = getDisplayName(input.session);
  const firstName = getFirstName(userDisplayName);
  const roleLabel = ROLE_LABELS[input.session.role];
  const title = ROLE_TITLES[input.session.role];
  const districtLabel = getDistrictLabel(input);
  const organisationLabel = formatOrganisationLabel(input.session.organisationId);
  const primaryAction = buildPrimaryAction(input);
  const interruptedCount = countByStatus(input.clinicRows, "non_functional");
  const degradedCount = countByStatus(input.clinicRows, "degraded");
  const clinicCountContext = `${pluralize(input.clinicRows.length, "clinic")} in scope`;
  const briefing = buildBriefing(input, districtLabel, primaryAction);

  return {
    userDisplayName,
    greeting: `Good day, ${firstName}`,
    title,
    roleLabel,
    organisationLabel,
    districtLabel,
    scopeLabel: districtLabel,
    clinicCountContext,
    briefing,
    summary: `${clinicCountContext}: ${interruptedCount} interrupted, ${degradedCount} degraded.`,
    workflowSteps: buildWorkflowSteps(input),
    primaryAction,
    primaryActions: buildPrimaryActions(primaryAction),
    triageBuckets: buildTriageBuckets(input),
  };
}

function formatChartLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function emptyChartPoint(dateKey: string): DashboardSignalChartPoint {
  return {
    label: formatChartLabel(dateKey),
    operational: 0,
    degraded: 0,
    nonFunctional: 0,
    unknown: 0,
  };
}

function incrementChartStatus(point: DashboardSignalChartPoint, status: ClinicStatus) {
  switch (status) {
    case "operational":
      point.operational += 1;
      break;
    case "degraded":
      point.degraded += 1;
      break;
    case "non_functional":
      point.nonFunctional += 1;
      break;
    case "unknown":
      point.unknown += 1;
      break;
  }
}

export function buildDistrictSignalChartData(
  reportStream: ReportStreamItem[],
): DashboardSignalChartPoint[] {
  const pointsByDate = new Map<string, DashboardSignalChartPoint>();

  for (const report of reportStream) {
    const dateKey = report.receivedAt.slice(0, 10);
    const point = pointsByDate.get(dateKey) ?? emptyChartPoint(dateKey);
    incrementChartStatus(point, report.status);
    pointsByDate.set(dateKey, point);
  }

  return [...pointsByDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, point]) => point);
}
