import type { AdminTone } from "@/components/product/admin-module";
import {
  DataIngestionPipelineMonitor,
  type DataIngestionPipelineAction,
  type DataIngestionPipelineRun,
  type DataIngestionPipelineStage,
  type DataIngestionStageTriageItem,
} from "@/components/product/data-ingestion-pipeline-monitor";
import {
  type DataIngestionBacklogItem,
  type DataIngestionDiagnostic,
  type DataIngestionLedgerItem,
  type DataIngestionSummaryMetric,
  DataIngestionWorkspace,
} from "@/components/product/data-ingestion-workspace";
import {
  fetchOperationalClinics,
  fetchPendingReports,
  fetchSyncSummary,
} from "@/lib/workspace/api-client";
import type { ClinicDetailApiResponse, ReportApiResponse } from "@/lib/workspace/api-types";
import { summarizeReportingCoverage } from "@/lib/product/admin-governance";
import {
  buildDataTrustState,
  type DataFreshness,
  type DataSource,
  type ReviewState,
} from "@/lib/product/data-trust";
import { requireWorkspaceWorkflowAccess } from "../../workflow-guard";
import { getAdminLoaderOptions } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  getReportingCoverageTone,
  toneForAttention,
} from "../governance-formatters";

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
    return "scenario_seed";
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

function stageIdForIngestionItem(item: DataIngestionLedgerItem) {
  const issue = item.issueLabel.toLowerCase();
  const source = item.sourceLabel.toLowerCase();

  if (source.includes("offline") || issue.includes("offline")) {
    return "offline-queue";
  }

  if (item.issueTone === "blocked" || issue.includes("rejected")) {
    return "validation-gate";
  }

  if (
    source.includes("clinic current status") ||
    issue.includes("freshness") ||
    issue.includes("confirmation")
  ) {
    return "coverage-promotion";
  }

  return "field-report-intake";
}

function buildStageTriageItem(item: DataIngestionLedgerItem): DataIngestionStageTriageItem {
  return {
    id: item.id,
    stageId: stageIdForIngestionItem(item),
    title: item.clinicLabel,
    detail: item.evidence,
    evidenceLabel: `${item.issueLabel}; ${item.trustLabel}`,
    actionLabel: item.actionLabel,
    href: item.clinicHref,
    tone: item.issueTone,
  };
}

