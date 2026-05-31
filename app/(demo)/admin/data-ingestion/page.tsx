import type { AdminTone } from "@/components/product/admin-module";
import {
  type DataIngestionBacklogItem,
  type DataIngestionDiagnostic,
  type DataIngestionLedgerItem,
  type DataIngestionSummaryMetric,
  DataIngestionWorkspace,
} from "@/components/product/data-ingestion-workspace";
import { EstateOperationsBriefing } from "@/components/product/estate-operations-briefing";
import {
  fetchOperationalClinics,
  fetchPendingReports,
  fetchSyncSummary,
} from "@/lib/demo/api-client";
import type { ClinicDetailApiResponse, ReportApiResponse } from "@/lib/demo/api-types";
import { summarizeReportingCoverage } from "@/lib/product/admin-governance";
import {
  buildDataTrustState,
  type DataFreshness,
  type DataSource,
  type ReviewState,
} from "@/lib/product/data-trust";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { getAdminLoaderOptions } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  getReportingCoverageTone,
  toneForAttention,
} from "../governance-formatters";

type IngestionSignal = {
  id: string;
  signal: string;
  value: number;
  evidence: string;
  tone: AdminTone;
};

type IngestionIssue = {
  label: string;
  tone: AdminTone;
};

function clinicNeedsIngestionReview(clinic: ClinicDetailApiResponse) {
  if (!clinic.currentStatus) {
    return true;
  }

  return (
    getReportingCoverageTone({
      status: clinic.currentStatus.status,
      freshness: clinic.currentStatus.freshness,
    }) !== "clear"
  );
}

