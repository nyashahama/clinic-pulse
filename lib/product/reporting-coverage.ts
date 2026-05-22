import type {
  ClinicDetailApiResponse,
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { summarizeReportingCoverage, type GovernanceTone } from "@/lib/product/admin-governance";
import {
  buildDataTrustState,
  type DataFreshness,
  type DataSource,
  type ReviewState,
} from "@/lib/product/data-trust";

const RETURN_SOURCE = "admin-reporting-coverage";

export type ReportingCoverageTone = GovernanceTone | "info";

export type ReportingCoverageHeader = {
  eyebrow: string;
  title: string;
  description: string;
  readiness: {
    label: string;
    value: string;
    detail: string;
    tone: ReportingCoverageTone;
  };
  scope: string;
  syncWindow: string;
};

export type ReportingCoverageMetric = {
  label: string;
  value: string;
  detail: string;
  tone: ReportingCoverageTone;
};

export type ReportingCoverageCompositionItem = {
  id: DataFreshness | "pending_review";
  label: string;
  count: number;
  percent: number;
  tone: ReportingCoverageTone;
};

export type ReportingCoverageDistrictRow = {
  district: string;
  clinics: number;
  fresh: number;
  freshnessRisk: number;
  pendingReviews: number;
  readinessPercent: number;
  dominantSource: string;
  tone: ReportingCoverageTone;
};

export type ReportingCoverageLedgerRow = {
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  district: string;
  status: string;
  freshness: DataFreshness;
  sourceLabel: string;
  reporterName: string;
  lastReportedAt: string;
  updatedAt: string;
  reviewState: ReviewState;
  trust: {
    label: string;
    description: string;
    tone: GovernanceTone;
  };
  evidenceNote: string;
  clinicHref: string;
};

export type ReportingCoverageTimelineItem = {
  label: string;
  value: string;
  detail: string;
  tone: ReportingCoverageTone;
};

export type ReportingCoverageEvidenceReceipt = {
  clinicName: string;
  facilityCode: string;
  district: string;
  posture: string;
  recommendedAction: string;
  trustLabel: string;
  trustDescription: string;
  clinicHref: string;
  timeline: ReportingCoverageTimelineItem[];
};

export type ReportingCoverageViewModel = {
  header: ReportingCoverageHeader;
  metrics: ReportingCoverageMetric[];
  composition: ReportingCoverageCompositionItem[];
  districtMatrix: {
    title: string;
    description: string;
    rows: ReportingCoverageDistrictRow[];
  };
  ledger: {
    title: string;
    description: string;
    rows: ReportingCoverageLedgerRow[];
  };
  evidenceReceipt: ReportingCoverageEvidenceReceipt | null;
  actions: Array<{
    label: string;
    href: string;
    priority: "primary" | "secondary";
  }>;
};

type BuildReportingCoverageViewModelInput = {
  clinics: ClinicDetailApiResponse[];
  pendingReports: ReportApiResponse[];
  syncSummary: SyncSummaryApiResponse;
};

const numberFormatter = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const sourceLabels: Record<DataSource, string> = {
  field_report: "Field data",
  partner_export: "Partner export",
  pilot_import: "Imported data",
  seeded_demo: "Scenario data",
  system_reconciliation: "System reconciliation",
};

const compositionLabels: Record<ReportingCoverageCompositionItem["id"], string> = {
  fresh: "Fresh",
  needs_confirmation: "Needs confirmation",
  pending_review: "Pending review",
  stale: "Stale",
  unknown: "Unknown",
};

export function buildReportingCoverageViewModel({
  clinics,
  pendingReports,
  syncSummary,
}: BuildReportingCoverageViewModelInput): ReportingCoverageViewModel {
  const pendingReportsByClinicId = new Map(
    pendingReports.map((report) => [report.clinicId, report]),
  );
  const coverage = summarizeReportingCoverage({
    clinicCount: clinics.length,
    staleClinicCount: syncSummary.staleClinics,
    needsConfirmationClinicCount: syncSummary.needsConfirmationClinics,
    pendingReviewCount: pendingReports.length,
    queuedOfflineCount: syncSummary.pendingOfflineReports,
    validationFailureCount: syncSummary.validationFailures,
  });
  const rows = clinics
    .map((clinic) => toLedgerRow(clinic, pendingReportsByClinicId))
    .sort(sortLedgerRows);
  const attentionRows = rows.filter((row) => row.trust.tone !== "clear").length;
  const composition = buildComposition(rows);

  return {
    header: {
      eyebrow: "Organisation operations",
      title: "Reporting coverage",
      description:
        "A coverage ledger for source, freshness, and review state, with sync blockers and the evidence trail behind every status.",
      readiness: {
        label: "Coverage readiness",
        value: `${formatCount(coverage.readinessPercent)}%`,
        detail: coverage.blockers.length
          ? coverage.blockers.join("; ")
          : "No current coverage blockers",
        tone: coverage.tone,
      },
      scope: `${formatCount(clinics.length)} clinics in active coverage`,
      syncWindow: `Sync window opened ${formatDateTime(syncSummary.windowStartedAt)}`,
    },
    metrics: [
      {
        label: "Clinics in ledger",
        value: formatCount(clinics.length),
        detail: `${formatCount(attentionRows)} need coverage attention`,
        tone: attentionRows > 0 ? "attention" : "clear",
      },
      {
        label: "Fresh evidence",
        value: formatCount(composition.find((item) => item.id === "fresh")?.count ?? 0),
        detail: `${formatStatusAge(syncSummary.medianCurrentStatusAgeHours)} median status age`,
        tone: "clear",
      },
      {
        label: "Pending review",
        value: formatCount(pendingReports.length),
        detail: `${formatCount(syncSummary.pendingOfflineReports)} queued offline reports`,
        tone: pendingReports.length > 0 ? "attention" : "clear",
      },
      {
        label: "Validation blockers",
        value: formatCount(syncSummary.validationFailures),
        detail: `${formatCount(syncSummary.duplicateSyncsHandled)} duplicate syncs handled`,
        tone: syncSummary.validationFailures > 0 ? "attention" : "clear",
      },
    ],
    composition,
    districtMatrix: {
      title: "District coverage matrix",
      description:
        "District-level freshness coverage, review pressure, and dominant evidence source for the active organisation.",
      rows: buildDistrictRows(rows),
    },
    ledger: {
      title: "Clinic reporting coverage",
      description:
        "Each row links to the operational clinic detail with source, freshness, trust state, and evidence note intact.",
      rows,
    },
    evidenceReceipt: buildEvidenceReceipt(rows[0] ?? null, pendingReportsByClinicId),
    actions: [
      {
        label: "Review ingestion",
        href: "/admin/data-ingestion",
        priority: "primary",
      },
      {
        label: "Open audit evidence",
        href: "/admin/audit-evidence",
        priority: "secondary",
      },
    ],
  };
}

function toLedgerRow(
  clinic: ClinicDetailApiResponse,
  pendingReportsByClinicId: Map<string, ReportApiResponse>,
): ReportingCoverageLedgerRow {
  const pendingReport = pendingReportsByClinicId.get(clinic.clinic.id);
  const freshness = dataFreshnessForClinic(clinic);
  const source = dataSourceForClinic(clinic);
  const reviewState = pendingReport ? "pending_review" : clinic.currentStatus ? "not_required" : "unknown";
  const trust = buildDataTrustState({
    source,
    freshness,
    reviewState,
    lastVerifiedAt: clinic.currentStatus?.lastReportedAt ?? clinic.currentStatus?.updatedAt,
    evidenceHref: "/admin/audit-evidence",
  });

  return {
    clinicId: clinic.clinic.id,
    clinicName: clinic.clinic.name,
    clinicHref: buildClinicDetailHref(clinic.clinic.id),
    district: clinic.clinic.district,
    evidenceNote: getEvidenceNote({ freshness, pendingReport, status: clinic.currentStatus?.status }),
    facilityCode: clinic.clinic.facilityCode,
    freshness,
    lastReportedAt: formatDateTime(clinic.currentStatus?.lastReportedAt),
    reporterName: clinic.currentStatus?.reporterName ?? pendingReport?.reporterName ?? "Unavailable",
    reviewState,
    sourceLabel: sourceLabels[source],
    status: formatLabel(clinic.currentStatus?.status),
    trust: {
      label: trust.label,
      description: trust.description,
      tone: trust.tone,
    },
    updatedAt: formatDateTime(clinic.currentStatus?.updatedAt),
  };
}

function buildComposition(
  rows: ReportingCoverageLedgerRow[],
): ReportingCoverageCompositionItem[] {
  const total = Math.max(rows.length, 1);

  return ([
    "fresh",
    "needs_confirmation",
    "stale",
    "unknown",
    "pending_review",
  ] as const).map((id) => {
    const count =
      id === "pending_review"
        ? rows.filter((row) => row.reviewState === "pending_review").length
        : rows.filter((row) => row.freshness === id).length;

    return {
      id,
      label: compositionLabels[id],
      count,
      percent: Math.round((count / total) * 100),
      tone: toneForComposition(id, count),
    };
  });
}

function buildDistrictRows(
  rows: ReportingCoverageLedgerRow[],
): ReportingCoverageDistrictRow[] {
  const byDistrict = new Map<string, ReportingCoverageLedgerRow[]>();

  for (const row of rows) {
    byDistrict.set(row.district, [...(byDistrict.get(row.district) ?? []), row]);
  }

  return Array.from(byDistrict.entries())
    .map(([district, districtRows]) => {
      const fresh = districtRows.filter((row) => row.freshness === "fresh").length;
      const pendingReviews = districtRows.filter(
        (row) => row.reviewState === "pending_review",
      ).length;
      const freshnessRisk = districtRows.length - fresh;
      const pressure = freshnessRisk + pendingReviews;
      const readinessPercent = Math.max(
        0,
        Math.round(((districtRows.length - pressure) / districtRows.length) * 100),
      );
      const tone: ReportingCoverageTone = pressure > 0 ? "attention" : "clear";

      return {
        district,
        clinics: districtRows.length,
        dominantSource: getDominantSource(districtRows),
        fresh,
        freshnessRisk,
        pendingReviews,
        readinessPercent,
        tone,
      };
    })
    .sort((left, right) => {
      const pressureDelta =
        right.freshnessRisk + right.pendingReviews - (left.freshnessRisk + left.pendingReviews);

      return pressureDelta || left.district.localeCompare(right.district);
    });
}

function buildEvidenceReceipt(
  row: ReportingCoverageLedgerRow | null,
  pendingReportsByClinicId: Map<string, ReportApiResponse>,
): ReportingCoverageEvidenceReceipt | null {
  if (!row) {
    return null;
  }

  const pendingReport = pendingReportsByClinicId.get(row.clinicId);

  return {
    clinicName: row.clinicName,
    clinicHref: row.clinicHref,
    district: row.district,
    facilityCode: row.facilityCode,
    posture: `${row.status} / ${formatLabel(row.freshness)}`,
    recommendedAction: getRecommendedAction(row),
    timeline: pendingReport
      ? [
          {
            label: "Submitted",
            value: formatDateTime(pendingReport.submittedAt),
            detail: pendingReport.reason ?? "Field evidence entered the reporting ledger.",
            tone: "info",
          },
          {
            label: "Received",
            value: formatDateTime(pendingReport.receivedAt),
            detail: "The report is waiting for administrator review.",
            tone: "attention",
          },
          {
            label: "Now",
            value: row.evidenceNote,
            detail: "Coverage remains provisional until this receipt is resolved.",
            tone: row.trust.tone,
          },
        ]
      : [
          {
            label: "Reported",
            value: row.lastReportedAt,
            detail: `${row.sourceLabel} supplied the latest clinic state.`,
            tone: "info",
          },
          {
            label: "Updated",
            value: row.updatedAt,
            detail: row.trust.description,
            tone: row.trust.tone,
          },
          {
            label: "Now",
            value: row.evidenceNote,
            detail: "The ledger is using the latest available status evidence.",
            tone: row.trust.tone,
          },
        ],
    trustDescription: row.trust.description,
    trustLabel: row.trust.label,
  };
}

function dataSourceForClinic(clinic: ClinicDetailApiResponse): DataSource {
  const source = clinic.currentStatus?.source?.toLowerCase() ?? "";

  if (source.includes("field") || source.includes("report")) {
    return "field_report";
  }

  if (source.includes("reconciliation")) {
    return "system_reconciliation";
  }

  if (source.includes("import")) {
    return "pilot_import";
  }

  return "seeded_demo";
}

function dataFreshnessForClinic(clinic: ClinicDetailApiResponse): DataFreshness {
  const freshness = clinic.currentStatus?.freshness;

  if (
    freshness === "fresh" ||
    freshness === "needs_confirmation" ||
    freshness === "stale" ||
    freshness === "unknown"
  ) {
    return freshness;
  }

  return "unknown";
}

function getEvidenceNote({
  freshness,
  pendingReport,
  status,
}: {
  freshness: DataFreshness;
  pendingReport?: ReportApiResponse;
  status?: string | null;
}) {
  if (pendingReport) {
    return "Backstop review required before coverage is trusted";
  }

  if (freshness === "stale") {
    return "Refresh status before publishing coverage";
  }

  if (freshness === "needs_confirmation") {
    return "Confirm latest status with the district desk";
  }

  if (!status || status === "unknown" || freshness === "unknown") {
    return "No verified current status evidence";
  }

  return "Coverage evidence is current";
}

function getRecommendedAction(row: ReportingCoverageLedgerRow) {
  if (row.reviewState === "pending_review") {
    return "Resolve the pending report before treating this clinic as covered.";
  }

  if (row.freshness === "stale") {
    return "Request a fresh clinic status update and keep the ledger marked provisional.";
  }

  if (row.freshness === "needs_confirmation") {
    return "Confirm the latest clinic state before clearing the coverage risk.";
  }

  if (row.freshness === "unknown") {
    return "Find source evidence before this clinic is counted as reportable.";
  }

  return "Keep this clinic in normal reporting cadence.";
}

function getDominantSource(rows: ReportingCoverageLedgerRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.sourceLabel, (counts.get(row.sourceLabel) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((left, right) => {
    return right[1] - left[1] || left[0].localeCompare(right[0]);
  })[0]?.[0] ?? "Unavailable";
}

function sortLedgerRows(
  left: ReportingCoverageLedgerRow,
  right: ReportingCoverageLedgerRow,
) {
  return rowRiskScore(right) - rowRiskScore(left) || left.clinicName.localeCompare(right.clinicName);
}

function rowRiskScore(row: ReportingCoverageLedgerRow) {
  let score = 0;

  if (row.reviewState === "pending_review") {
    score += 5;
  }

  if (row.freshness === "stale") {
    score += 4;
  }

  if (row.freshness === "needs_confirmation") {
    score += 3;
  }

  if (row.freshness === "unknown") {
    score += 2;
  }

  if (row.trust.tone === "blocked") {
    score += 2;
  }

  if (row.trust.tone === "attention") {
    score += 1;
  }

  return score;
}

function toneForComposition(
  id: ReportingCoverageCompositionItem["id"],
  count: number,
): ReportingCoverageTone {
  if (count === 0) {
    return id === "fresh" ? "attention" : "clear";
  }

  return id === "fresh" ? "clear" : "attention";
}

function buildClinicDetailHref(clinicId: string) {
  return `/district/clinics/${encodeURIComponent(clinicId)}?from=${RETURN_SOURCE}`;
}

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatStatusAge(hours?: number | null) {
  if (hours === null || hours === undefined) {
    return "Unavailable";
  }

  if (hours >= 48) {
    return `${formatCount(Math.round(hours / 24))}d`;
  }

  return `${formatCount(Math.round(hours))}h`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return dateTimeFormatter.format(date);
}

function formatLabel(value?: string | null) {
  if (!value) {
    return "unavailable";
  }

  return value.replaceAll("_", " ");
}
