import {
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import {
  fetchAdminUsers,
  fetchOperationalClinics,
  fetchPendingReports,
  fetchPartnerReadiness,
  fetchSyncSummary,
} from "@/lib/demo/api-client";
import { buildPartnerReadinessModel } from "@/lib/demo/partner-readiness";
import {
  classifyAccessRisk,
  summarizeReportingCoverage,
} from "@/lib/product/admin-governance";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { getAdminLoaderOptions } from "../admin-loaders";
import {
  formatCount,
  formatLabel,
  StatusBadge,
  toneForAttention,
} from "../governance-formatters";

function distinctValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const options = await getAdminLoaderOptions();
  const [clinics, pendingReports, syncSummary, users, partnerReadiness] =
    await Promise.all([
      fetchOperationalClinics(options),
      fetchPendingReports(options),
      fetchSyncSummary(options),
      fetchAdminUsers(options),
      fetchPartnerReadiness(options),
    ]);
  const districts = distinctValues(clinics.map((clinic) => clinic.clinic.district));
  const organisations = distinctValues(
    users.map((user) =>
      user.organisationId ? `Organisation ${user.organisationId}` : null,
    ),
  );
  const coverage = summarizeReportingCoverage({
    clinicCount: clinics.length,
    staleClinicCount: syncSummary.staleClinics,
    needsConfirmationClinicCount: syncSummary.needsConfirmationClinics,
    pendingReviewCount: pendingReports.length,
    queuedOfflineCount: syncSummary.pendingOfflineReports,
    validationFailureCount: syncSummary.validationFailures,
  });
  const accessRisks = users
    .map((user) =>
      user.role === "reporter" ||
      user.role === "district_manager" ||
      user.role === "org_admin" ||
      user.role === "system_admin"
        ? classifyAccessRisk({
            role: user.role,
            disabled: Boolean(user.disabledAt),
            district: user.district,
            lastSeenAt: user.lastSeenAt,
          })
        : { reasons: ["Unrecognised role assignment"] },
    )
    .filter((risk) => risk.reasons.length > 0).length;
  const privilegedUsers = users.filter((user) =>
    ["org_admin", "system_admin"].includes(user.role),
  ).length;
  const partnerReadinessModel = buildPartnerReadinessModel(partnerReadiness);
  const reportPressure =
    pendingReports.length +
    syncSummary.pendingOfflineReports +
    syncSummary.validationFailures +
    syncSummary.staleClinics +
    syncSummary.needsConfirmationClinics;
  const rows = [
    {
      id: "current-tenant-estate",
      estate: organisations.length ? organisations.join(", ") : "Current tenant estate",
      district: districts.length ? districts.join(", ") : "District scope unavailable",
      clinicCoverage: `${formatCount(clinics.length)} clinics; ${formatCount(
        syncSummary.staleClinics + syncSummary.needsConfirmationClinics,
      )} need freshness review`,
      accessPressure: `${formatCount(privilegedUsers)} privileged users; ${formatCount(
        accessRisks,
      )} access review flags`,
      reportPressure: `${formatCount(reportPressure)} ingestion signals`,
      readiness: `${partnerReadinessModel.title}: ${partnerReadinessModel.description}`,
    },
  ];

  return (
    <div className="space-y-4" data-admin-module="tenant-health">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Current tenant estate"
        description="Read-only platform health for the active organisation across clinic coverage, access pressure, ingestion pressure, and partner readiness evidence."
      />
      <AdminMetricStrip
        metrics={[
          {
            label: "Clinic coverage",
            value: `${formatCount(coverage.readinessPercent)}%`,
            detail: coverage.blockers.length
              ? coverage.blockers.join("; ")
              : "No current coverage blockers",
            tone: coverage.tone,
          },
          {
            label: "Districts in scope",
            value: formatCount(districts.length),
            detail: `${formatCount(clinics.length)} operational clinics`,
            tone: "info",
          },
          {
            label: "Admin access pressure",
            value: formatCount(accessRisks),
            detail: `${formatCount(privilegedUsers)} privileged users in the estate`,
            tone: toneForAttention(accessRisks + privilegedUsers),
          },
          {
            label: "Report pressure",
            value: formatCount(reportPressure),
            detail: `${formatCount(pendingReports.length)} pending review; ${formatCount(
              syncSummary.pendingOfflineReports,
            )} offline queue`,
            tone: toneForAttention(reportPressure),
          },
        ]}
      />
      <AdminFilterBar>
        <StatusBadge tone={partnerReadinessModel.severity === "clear" ? "clear" : "attention"}>
          Partner readiness evidence
        </StatusBadge>
        <span className="text-sm text-muted-foreground">
          This workspace has one tenant organisation, so this view presents the current tenant estate
          rather than synthetic tenant rows.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="Tenant health evidence"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "estate",
            header: "Tenant / organisation",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.estate}</p>
                <p className="text-xs text-muted-foreground">
                  {formatLabel(partnerReadinessModel.severity)} readiness state
                </p>
              </div>
            ),
          },
          {
            key: "district",
            header: "District / org",
            render: (row) => row.district,
          },
          {
            key: "clinicCoverage",
            header: "Clinic coverage",
            render: (row) => row.clinicCoverage,
          },
          {
            key: "accessPressure",
            header: "Admin user pressure",
            render: (row) => row.accessPressure,
          },
          {
            key: "reportPressure",
            header: "Report pressure",
            render: (row) => row.reportPressure,
          },
          {
            key: "readiness",
            header: "Partner readiness evidence",
            render: (row) => <p className="max-w-sm text-sm">{row.readiness}</p>,
          },
        ]}
      />
    </div>
  );
}
