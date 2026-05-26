import {
  AdminFilterBar,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import { ArrowUpRightIcon } from "lucide-react";
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

type IngestionIssue = {
  label: string;
  tone: AdminTone;
};

type DataIngestionSourceReference = {
  source: string;
  role: string;
  href: string;
  licenseUse: "adaptable" | "reference-only";
};

const sourceReferences: DataIngestionSourceReference[] = [
  {
    source: "Trigger.dev",
    role: "Queue pressure, run status hierarchy, and operational backlog framing.",
    href: "https://github.com/triggerdotdev/trigger.dev",
    licenseUse: "adaptable",
  },
  {
    source: "OpenStatus",
    role: "Freshness and service-health language for visible ingestion reliability.",
    href: "https://github.com/openstatusHQ/openstatus",
    licenseUse: "reference-only",
  },
  {
    source: "Supabase Studio",
    role: "Source-led table/detail review and compact admin workspace structure.",
    href: "https://github.com/supabase/supabase",
    licenseUse: "adaptable",
  },
  {
    source: "Unkey audit logs",
    role: "Selected-row evidence inspection and auditable source-record drilldown.",
    href: "https://github.com/unkeyed/unkey",
    licenseUse: "reference-only",
  },
];

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
      <DataIngestionSourceReferences references={sourceReferences} />
    </div>
  );
}

function DataIngestionSourceReferences({
  references,
}: {
  references: DataIngestionSourceReference[];
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Research basis
          </p>
          <h2 className="break-words text-lg font-semibold text-foreground">
            Data-ingestion source references
          </h2>
        </div>
        <p className="max-w-2xl break-words text-sm text-muted-foreground">
          Ingestion pressure combines queue/run hierarchy, freshness language, and auditable
          source-record inspection from source-available consoles.
        </p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {references.map((reference) => (
          <a
            key={reference.source}
            className="group grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-muted p-3 transition hover:bg-bg-default"
            href={reference.href}
            rel="noreferrer"
            target="_blank"
          >
            <span className="flex min-w-0 items-center justify-between gap-2">
              <span className="break-words text-sm font-semibold text-foreground">
                {reference.source}
              </span>
              <ArrowUpRightIcon
                className="size-3.5 shrink-0 text-muted-foreground transition group-hover:text-foreground"
                aria-hidden="true"
              />
            </span>
            <span className="break-words text-xs leading-4 text-muted-foreground">
              {reference.role}
            </span>
            <span className="inline-flex w-fit rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {reference.licenseUse.replace("-", " ")}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
