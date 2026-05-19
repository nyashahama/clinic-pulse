import {
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import Link from "next/link";
import {
  fetchOperationalClinics,
  fetchPendingReports,
  fetchSyncSummary,
} from "@/lib/demo/api-client";
import type { ClinicDetailApiResponse } from "@/lib/demo/api-types";
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

function coverageTone(clinic: ClinicDetailApiResponse) {
  if (!clinic.currentStatus) {
    return "attention";
  }

  return getReportingCoverageTone({
    status: clinic.currentStatus.status,
    freshness: clinic.currentStatus.freshness,
  });
}

function coverageNote(clinic: ClinicDetailApiResponse) {
  if (!clinic.currentStatus) {
    return "No current status evidence";
  }

  const tone = coverageTone(clinic);
  if (tone === "attention") {
    return "Needs confirmation in operating review";
  }

  return "Current status evidence available";
}

function trustTone(tone: "clear" | "attention" | "blocked") {
  return tone;
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

function reviewStateForClinic(
  clinic: ClinicDetailApiResponse,
  pendingReviewClinicIds: Set<string>,
): ReviewState {
  if (pendingReviewClinicIds.has(clinic.clinic.id)) {
    return "pending_review";
  }

  return clinic.currentStatus ? "not_required" : "unknown";
}

function dataTrustForClinic(
  clinic: ClinicDetailApiResponse,
  pendingReviewClinicIds: Set<string>,
) {
  return buildDataTrustState({
    source: dataSourceForClinic(clinic),
    freshness: dataFreshnessForClinic(clinic),
    reviewState: reviewStateForClinic(clinic, pendingReviewClinicIds),
    lastVerifiedAt: clinic.currentStatus?.lastReportedAt ?? clinic.currentStatus?.updatedAt,
    evidenceHref: `/admin/audit-evidence`,
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
  const attentionClinics = clinics.filter((clinic) => coverageTone(clinic) !== "clear").length;
  const pendingReviewClinicIds = new Set(pendingReports.map((report) => report.clinicId));

  return (
    <div className="space-y-4">
      <AdminModuleHeader
        eyebrow="Organisation operations"
        title="Reporting coverage"
        description="Read-only coverage view for clinic status freshness, pending reviews, offline queue pressure, and validation evidence."
      />
      <AdminMetricStrip
        metrics={[
          {
            label: "Coverage readiness",
            value: `${formatCount(coverage.readinessPercent)}%`,
            detail: coverage.blockers.length
              ? coverage.blockers.join("; ")
              : "No current coverage blockers",
            tone: coverage.tone,
          },
          {
            label: "Operational clinics",
            value: formatCount(clinics.length),
            detail: `${formatCount(attentionClinics)} need attention`,
            tone: toneForAttention(attentionClinics),
          },
          {
            label: "Pending review",
            value: formatCount(pendingReports.length),
            tone: toneForAttention(pendingReports.length),
          },
          {
            label: "Queued offline",
            value: formatCount(syncSummary.pendingOfflineReports),
            detail: `${formatCount(syncSummary.validationFailures)} validation failures`,
            tone: toneForAttention(
              syncSummary.pendingOfflineReports + syncSummary.validationFailures,
            ),
          },
        ]}
      />
      <AdminFilterBar>
        <StatusBadge tone="info">Operating evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Source, freshness, and review state are shown beside each clinic. Stale, unknown, and
          needs-confirmation statuses are highlighted for attention.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="Clinic reporting coverage"
        rows={clinics}
        getRowAriaLabel={(row) => `Open ${row.clinic.name} clinic detail`}
        getRowHref={(row) => `/district/clinics/${encodeURIComponent(row.clinic.id)}`}
        getRowKey={(row) => row.clinic.id}
        columns={[
          {
            key: "clinic",
            header: "Clinic",
            render: (row) => (
              <div className="min-w-0">
                <Link
                  href={`/district/clinics/${encodeURIComponent(row.clinic.id)}`}
                  className="group/link inline-flex min-w-0 flex-col rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="font-medium text-primary underline-offset-4 group-hover/link:underline group-focus-visible/link:underline">
                    {row.clinic.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{row.clinic.facilityCode}</span>
                </Link>
              </div>
            ),
          },
          {
            key: "district",
            header: "District",
            render: (row) => row.clinic.district,
          },
          {
            key: "status",
            header: "Status / freshness",
            render: (row) => (
              <div className="space-y-1">
                <StatusBadge tone={coverageTone(row)}>
                  {formatLabel(row.currentStatus?.status)}
                </StatusBadge>
                <p className="text-xs text-muted-foreground">
                  {formatLabel(row.currentStatus?.freshness)}
                </p>
              </div>
            ),
          },
          {
            key: "lastReport",
            header: "Last report / update",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>{formatDateTime(row.currentStatus?.lastReportedAt)}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatDateTime(row.currentStatus?.updatedAt)}
                </p>
              </div>
            ),
          },
          {
            key: "dataTrust",
            header: "Data trust",
            render: (row) => {
              const trust = dataTrustForClinic(row, pendingReviewClinicIds);

              return (
                <div className="space-y-1">
                  <StatusBadge tone={trustTone(trust.tone)}>{trust.label}</StatusBadge>
                  <p className="max-w-xs text-xs text-muted-foreground">{trust.description}</p>
                </div>
              );
            },
          },
          {
            key: "evidence",
            header: "Evidence note",
            render: (row) => coverageNote(row),
          },
        ]}
      />
    </div>
  );
}
