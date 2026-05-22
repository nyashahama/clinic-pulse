import {
  AdminFilterBar,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import {
  type DataIngestionBacklogItem,
  type DataIngestionDiagnostic,
  DataIngestionWorkspace,
  type DataIngestionStage,
  type DataIngestionTriageItem,
} from "@/components/product/data-ingestion-workspace";
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
  type ReviewState,
} from "@/lib/product/data-trust";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { getAdminLoaderOptions } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  getReportingCoverageTone,
  StatusBadge,
  toneForAttention,
} from "../governance-formatters";

type IngestionSignal = {
  id: string;
  signal: string;
  value: number;
  evidence: string;
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

function dataTrustForClinic(clinic: ClinicDetailApiResponse) {
  return buildDataTrustState({
    source: clinic.currentStatus?.source?.toLowerCase().includes("reconciliation")
      ? "system_reconciliation"
      : "seeded_demo",
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

function stageForReport(report: ReportApiResponse): {
  id: string;
  label: string;
  tone: AdminTone;
  blocker: string;
} {
  if (report.offlineCreated) {
    return {
      id: "captured",
      label: "Captured",
      tone: "attention",
      blocker: "Offline source waiting for validation",
    };
  }

  if (report.reviewState === "pending") {
    return {
      id: "reviewed",
      label: "Reviewed",
      tone: "attention",
      blocker: "Human review gate",
    };
  }

  if (report.reviewState === "rejected") {
    return {
      id: "validated",
      label: "Validated",
      tone: "blocked",
      blocker: "Rejected source payload",
    };
  }

  return {
    id: "promoted",
    label: "Promoted",
    tone: "clear",
    blocker: "Ready for clinic status promotion",
  };
}

function buildIngestionTriageItem(
  report: ReportApiResponse,
  clinicLabel?: string,
): DataIngestionTriageItem {
  const trust = dataTrustForReport(report);
  const stage = stageForReport(report);
  const sourceLabel = report.offlineCreated ? "Offline field report" : formatLabel(report.source);
  const submittedLabel = formatDateTime(report.submittedAt);
  const receivedLabel = formatDateTime(report.receivedAt);
  const reviewLabel = formatLabel(report.reviewState);

  return {
    id: String(report.id),
    stageId: stage.id,
    stageLabel: stage.label,
    stageTone: stage.tone,
    clinicId: report.clinicId,
    clinicLabel: clinicLabel ?? report.clinicId,
    reporterLabel: report.reporterName ?? "Field report",
    sourceLabel,
    evidence: reportEvidence(report),
    submittedLabel,
    receivedLabel,
    reviewLabel,
    reviewTone: toneForAttention(report.reviewState === "pending" ? 1 : 0),
    trustLabel: trust.label,
    trustTone: trust.tone,
    trustDescription: trust.description,
    actionLabel: actionForReport(report),
    blockerLabel: stage.blocker,
    clinicHref: buildClinicDetailHref(report.clinicId),
    receiptTrail: [
      `Captured from ${sourceLabel}`,
      `Submitted ${submittedLabel}`,
      `Received ${receivedLabel}`,
      `Review state is ${reviewLabel}`,
    ],
    payloadChecks: [
      `One-clinic context: ${clinicLabel ?? report.clinicId}`,
      `Source review: ${stage.blocker}`,
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
  const ingestionItems = pendingReports.map((report) =>
    buildIngestionTriageItem(report, clinicNameById.get(report.clinicId)),
  );
  const stageCounts = new Map<string, number>();

  for (const item of ingestionItems) {
    stageCounts.set(item.stageId, (stageCounts.get(item.stageId) ?? 0) + 1);
  }

  const freshnessPressure = syncSummary.staleClinics + syncSummary.needsConfirmationClinics;
  const ingestionStages: DataIngestionStage[] = [
    {
      id: "captured",
      label: "Captured",
      count: pendingReports.length + syncSummary.pendingOfflineReports,
      tone: toneForAttention(syncSummary.pendingOfflineReports),
      description: "Field and offline payloads that entered the intake window.",
      blocker: syncSummary.pendingOfflineReports ? "Offline queue active" : "Capture clear",
    },
    {
      id: "validated",
      label: "Validated",
      count: syncSummary.validationFailures,
      tone: toneForAttention(syncSummary.validationFailures),
      description: "Payloads blocked before they can influence clinic status.",
      blocker: syncSummary.validationFailures ? "Validation failures" : "Schema clear",
    },
    {
      id: "reviewed",
      label: "Reviewed",
      count: stageCounts.get("reviewed") ?? pendingReports.length,
      tone: toneForAttention(pendingReports.length),
      description: "Reports waiting for a human review decision.",
      blocker: pendingReports.length ? "Review gate active" : "Review clear",
    },
    {
      id: "promoted",
      label: "Promoted",
      count: Math.max(clinics.length - clinicsNeedingReview.length, 0),
      tone: clinicsNeedingReview.length ? "attention" : "clear",
      description: "Clinics whose current status is usable by operations.",
      blocker: clinicsNeedingReview.length ? "Some clinics held back" : "Promotion clear",
    },
    {
      id: "reconciled",
      label: "Reconciled",
      count: freshnessPressure,
      tone: toneForAttention(freshnessPressure),
      description: "Freshness and confirmation pressure after ingestion.",
      blocker: freshnessPressure ? "Freshness backlog" : "Reconciled",
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

  return (
    <div className="space-y-4" data-admin-module="data-ingestion">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Ingestion pressure"
        description="Read-only review of sync freshness, pending field reports, offline queue, validation failures, and clinic confirmation pressure."
      />
      <AdminFilterBar>
        <StatusBadge tone={coverage.tone}>Read only ingestion evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Sync, ingestion, stale reconciliation, source, freshness, and review state are visible here.
          Retry and incident handoff controls are not exposed.
        </span>
      </AdminFilterBar>
      <DataIngestionWorkspace
        summary={{
          readinessLabel: `${formatCount(coverage.readinessPercent)}%`,
          pendingLabel: formatCount(pendingReports.length),
          offlineQueueLabel: formatCount(syncSummary.pendingOfflineReports),
          validationFailureLabel: formatCount(syncSummary.validationFailures),
          syncWindowLabel: formatDateTime(syncSummary.windowStartedAt),
        }}
        stages={ingestionStages}
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
    </div>
  );
}
