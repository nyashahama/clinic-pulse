import {
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import {
  fetchOperationalClinics,
  fetchPendingReports,
  fetchSyncSummary,
} from "@/lib/demo/api-client";
import type { ClinicDetailApiResponse } from "@/lib/demo/api-types";
import { summarizeReportingCoverage } from "@/lib/product/admin-governance";
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
    pendingReviewCount: pendingReports.length,
    queuedOfflineCount: syncSummary.pendingOfflineReports,
    validationFailureCount: syncSummary.validationFailures,
  });
  const attentionClinics = clinics.filter((clinic) => coverageTone(clinic) !== "clear").length;

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
          Stale, unknown, and needs-confirmation statuses are highlighted for attention.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="Clinic reporting coverage"
        rows={clinics}
        getRowKey={(row) => row.clinic.id}
        columns={[
          {
            key: "clinic",
            header: "Clinic",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.clinic.name}</p>
                <p className="text-xs text-muted-foreground">{row.clinic.facilityCode}</p>
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
            key: "evidence",
            header: "Evidence note",
            render: (row) => coverageNote(row),
          },
        ]}
      />
    </div>
  );
}
