import type { AdminTone } from "@/components/product/admin-module";
import {
  type DataIngestionBacklogItem,
  type DataIngestionDiagnostic,
  type DataIngestionLedgerItem,
  type DataIngestionSummaryMetric,
  DataIngestionWorkspace,
} from "@/components/product/data-ingestion-workspace";
import {
  EvidenceCaseBriefPanel,
  EvidenceCommandChip,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidenceTimeline,
} from "@/components/product/evidence-command";
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
import type {
  EvidenceCommandAction,
  EvidenceCommandChip as EvidenceCommandChipModel,
  EvidenceCommandMetric,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";
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

function toEvidenceTone(tone: AdminTone): EvidenceCommandTone {
  if (tone === "blocked") {
    return "critical";
  }

  if (tone === "attention") {
    return "attention";
  }

  if (tone === "info") {
    return "info";
  }

  return "stable";
}

function ingestionMetricHref(id: string) {
  if (id === "coverage-readiness") {
    return "/admin/reporting-coverage";
  }

  if (id === "pending-report-evidence") {
    return "#data-ingestion-workspace";
  }

  if (id === "offline-queue" || id === "validation-failures") {
    return "#data-ingestion-workspace";
  }

  return "/admin/data-ingestion";
}

function ingestionMetricActionLabel(id: string) {
  if (id === "coverage-readiness") {
    return "Review coverage";
  }

  if (id === "pending-report-evidence") {
    return "Open ledger";
  }

  if (id === "offline-queue") {
    return "Review queue";
  }

  if (id === "validation-failures") {
    return "Review failures";
  }

  return "Open ingestion";
}

function ingestionMetricIcon(id: string): EvidenceCommandMetric["icon"] {
  if (id === "coverage-readiness") {
    return "check";
  }

  if (id === "pending-report-evidence") {
    return "mail";
  }

  if (id === "offline-queue") {
    return "offline";
  }

  if (id === "validation-failures") {
    return "alert";
  }

  return "activity";
}

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
  const leadSignal =
    ingestionSignals.find((signal) => signal.tone === "blocked" || signal.tone === "attention") ??
    ingestionSignals[0];
  const leadTone = leadSignal ? toEvidenceTone(leadSignal.tone) : "info";
  const commandChips: EvidenceCommandChipModel[] = [
    { label: statusLabel, tone: toEvidenceTone(coverage.tone) },
    {
      label: `${formatCount(ingestionItems.length)} ingestion rows`,
      tone: ingestionItems.length > 0 ? "info" : "neutral",
    },
    {
      label:
        coverage.blockers.length > 0
          ? `${formatCount(coverage.blockers.length)} blockers`
          : "No ingestion blockers",
      tone: toEvidenceTone(coverage.tone),
    },
  ];
  const commandMetrics: EvidenceCommandMetric[] = ingestionMetrics.map((metric) => ({
    label: metric.label,
    value: metric.value,
    detail: metric.detail,
    tone: toEvidenceTone(metric.tone),
    icon: ingestionMetricIcon(metric.id),
    href: ingestionMetricHref(metric.id),
    actionLabel: ingestionMetricActionLabel(metric.id),
  }));
  const commandActions: EvidenceCommandAction[] = [
    {
      label: "Review ingestion ledger",
      href: "#data-ingestion-workspace",
      priority: "primary",
      icon: "stream",
    },
    {
      label: "Open tenant health",
      href: "/admin/tenant-health",
      priority: "secondary",
      icon: "stream",
    },
    {
      label: "Review coverage",
      href: "/admin/reporting-coverage",
      priority: "secondary",
      icon: "report",
    },
  ];
  const headerActions = commandActions.filter((action) => action.priority === "secondary");

  return (
    <div className="space-y-4" data-admin-module="data-ingestion">
      <EvidenceCommandHeader
        actions={headerActions}
        eyebrow="Platform ingestion"
        title="Ingestion command cockpit"
        description="Review sync freshness, pending field reports, offline queue pressure, validation failures, and clinic confirmation risk before status promotion."
      >
        <div className="flex flex-wrap gap-1.5">
          {commandChips.map((chip) => (
            <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone ?? "neutral"}`} />
          ))}
        </div>
      </EvidenceCommandHeader>

      <EvidenceCommandMetricStrip
        ariaLabel="Data ingestion command metrics"
        metrics={commandMetrics}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <EvidenceCaseBriefPanel
          title="Ingestion promotion packet"
          description="Decision-ready ingestion evidence for coverage freshness, pending reports, offline queue pressure, validation failures, and clinic confirmation risk."
          summary={{
            label: "Promotion verdict",
            value: statusLabel,
            tone: toEvidenceTone(coverage.tone),
            emphasis: true,
          }}
          primaryFields={[
            {
              label: "Ingestion evidence",
              value: `${formatCount(ingestionItems.length)} rows`,
              href: "#data-ingestion-workspace",
              emphasis: true,
            },
            {
              label: "Coverage readiness",
              value: `${formatCount(coverage.readinessPercent)}%`,
              href: "/admin/reporting-coverage",
              tone: toEvidenceTone(coverage.tone),
            },
            {
              label: "Clinic review load",
              value: `${formatCount(clinicsNeedingReview.length)} clinics`,
              href: "/admin/reporting-coverage",
              tone: toEvidenceTone(toneForAttention(clinicsNeedingReview.length)),
            },
          ]}
          sections={[
            {
              title: "Intake queue rail",
              description:
                "The ingestion pressure signals that explain whether source data is ready for status promotion.",
              fields: [
                {
                  label: "Pending report evidence",
                  value: formatCount(pendingReports.length),
                  href: "#data-ingestion-workspace",
                  tone: toEvidenceTone(toneForAttention(pendingReports.length)),
                },
                {
                  label: "Offline queue",
                  value: formatCount(syncSummary.pendingOfflineReports),
                  href: "#data-ingestion-workspace",
                  tone: toEvidenceTone(toneForAttention(syncSummary.pendingOfflineReports)),
                },
                {
                  label: "Validation failures",
                  value: formatCount(syncSummary.validationFailures),
                  href: "#data-ingestion-workspace",
                  tone: toEvidenceTone(toneForAttention(syncSummary.validationFailures)),
                },
                {
                  label: "Conflict review",
                  value: formatCount(syncSummary.conflictsNeedingAttention),
                  href: "#data-ingestion-workspace",
                  tone: toEvidenceTone(toneForAttention(syncSummary.conflictsNeedingAttention)),
                },
              ],
            },
            {
              title: "Promotion route map",
              description:
                "The system-admin destinations that explain source records, coverage, audit evidence, and tenant health.",
              fields: [
                {
                  label: "Open ingestion ledger",
                  value: `${formatCount(ingestionItems.length)} rows`,
                  href: "#data-ingestion-workspace",
                  tone: toEvidenceTone(coverage.tone),
                },
                {
                  label: "Review reporting coverage",
                  value: `${formatCount(clinicsNeedingReview.length)} clinics`,
                  href: "/admin/reporting-coverage",
                  tone: toEvidenceTone(toneForAttention(clinicsNeedingReview.length)),
                },
                {
                  label: "Trace audit evidence",
                  value: `${formatCount(pendingReports.length)} reports`,
                  href: "/admin/audit-evidence",
                  tone: toEvidenceTone(toneForAttention(pendingReports.length)),
                },
                {
                  label: "Open tenant health",
                  value: `${formatCount(syncSummary.validationFailures)} failures`,
                  href: "/admin/tenant-health",
                  tone: toEvidenceTone(toneForAttention(syncSummary.validationFailures)),
                },
              ],
            },
          ]}
        />
        <div className="grid min-w-0 content-start gap-4">
          <EvidenceDecisionPanel
            decision={{
              contextLabel: "Data ingestion",
              title:
                coverage.blockers.length > 0
                  ? "Ingestion evidence needs review"
                  : "Ingestion evidence is ready",
              scoreLabel: "Lead signal",
              scoreValue: leadSignal?.signal ?? "No active signal",
              chips: commandChips,
              nextStep:
                coverage.blockers.length > 0 && leadSignal
                  ? `Review ${leadSignal.signal.toLowerCase()} before promoting clinic status data.`
                  : "Keep the ingestion ledger in monitoring while coverage and audit evidence stay current.",
              nextStepTone: leadTone,
              impactTitle: "System impact",
              impact:
                "System administrators need ingestion evidence to connect field reports, offline sync, validation, and coverage before they trust downstream tenant health.",
              verificationTitle: "Verification",
              verification:
                "Use the detailed ingestion workspace below to inspect receipt trails, payload checks, diagnostics, and clinic-backed source rows.",
              evidence: leadSignal
                ? {
                    label: leadSignal.evidence,
                    detail: `${formatCount(leadSignal.value)} ${leadSignal.signal.toLowerCase()}`,
                    href: "#data-ingestion-workspace",
                    tone: leadTone,
                  }
                : undefined,
              actions: commandActions,
            }}
          />
          <EvidenceTimeline
            title="Ingestion promotion timeline"
            description="The review sequence a system administrator should follow before trusting promoted status data."
            items={[
              {
                label: "Coverage",
                title:
                  coverage.blockers.length > 0
                    ? `${formatCount(coverage.blockers.length)} coverage blockers`
                    : "Coverage evidence clear",
                description: coverage.blockers.length
                  ? coverage.blockers.join("; ")
                  : "Reporting coverage is not raising ingestion blockers.",
                tone: toEvidenceTone(coverage.tone),
              },
              {
                label: "Reports",
                title:
                  pendingReports.length > 0
                    ? `${formatCount(pendingReports.length)} pending report events`
                    : "No pending report evidence",
                description:
                  "Field report events stay in the ledger until source review and status promotion are complete.",
                tone: toEvidenceTone(toneForAttention(pendingReports.length)),
              },
              {
                label: "Sync",
                title:
                  syncSummary.pendingOfflineReports > 0
                    ? `${formatCount(syncSummary.pendingOfflineReports)} offline reports queued`
                    : "Offline queue clear",
                description: `${formatCount(syncSummary.offlineReportsReceived)} offline reports received in the sync window.`,
                timestamp: formatDateTime(syncSummary.windowStartedAt),
                tone: toEvidenceTone(toneForAttention(syncSummary.pendingOfflineReports)),
              },
              {
                label: "Validation",
                title:
                  syncSummary.validationFailures > 0
                    ? `${formatCount(syncSummary.validationFailures)} validation failures`
                    : "Validation checks clear",
                description: `${formatCount(syncSummary.conflictsNeedingAttention)} conflicts need attention.`,
                tone: toEvidenceTone(toneForAttention(syncSummary.validationFailures)),
              },
            ]}
          />
        </div>
      </div>

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
