import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
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
      <AdminMetricStrip
        metrics={[
          {
            label: "Coverage readiness",
            value: `${formatCount(coverage.readinessPercent)}%`,
            detail: coverage.blockers.length
              ? coverage.blockers.join("; ")
              : "No current ingestion blockers",
            tone: coverage.tone,
          },
          {
            label: "Pending report evidence",
            value: formatCount(pendingReports.length),
            detail: "Field reports awaiting review before status promotion",
            tone: toneForAttention(pendingReports.length),
          },
          {
            label: "Offline queue",
            value: formatCount(syncSummary.pendingOfflineReports),
            detail: `${formatCount(syncSummary.offlineReportsReceived)} received in window`,
            tone: toneForAttention(syncSummary.pendingOfflineReports),
          },
          {
            label: "Validation failures",
            value: formatCount(syncSummary.validationFailures),
            detail: `${formatCount(syncSummary.conflictsNeedingAttention)} conflicts need attention`,
            tone: toneForAttention(
              syncSummary.validationFailures + syncSummary.conflictsNeedingAttention,
            ),
          },
        ]}
      />
      <AdminFilterBar>
        <StatusBadge tone={coverage.tone}>Read only ingestion evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Sync, ingestion, stale reconciliation, source, freshness, and review state are visible here.
          Retry and incident handoff controls are not exposed.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="Ingestion signal evidence"
        rows={ingestionSignals}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "signal",
            header: "Signal",
            render: (row) => <StatusBadge tone={row.tone}>{row.signal}</StatusBadge>,
          },
          {
            key: "value",
            header: "Count",
            render: (row) => formatCount(row.value),
          },
          {
            key: "evidence",
            header: "Evidence",
            render: (row) => <p className="max-w-md text-sm">{row.evidence}</p>,
          },
          {
            key: "window",
            header: "Window started",
            render: () => formatDateTime(syncSummary.windowStartedAt),
          },
        ]}
      />
      <AdminEvidenceTable
        label="Pending report evidence"
        rows={pendingReports}
        getRowKey={(row) => String(row.id)}
        emptyState={
          <AdminEmptyState
            title="No pending report evidence"
            description="Field reports have no pending review pressure in the current scenario state."
          />
        }
        columns={[
          {
            key: "clinic",
            header: "Clinic",
            render: (row) => row.clinicId,
          },
          {
            key: "reporter",
            header: "Reporter / source",
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {row.reporterName ?? "Field report"}
                </p>
                <p className="text-xs text-muted-foreground">{formatLabel(row.source)}</p>
              </div>
            ),
          },
          {
            key: "evidence",
            header: "Pending report evidence",
            render: (row) => {
              const trust = dataTrustForReport(row);

              return (
                <div className="space-y-1">
                  <p>{reportEvidence(row)}</p>
                  <StatusBadge tone={trust.tone}>{trust.label}</StatusBadge>
                </div>
              );
            },
          },
          {
            key: "submitted",
            header: "Submitted / received",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>{formatDateTime(row.submittedAt)}</p>
                <p className="text-xs text-muted-foreground">
                  Received {formatDateTime(row.receivedAt)}
                </p>
              </div>
            ),
          },
        ]}
      />
      <AdminEvidenceTable
        label="Clinic ingestion freshness"
        rows={clinicsNeedingReview}
        getRowKey={(row) => row.clinic.id}
        emptyState={
          <AdminEmptyState
            title="No stale clinic ingestion evidence"
            description="All clinic current-status records have usable freshness evidence."
          />
        }
        columns={[
          {
            key: "clinic",
            header: "Clinic",
            render: (row) => row.clinic.name,
          },
          {
            key: "district",
            header: "District",
            render: (row) => row.clinic.district,
          },
          {
            key: "freshness",
            header: "Freshness",
            render: (row) => (
              <StatusBadge
                tone={
                  clinicNeedsIngestionReview(row) ? "attention" : "clear"
                }
              >
                {formatLabel(row.currentStatus?.freshness)}
              </StatusBadge>
            ),
          },
          {
            key: "trust",
            header: "Data trust",
            render: (row) => {
              const trust = dataTrustForClinic(row);

              return (
                <div className="space-y-1">
                  <StatusBadge tone={trust.tone}>{trust.label}</StatusBadge>
                  <p className="max-w-xs text-xs text-muted-foreground">{trust.description}</p>
                </div>
              );
            },
          },
          {
            key: "updated",
            header: "Last update",
            render: (row) => formatDateTime(row.currentStatus?.updatedAt),
          },
        ]}
      />
    </div>
  );
}
