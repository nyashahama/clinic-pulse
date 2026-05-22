import {
  getActiveAlerts,
  getClinicRows,
  getRecentReportStream,
} from "@/lib/demo/selectors";
import type {
  Alert,
  AuditEvent,
  ClinicRow,
  ClinicStatus,
  DemoState,
  ReportStreamItem,
} from "@/lib/demo/types";

const RETURN_SOURCE = "district-clinic-evidence";

export type DistrictClinicEvidenceKind = "all" | "report" | "audit" | "alert";
export type DistrictClinicEvidenceSource =
  | "all"
  | ReportStreamItem["source"]
  | "audit_log"
  | "alert";
export type DistrictClinicEvidenceTone = "clear" | "attention" | "blocked" | "info";

export type DistrictClinicEvidenceFilters = {
  kind: DistrictClinicEvidenceKind;
  status: ClinicStatus | "all";
  source: DistrictClinicEvidenceSource;
  clinic: string;
  query: string;
};

export type DistrictClinicEvidenceMetric = {
  label: string;
  value: string;
  detail: string;
  tone: DistrictClinicEvidenceTone;
};

export type DistrictClinicEvidenceHeader = {
  eyebrow: string;
  title: string;
  description: string;
  scope: string;
  readiness: {
    label: string;
    value: string;
    detail: string;
    tone: DistrictClinicEvidenceTone;
  };
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
};

export type DistrictClinicEvidenceQueueChip = {
  id: "all" | "needs_action" | "reports" | "alerts" | "audit";
  label: string;
  count: number;
  tone: DistrictClinicEvidenceTone;
};

export type DistrictClinicEvidenceClinicOption = {
  label: string;
  value: string;
};

export type DistrictClinicEvidenceRow = {
  id: string;
  evidenceId: string;
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  kind: Exclude<DistrictClinicEvidenceKind, "all">;
  title: string;
  detail: string;
  status: ClinicStatus;
  source: Exclude<DistrictClinicEvidenceSource, "all">;
  actorName: string;
  occurredAt: string;
  tone: DistrictClinicEvidenceTone;
  reportHref: string | null;
  clinicHref: string;
};

export type DistrictClinicEvidencePacket = DistrictClinicEvidenceRow & {
  actionTone: DistrictClinicEvidenceTone;
  provenance: Array<{ label: string; value: string }>;
  recommendedAction: string;
  timelineSummary: string;
  verificationNeed: string;
};

export type DistrictClinicEvidenceViewModel = {
  header: DistrictClinicEvidenceHeader;
  metrics: DistrictClinicEvidenceMetric[];
  queue: {
    title: string;
    description: string;
    chips: DistrictClinicEvidenceQueueChip[];
  };
  rows: DistrictClinicEvidenceRow[];
  selectedPacket: DistrictClinicEvidencePacket | null;
  timeline: DistrictClinicEvidenceRow[];
  filterOptions: {
    clinics: DistrictClinicEvidenceClinicOption[];
    sources: Array<Exclude<DistrictClinicEvidenceSource, "all">>;
  };
  emptyState: {
    title: string;
    description: string;
  };
};

type BuildDistrictClinicEvidenceViewModelInput = {
  state: DemoState;
  filters: DistrictClinicEvidenceFilters;
  selectedEvidenceId: string | null;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(value);
}

function encodeRouteId(value: string) {
  return encodeURIComponent(value);
}

function getClinicById(clinics: ClinicRow[], clinicId: string) {
  return clinics.find((clinic) => clinic.id === clinicId) ?? null;
}

function getClinicStatus(clinic: ClinicRow | null): ClinicStatus {
  return clinic?.status ?? "unknown";
}

function clinicHref(clinicId: string) {
  return `/district/clinics/${encodeRouteId(clinicId)}?from=${RETURN_SOURCE}`;
}

function reportHref(reportId: string) {
  return `/district/reports/${encodeRouteId(reportId)}?from=${RETURN_SOURCE}`;
}