export default async function Page() {
  await requireWorkspaceWorkflowAccess("admin");

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
  const ingestionSignals: DataIngestionPipelineRun[] = [
    {
      id: "offline-queue",
      signal: "Offline queue",
      value: formatCount(syncSummary.pendingOfflineReports),
      evidence: `${formatCount(syncSummary.offlineReportsReceived)} offline reports received in the sync window`,
      tone: toneForAttention(syncSummary.pendingOfflineReports),
      windowLabel: formatDateTime(syncSummary.windowStartedAt),
    },
    {
      id: "validation-failures",
      signal: "Validation failures",
      value: formatCount(syncSummary.validationFailures),
      evidence: "Reports blocked by validation before clinic status changes",
      tone: toneForAttention(syncSummary.validationFailures),
      windowLabel: formatDateTime(syncSummary.windowStartedAt),
    },
    {
      id: "conflicts",
      signal: "Conflict review",
      value: formatCount(syncSummary.conflictsNeedingAttention),
      evidence: `${formatCount(syncSummary.duplicateSyncsHandled)} duplicate syncs handled`,
      tone: toneForAttention(syncSummary.conflictsNeedingAttention),
      windowLabel: formatDateTime(syncSummary.windowStartedAt),
    },
    {
      id: "freshness",
      signal: "Stale or needs-confirmation clinics",
      value: formatCount(syncSummary.staleClinics + syncSummary.needsConfirmationClinics),
      evidence: `${formatCount(syncSummary.staleClinics)} stale; ${formatCount(
        syncSummary.needsConfirmationClinics,
      )} need confirmation`,
      tone: toneForAttention(syncSummary.staleClinics + syncSummary.needsConfirmationClinics),
      windowLabel: formatDateTime(syncSummary.windowStartedAt),
    },
  ];
  const statusLabel = coverage.blockers.length
    ? `${formatCount(coverage.readinessPercent)}% readiness needs ingestion review`
    : "Ingestion evidence is ready for promotion";
  const pipelineStages: DataIngestionPipelineStage[] = [
    {
      id: "field-report-intake",
      label: "Field report intake",
      value: formatCount(pendingReports.length),
      detail:
        pendingReports.length > 0
          ? "Report payloads are waiting for review before they can promote clinic status."
          : "No field reports are waiting at the intake gate.",
      tone: toneForAttention(pendingReports.length),
      href: "#data-ingestion-workspace",
      actionLabel: "Open ledger",
    },
    {
      id: "offline-queue",
      label: "Offline queue",
      value: formatCount(syncSummary.pendingOfflineReports),
      detail: `${formatCount(syncSummary.offlineReportsReceived)} offline reports received in the sync window.`,
      tone: toneForAttention(syncSummary.pendingOfflineReports),
      href: "#data-ingestion-workspace",
      actionLabel: "Review queue",
    },
    {
      id: "validation-gate",
      label: "Validation gate",
      value: formatCount(syncSummary.validationFailures),
      detail: `${formatCount(syncSummary.conflictsNeedingAttention)} conflicts need attention before promotion.`,
      tone: toneForAttention(syncSummary.validationFailures),
      href: "#data-ingestion-workspace",
      actionLabel: "Review failures",
    },
    {
      id: "coverage-promotion",
      label: "Coverage promotion",
      value: `${formatCount(coverage.readinessPercent)}%`,
      detail: coverage.blockers.length ? coverage.blockers.join("; ") : "Coverage is ready for promotion.",
      tone: coverage.tone,
      href: "/admin/reporting-coverage",
      actionLabel: "Review coverage",
    },
  ];
  const stageTriageItems: DataIngestionStageTriageItem[] = ingestionItems.map(buildStageTriageItem);

  if (
    syncSummary.validationFailures > 0 &&
    !stageTriageItems.some((item) => item.stageId === "validation-gate")
  ) {
    stageTriageItems.push({
      id: "validation-gate-signal",
      stageId: "validation-gate",
      title: "Validation gate",
      detail: `${formatCount(
        syncSummary.validationFailures,
      )} validation failures are blocking clinic status promotion.`,
      evidenceLabel: `${formatCount(syncSummary.conflictsNeedingAttention)} conflicts need attention`,
      actionLabel: "Review failures",
      href: "#data-ingestion-workspace",
      tone: toneForAttention(syncSummary.validationFailures),
    });
  }

  if (
    syncSummary.pendingOfflineReports > 0 &&
    !stageTriageItems.some((item) => item.stageId === "offline-queue")
  ) {
    stageTriageItems.push({
      id: "offline-queue-signal",
      stageId: "offline-queue",
      title: "Offline queue",
      detail: `${formatCount(
        syncSummary.offlineReportsReceived,
      )} offline reports were received in the sync window.`,
      evidenceLabel: `${formatCount(syncSummary.pendingOfflineReports)} reports queued`,
      actionLabel: "Review queue",
      href: "#data-ingestion-workspace",
      tone: toneForAttention(syncSummary.pendingOfflineReports),
    });
  }

  const ingestionActions: DataIngestionPipelineAction[] = [
    {
      label: "Review ingestion ledger",
      href: "#data-ingestion-workspace",
      priority: "primary",
    },
    {
      label: "Open tenant health",
      href: "/admin/tenant-health",
      priority: "secondary",
    },
    {
      label: "Review coverage",
      href: "/admin/reporting-coverage",
      priority: "secondary",
    },
  ];

  return (
    <div className="space-y-4" data-admin-module="data-ingestion">
      <DataIngestionPipelineMonitor
        title="Ingestion pipeline monitor"
        statusLabel={statusLabel}
        statusTone={coverage.tone}
        rowCountLabel={`${formatCount(ingestionItems.length)} ingestion rows`}
        blockerLabel={
          coverage.blockers.length > 0
            ? `${formatCount(coverage.blockers.length)} blockers`
            : "No ingestion blockers"
        }
        blockerTone={coverage.tone}
        metrics={ingestionMetrics}
        pipelineStages={pipelineStages}
        triageItems={stageTriageItems}
        runs={ingestionSignals}
        actions={ingestionActions}
      />

      <section id="data-ingestion-workspace" className="scroll-mt-24">
        <DataIngestionWorkspace
          metrics={ingestionMetrics}
          items={ingestionItems}
          diagnostics={ingestionSignals.map(
            (signal): DataIngestionDiagnostic => ({
              id: signal.id,
              label: signal.signal,
              value: signal.value,
              evidence: signal.evidence,
              tone: signal.tone,
              windowLabel: signal.windowLabel,
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