function reportEvidence(report: ReportApiResponse) {
  const source = report.offlineCreated ? "Offline field report" : "Direct field report";
  return `${source}; ${formatLabel(report.status)} status; ${formatLabel(
    report.reviewState,
  )} review`;
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

function reviewStateForReport(report: ReportApiResponse): ReviewState {
  if (report.reviewState === "pending") {
    return "pending_review";
  }

  if (report.reviewState === "rejected") {
    return "rejected";
  }

  if (report.reviewState === "accepted") {
    return "reviewed";
  }

  return "unknown";
}

function dataTrustForReport(report: ReportApiResponse) {
  return buildDataTrustState({
    source: "field_report",
    freshness: "fresh",
    reviewState: reviewStateForReport(report),
    lastVerifiedAt: report.receivedAt,
    evidenceHref: "/admin/audit-evidence",
  });
}

function trustSourceForClinicStatus(clinic: ClinicDetailApiResponse): DataSource {
  if (!clinic.currentStatus) {
    return "seeded_demo";
  }

  const source = clinic.currentStatus.source?.toLowerCase() ?? "";

  if (source.includes("reconciliation")) {
    return "system_reconciliation";
  }

  if (source.includes("partner")) {
    return "partner_export";
  }

  if (source.includes("field")) {
    return "field_report";
  }

  return "pilot_import";
}

function dataTrustForClinic(clinic: ClinicDetailApiResponse) {
  return buildDataTrustState({
    source: trustSourceForClinicStatus(clinic),
    freshness: dataFreshnessForClinic(clinic),
    reviewState: clinic.currentStatus ? "not_required" : "unknown",
    lastVerifiedAt: clinic.currentStatus?.lastReportedAt ?? clinic.currentStatus?.updatedAt,
    evidenceHref: "/admin/audit-evidence",
  });
}

const returnSource = "admin-data-ingestion";

function buildClinicDetailHref(clinicId: string) {
  return `/district/clinics/${encodeURIComponent(clinicId)}?from=${returnSource}`;
}

function actionForReport(report: ReportApiResponse) {
  if (report.offlineCreated) {
    return "Validate offline payload";
  }

  if (report.reviewState === "pending") {
    return "Confirm source payload";
  }

  if (report.reviewState === "rejected") {
    return "Escalate rejected report";
  }

  return "Keep in intake watchlist";
}

function classifyReportIssue(report: ReportApiResponse): IngestionIssue {
  if (report.offlineCreated) {
    return {
      tone: "attention",
      label: "Offline source waiting for validation",
    };
  }

  if (report.reviewState === "pending") {
    return {
      tone: "attention",
      label: "Human review gate",
    };
  }

  if (report.reviewState === "rejected") {
    return {
      tone: "blocked",
      label: "Rejected source payload",
    };
  }

  return {
    tone: "clear",
    label: "Ready for clinic status promotion",
  };
}

function buildIngestionLedgerItem(
  report: ReportApiResponse,
  clinicLabel?: string,
): DataIngestionLedgerItem {
  const trust = dataTrustForReport(report);
  const issue = classifyReportIssue(report);
  const sourceLabel = report.offlineCreated ? "Offline field report" : "Direct field report";
  const submittedLabel = formatDateTime(report.submittedAt);
  const receivedLabel = formatDateTime(report.receivedAt);
  const reviewLabel = formatLabel(report.reviewState);

  return {
    id: String(report.id),
    clinicId: report.clinicId,
    clinicLabel: clinicLabel ?? report.clinicId,
    reporterLabel: report.reporterName ?? "Field report",
    sourceLabel,
    evidence: reportEvidence(report),
    submittedLabel,
    receivedLabel,
    issueLabel: issue.label,
    issueTone: issue.tone,
    reviewLabel,
    reviewTone: toneForAttention(report.reviewState === "pending" ? 1 : 0),
    trustLabel: trust.label,
    trustTone: trust.tone,
    trustDescription: trust.description,
    actionLabel: actionForReport(report),
    clinicHref: buildClinicDetailHref(report.clinicId),
    receiptTrail: [
      `Captured from ${sourceLabel}`,
      `Submitted ${submittedLabel}`,
      `Received ${receivedLabel}`,
      `Review state is ${reviewLabel}`,
    ],
    payloadChecks: [
      `One-clinic context: ${clinicLabel ?? report.clinicId}`,
      `Source review: ${issue.label}`,
      `Trust result: ${trust.label}`,
    ],
  };
}

function buildClinicBacklogLedgerItem(row: ClinicDetailApiResponse): DataIngestionLedgerItem {
  const currentStatus = row.currentStatus;
  const trust = dataTrustForClinic(row);
  const freshness = currentStatus?.freshness ?? "unknown";
  const freshnessLabel = formatLabel(freshness);
  const submittedLabel = formatDateTime(currentStatus?.lastReportedAt ?? currentStatus?.updatedAt);
  const receivedLabel = formatDateTime(currentStatus?.updatedAt ?? currentStatus?.lastReportedAt);
  const sourceLabel = "Clinic current status";
  const reporterLabel = "Clinic status evidence";
  const issueLabel = freshness === "stale" ? "Freshness risk" : "Needs confirmation";
  const actionLabel = freshness === "stale" ? "Refresh clinic status" : "Confirm status evidence";
  const evidence = "Clinic current status evidence needs ingestion follow-up before promotion.";

  return {
    id: `clinic-backlog-${row.clinic.id}`,
    clinicId: row.clinic.id,
    clinicLabel: row.clinic.name,
    reporterLabel,
    sourceLabel,
    evidence,
    submittedLabel,
    receivedLabel,
    issueLabel,
    issueTone: "attention",
    reviewLabel: freshnessLabel,
    reviewTone: "attention",
    trustLabel: trust.label,
    trustTone: trust.tone,
    trustDescription: trust.description,
    actionLabel,
    clinicHref: buildClinicDetailHref(row.clinic.id),
    receiptTrail: [
      `Loaded from ${sourceLabel}`,
      `Last reported ${submittedLabel}`,
      `Ledger updated ${receivedLabel}`,
      `Freshness state is ${freshnessLabel}`,
    ],
    payloadChecks: [
      `One-clinic context: ${row.clinic.name}`,
      `Freshness review: ${freshnessLabel}`,
      `Trust result: ${trust.label}`,
    ],
  };
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const options = await getAdminLoaderOptions();
  const [clinics, pendingReports, syncSummary] = await Promise.all([
    fetchOperationalClinics(options),
    fetchPendingReports(options),
    fetchSyncSummary(options),
  ]);
  const coverage = summarizeReportingCoverage({
    clinicCount: clinics.length,
    staleClinicCount: syncSummary.staleClinics,
    needsConfirmationClinicCount: syncSummary.needsConfirmationClinics,
    pendingReviewCount: pendingReports.length,
    queuedOfflineCount: syncSummary.pendingOfflineReports,
    validationFailureCount: syncSummary.validationFailures,
  });
  const clinicsNeedingReview = clinics.filter(clinicNeedsIngestionReview);
  const clinicNameById = new Map(clinics.map((row) => [row.clinic.id, row.clinic.name]));
  const pendingReportClinicIds = new Set(pendingReports.map((report) => report.clinicId));
  const ingestionReportItems = pendingReports.map((report) =>
    buildIngestionLedgerItem(report, clinicNameById.get(report.clinicId)),
  );
  const ingestionBacklogItems = clinicsNeedingReview
    .filter((row) => !pendingReportClinicIds.has(row.clinic.id))
    .map(buildClinicBacklogLedgerItem);
  const ingestionItems = [...ingestionReportItems, ...ingestionBacklogItems];
  const ingestionMetrics: DataIngestionSummaryMetric[] = [
    {
      id: "coverage-readiness",
      label: "Coverage readiness",
      value: `${formatCount(coverage.readinessPercent)}%`,
      detail: coverage.blockers.length ? coverage.blockers.join("; ") : "No ingestion blockers",
      tone: coverage.tone,
    },
    {
      id: "pending-report-evidence",
      label: "Pending report evidence",
      value: formatCount(pendingReports.length),
      detail: "Field reports awaiting review before status promotion",
      tone: toneForAttention(pendingReports.length),
    },
    {
      id: "offline-queue",
      label: "Offline queue",
      value: formatCount(syncSummary.pendingOfflineReports),
      detail: `${formatCount(syncSummary.offlineReportsReceived)} received in window`,
      tone: toneForAttention(syncSummary.pendingOfflineReports),
    },
    {
      id: "validation-failures",
      label: "Validation failures",
      value: formatCount(syncSummary.validationFailures),
      detail: `${formatCount(syncSummary.conflictsNeedingAttention)} conflicts need attention`,
      tone: toneForAttention(syncSummary.validationFailures),
    },
  ];
  const ingestionSignals: IngestionSignal[] = [
    {
      id: "offline-queue",
      signal: "Offline queue",
      value: syncSummary.pendingOfflineReports,
      evidence: `${formatCount(syncSummary.offlineReportsReceived)} offline reports received in the sync window`,
      tone: toneForAttention(syncSummary.pendingOfflineReports),
    },
    {
      id: "validation-failures",
      signal: "Validation failures",
      value: syncSummary.validationFailures,
      evidence: "Reports blocked by validation before clinic status changes",
      tone: toneForAttention(syncSummary.validationFailures),
    },
    {
      id: "conflicts",
      signal: "Conflict review",
      value: syncSummary.conflictsNeedingAttention,
      evidence: `${formatCount(syncSummary.duplicateSyncsHandled)} duplicate syncs handled`,
      tone: toneForAttention(syncSummary.conflictsNeedingAttention),
    },
    {
      id: "freshness",
      signal: "Stale or needs-confirmation clinics",
      value: syncSummary.staleClinics + syncSummary.needsConfirmationClinics,
      evidence: `${formatCount(syncSummary.staleClinics)} stale; ${formatCount(
        syncSummary.needsConfirmationClinics,
      )} need confirmation`,
      tone: toneForAttention(syncSummary.staleClinics + syncSummary.needsConfirmationClinics),
    },
  ];
  const statusLabel = coverage.blockers.length
    ? `${formatCount(coverage.readinessPercent)}% readiness needs ingestion review`
    : "Ingestion evidence is ready for promotion";

  return (
    <div className="space-y-4" data-admin-module="data-ingestion">
      <EstateOperationsBriefing
        eyebrow="Platform ingestion"
        title="Ingestion command cockpit"
        description="Review sync freshness, pending field reports, offline queue pressure, validation failures, and clinic confirmation risk before status promotion."
        statusLabel={statusLabel}
        statusDetail={
          coverage.blockers.length
            ? coverage.blockers.join("; ")
            : "Every active ingestion lane is clear enough for operator review."
        }
        statusTone={coverage.tone}
        railLabel="Intake queue rail"
        routingLabel="Promotion route map"
        metrics={ingestionMetrics}
        routes={[
          {
            id: "ledger",
            label: "Open ingestion ledger",
            value: `${formatCount(ingestionItems.length)} rows`,
            detail: "Inspect receipt trails, payload checks, source state, and clinic context.",
            href: "#data-ingestion-workspace",
            tone: coverage.tone,
          },
          {
            id: "coverage",
            label: "Review reporting coverage",
            value: `${formatCount(clinicsNeedingReview.length)} clinics`,
            detail: "Compare freshness, review state, and clinic-level reporting coverage.",
            href: "/admin/reporting-coverage",
            tone: toneForAttention(clinicsNeedingReview.length),
          },
          {
            id: "audit",
            label: "Trace audit evidence",
            value: `${formatCount(pendingReports.length)} reports`,
            detail: "Follow field report decisions and source evidence into the audit trail.",
            href: "/admin/audit-evidence",
            tone: toneForAttention(pendingReports.length),
          },
          {
            id: "tenant",
            label: "Open tenant health",
            value: `${formatCount(syncSummary.validationFailures)} failures`,
            detail: "Return to the estate-wide health picture for access and partner context.",
            href: "/admin/tenant-health",
            tone: toneForAttention(syncSummary.validationFailures),
          },
        ]}
        actions={[
          {
            label: "Review ingestion ledger",
            href: "#data-ingestion-workspace",
          },
          {
            label: "Open tenant health",
            href: "/admin/tenant-health",
            variant: "secondary",
          },
        ]}
      />

      <section id="data-ingestion-workspace" className="scroll-mt-24">
        <DataIngestionWorkspace
          metrics={ingestionMetrics}
          items={ingestionItems}
          diagnostics={ingestionSignals.map(
            (signal): DataIngestionDiagnostic => ({
              id: signal.id,
              label: signal.signal,
              value: formatCount(signal.value),
              evidence: signal.evidence,
              tone: signal.tone,
              windowLabel: formatDateTime(syncSummary.windowStartedAt),
            }),
          )}
          backlogItems={clinicsNeedingReview.map((row): DataIngestionBacklogItem => {
            const trust = dataTrustForClinic(row);

            return {
              id: row.clinic.id,
              clinicName: row.clinic.name,
              district: row.clinic.district,
              freshnessLabel: formatLabel(row.currentStatus?.freshness),
              freshnessTone: clinicNeedsIngestionReview(row) ? "attention" : "clear",
              trustLabel: trust.label,
              trustTone: trust.tone,
              trustDescription: trust.description,
              lastUpdateLabel: formatDateTime(row.currentStatus?.updatedAt),
              clinicHref: buildClinicDetailHref(row.clinic.id),
            };
          })}
        />
      </section>
    </div>
  );
}