function sourceLabel(source: Exclude<DistrictClinicEvidenceSource, "all">) {
  return source.replaceAll("_", " ");
}

function evidenceTone(
  kind: Exclude<DistrictClinicEvidenceKind, "all">,
  status: ClinicStatus,
  alert?: Pick<Alert, "severity" | "status">,
): DistrictClinicEvidenceTone {
  if (kind === "alert" && alert && alert.status !== "resolved") {
    return alert.severity === "critical" || alert.severity === "high" ? "blocked" : "attention";
  }

  if (status === "non_functional") {
    return "blocked";
  }

  if (status === "degraded" || status === "unknown") {
    return "attention";
  }

  return kind === "audit" ? "info" : "clear";
}

function reportToEvidenceRow(
  report: ReportStreamItem,
): DistrictClinicEvidenceRow {
  const status = report.status;

  return {
    id: `report-${report.id}`,
    evidenceId: report.id,
    clinicId: report.clinicId,
    clinicName: report.clinicName,
    facilityCode: report.facilityCode,
    kind: "report",
    title: report.reason,
    detail: report.notes,
    status,
    source: report.source,
    actorName: report.reporterName,
    occurredAt: report.receivedAt,
    tone: evidenceTone("report", status),
    reportHref: reportHref(report.id),
    clinicHref: clinicHref(report.clinicId),
  };
}

function auditToEvidenceRow(
  audit: AuditEvent,
  clinic: ClinicRow | null,
): DistrictClinicEvidenceRow {
  const status = getClinicStatus(clinic);

  return {
    id: `audit-${audit.id}`,
    evidenceId: audit.id,
    clinicId: audit.clinicId,
    clinicName: clinic?.name ?? audit.clinicId,
    facilityCode: clinic?.facilityCode ?? "Unavailable",
    kind: "audit",
    title: audit.summary,
    detail: audit.eventType.replaceAll(".", " "),
    status,
    source: "audit_log",
    actorName: audit.actorName,
    occurredAt: audit.createdAt,
    tone: evidenceTone("audit", status),
    reportHref: null,
    clinicHref: clinicHref(audit.clinicId),
  };
}

function alertToEvidenceRow(
  alert: Alert,
  clinic: ClinicRow | null,
): DistrictClinicEvidenceRow {
  const status = getClinicStatus(clinic);

  return {
    id: `alert-${alert.id}`,
    evidenceId: alert.id,
    clinicId: alert.clinicId,
    clinicName: clinic?.name ?? alert.clinicId,
    facilityCode: clinic?.facilityCode ?? "Unavailable",
    kind: "alert",
    title: alert.recommendedAction,
    detail: alert.type.replaceAll("_", " "),
    status,
    source: "alert",
    actorName: "District alerting",
    occurredAt: alert.createdAt,
    tone: evidenceTone("alert", status, alert),
    reportHref: null,
    clinicHref: clinicHref(alert.clinicId),
  };
}

function sortEvidenceRows(
  left: DistrictClinicEvidenceRow,
  right: DistrictClinicEvidenceRow,
) {
  const timeDelta = new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();

  if (timeDelta !== 0) {
    return timeDelta;
  }

  return left.evidenceId.localeCompare(right.evidenceId);
}

function evidencePriority(row: DistrictClinicEvidenceRow) {
  if (row.tone === "blocked") {
    return 0;
  }

  if (row.tone === "attention") {
    return 1;
  }

  if (row.kind === "alert") {
    return 2;
  }

  if (row.kind === "report") {
    return 3;
  }

  return 4;
}

function selectDefaultEvidenceRow(rows: DistrictClinicEvidenceRow[]) {
  return sortReviewRows(rows)[0] ?? null;
}

function sortReviewRows(rows: DistrictClinicEvidenceRow[]) {
  return [...rows].sort((left, right) => {
    const priorityDelta = evidencePriority(left) - evidencePriority(right);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return sortEvidenceRows(left, right);
  });
}

