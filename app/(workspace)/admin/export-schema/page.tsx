import {
  AdminDetailFieldGrid,
  AdminDetailJsonBlock,
  AdminDetailShell,
} from "@/components/product/admin-detail";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";

type ExportSchemaPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

const exportSchema = {
  generatedAt: "ISO-8601 timestamp",
  district: "District name represented in the package",
  province: "Province name represented in the package",
  clinics: [
    {
      id: "Clinic identifier",
      name: "Clinic display name",
      facilityCode: "Facility code",
      status: "operational | degraded | non_functional | unknown",
      freshness: "fresh | needs_confirmation | stale | unknown",
      reason: "Current operating-state reason",
    },
  ],
  leads: [
    {
      name: "Stakeholder name",
      workEmail: "Stakeholder work email",
      organization: "Organisation",
      interest: "Workflow interest",
      status: "new | contacted | scheduled | completed",
      createdAt: "ISO-8601 timestamp",
    },
  ],
  alerts: ["Audit and alert events included in the operations package"],
  reports: [
    {
      id: "Report identifier",
      clinicId: "Clinic identifier",
      status: "Reported operating status",
      reason: "Submitted context",
      receivedAt: "ISO-8601 timestamp",
      source: "Report source",
    },
  ],
};

export default async function Page({ searchParams }: ExportSchemaPageProps) {
  await requireDashboardWorkflowAccess("admin");

  const query = await searchParams;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return (
    <AdminDetailShell
      eyebrow="Operations package"
      title="Export schema detail"
      description="Review the JSON and CSV export contract before handing operations data into analytics or BI tools."
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Primary purpose",
            value: "Operations review package for clinics, stakeholder leads, alerts, and reports.",
            className: "sm:col-span-2 xl:col-span-3",
          },
          {
            label: "Supported formats",
            value: "JSON and CSV",
          },
          {
            label: "Clinic status field",
            value: "operational, degraded, non functional, or unknown",
          },
          {
            label: "Freshness field",
            value: "fresh, needs confirmation, stale, or unknown",
          },
          {
            label: "Review note",
            value: "Use the export evidence pages for persisted partner export runs.",
            className: "sm:col-span-2 xl:col-span-3",
          },
        ]}
      />
      <AdminDetailJsonBlock title="Schema shape" value={exportSchema} />
    </AdminDetailShell>
  );
}