function rowMatchesQuery(row: DistrictClinicEvidenceRow, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return [
    row.evidenceId,
    row.clinicId,
    row.clinicName,
    row.facilityCode,
    row.kind,
    row.title,
    row.detail,
    row.status,
    row.actorName,
    sourceLabel(row.source),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function rowMatchesFilters(
  row: DistrictClinicEvidenceRow,
  filters: DistrictClinicEvidenceFilters,
) {
  return (
    (filters.kind === "all" || row.kind === filters.kind) &&
    (filters.status === "all" || row.status === filters.status) &&
    (filters.source === "all" || row.source === filters.source) &&
    (filters.clinic === "all" || row.clinicId === filters.clinic) &&
    rowMatchesQuery(row, filters.query)
  );
}

function buildMetrics(
  allRows: DistrictClinicEvidenceRow[],
): DistrictClinicEvidenceMetric[] {
  const reportCount = allRows.filter((row) => row.kind === "report").length;
  const auditCount = allRows.filter((row) => row.kind === "audit").length;
  const blockedCount = allRows.filter((row) => row.tone === "blocked").length;

  return [
    {
      label: "Evidence records",
      value: formatCount(allRows.length),
      detail: "Reports, alerts, and audit records in the district window.",
      tone: "info",
    },
    {
      label: "Field reports",
      value: formatCount(reportCount),
      detail: "Submitted clinic status evidence.",
      tone: reportCount > 0 ? "clear" : "attention",
    },
    {
      label: "Audit chain",
      value: formatCount(auditCount),
      detail: "System and operator events linked to clinics.",
      tone: auditCount > 0 ? "info" : "attention",
    },
    {
      label: "Blocking evidence",
      value: formatCount(blockedCount),
      detail: "Rows that currently require district attention.",
      tone: blockedCount > 0 ? "blocked" : "clear",
    },
  ];
}

function buildHeader(
  allRows: DistrictClinicEvidenceRow[],
): DistrictClinicEvidenceHeader {
  const blockedCount = allRows.filter((row) => row.tone === "blocked").length;
  const needsActionCount = allRows.filter((row) => row.tone !== "clear").length;
  const reportCount = allRows.filter((row) => row.kind === "report").length;
  const auditCount = allRows.filter((row) => row.kind === "audit").length;
  const alertCount = allRows.filter((row) => row.kind === "alert").length;
  const readinessTone: DistrictClinicEvidenceTone =
    blockedCount > 0 ? "blocked" : needsActionCount > 0 ? "attention" : "clear";

  return {
    eyebrow: "District command",
    title: "Clinic evidence",
    description:
      "Review the evidence packet behind clinic state changes before clearing the queue, changing routing posture, or handing work to the clinic owner.",
    scope: `${formatCount(allRows.length)} records · ${formatCount(reportCount)} reports · ${formatCount(alertCount)} alerts · ${formatCount(auditCount)} audit events`,
    readiness: {
      label: "Evidence readiness",
      value: formatCount(blockedCount),
      detail:
        blockedCount > 0
          ? `${formatCount(blockedCount)} blocking records require district verification before the evidence trail is cleared.`
          : needsActionCount > 0
            ? `${formatCount(needsActionCount)} records need review before the district evidence trail is fully clear.`
            : "No blocking clinic evidence in the current district window.",
      tone: readinessTone,
    },
    primaryAction: {
      label: "Open severity queue",
      href: "/district/severity-queue",
    },
    secondaryAction: {
      label: "Open clinic network",
      href: "/district/clinic-network",
    },
  };
}

function buildQueue(
  allRows: DistrictClinicEvidenceRow[],
): DistrictClinicEvidenceViewModel["queue"] {
  const needsActionCount = allRows.filter((row) => row.tone !== "clear").length;
  const reportCount = allRows.filter((row) => row.kind === "report").length;
  const alertCount = allRows.filter((row) => row.kind === "alert").length;
  const auditCount = allRows.filter((row) => row.kind === "audit").length;

  return {
    title: "Evidence review queue",
    description:
      "Select a record to inspect provenance, linked clinic context, and the next district action.",
    chips: [
      {
        id: "all",
        label: "All",
        count: allRows.length,
        tone: "info",
      },
      {
        id: "needs_action",
        label: "Needs action",
        count: needsActionCount,
        tone: needsActionCount > 0 ? "attention" : "clear",
      },
      {
        id: "reports",
        label: "Reports",
        count: reportCount,
        tone: reportCount > 0 ? "clear" : "attention",
      },
      {
        id: "alerts",
        label: "Alerts",
        count: alertCount,
        tone: alertCount > 0 ? "blocked" : "clear",
      },
      {
        id: "audit",
        label: "Audit",
        count: auditCount,
        tone: auditCount > 0 ? "info" : "attention",
      },
    ],
  };
}

function buildPacket(
  row: DistrictClinicEvidenceRow,
  timeline: DistrictClinicEvidenceRow[],
): DistrictClinicEvidencePacket {
  return {
    ...row,
    actionTone: row.tone,
    provenance: [
      { label: "Source", value: sourceLabel(row.source) },
      { label: "Actor", value: row.actorName },
      { label: "Facility code", value: row.facilityCode },
      { label: "Linked records", value: formatCount(timeline.length) },
    ],
    recommendedAction:
      row.kind === "report"
        ? "Read the report brief, compare it with the clinic timeline, and confirm whether district posture should change."
        : row.kind === "alert"
          ? "Confirm whether this alert still reflects active service pressure before changing routing or intervention notes."
          : "Use this audit event to validate who changed the evidence chain and what clinic state it affected.",
    timelineSummary: `${formatCount(timeline.length)} linked evidence records for this clinic.`,
    verificationNeed:
      row.status === "operational"
        ? "Confirm normal reporting cadence and keep this evidence available for audit review."
        : "Confirm the evidence with the clinic owner before clearing the district decision trail.",
  };
}

export function buildDistrictClinicEvidenceViewModel({
  filters,
  selectedEvidenceId,
  state,
}: BuildDistrictClinicEvidenceViewModelInput): DistrictClinicEvidenceViewModel {
  const clinics = getClinicRows(state);
  const rows = [
    ...getRecentReportStream(state).map((report) =>
      reportToEvidenceRow(report),
    ),
    ...state.auditEvents.map((audit) =>
      auditToEvidenceRow(audit, getClinicById(clinics, audit.clinicId)),
    ),
    ...getActiveAlerts(state).map((alert) =>
      alertToEvidenceRow(alert, getClinicById(clinics, alert.clinicId)),
    ),
  ].sort(sortEvidenceRows);
  const filteredRows = sortReviewRows(
    rows.filter((row) => rowMatchesFilters(row, filters)),
  );
  const selectedRow =
    filteredRows.find((row) => row.evidenceId === selectedEvidenceId) ??
    selectDefaultEvidenceRow(filteredRows);
  const timeline = selectedRow
    ? rows.filter((row) => row.clinicId === selectedRow.clinicId).sort(sortEvidenceRows)
    : [];
  const selectedPacket = selectedRow ? buildPacket(selectedRow, timeline) : null;
  const sources = Array.from(new Set(rows.map((row) => row.source))).sort();

  return {
    header: buildHeader(rows),
    metrics: buildMetrics(rows),
    queue: buildQueue(rows),
    rows: filteredRows,
    selectedPacket,
    timeline,
    filterOptions: {
      clinics: clinics
        .map((clinic) => ({ label: clinic.name, value: clinic.id }))
        .sort((left, right) => left.label.localeCompare(right.label)),
      sources,
    },
    emptyState: {
      title: "No evidence matches these filters",
      description:
        "Clear filters or broaden the clinic, evidence type, or source to return to the full district evidence ledger.",
    },
  };
}
