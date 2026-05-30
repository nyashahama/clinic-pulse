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
import { requireWorkspaceWorkflowAccess } from "../../workflow-guard";

type ApiContractPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

const endpointContract = [
  {
    method: "GET",
    path: "/v1/clinics",
    purpose: "Operational clinic directory for authenticated operations users.",
  },
  {
    method: "POST",
    path: "/v1/reports",
    purpose: "Field report submission that enters review before changing trusted state.",
  },
  {
    method: "GET",
    path: "/v1/partner/alternatives",
    purpose: "Partner-safe alternative clinic recommendations.",
  },
  {
    method: "GET",
    path: "/v1/partner/export/latest",
    purpose: "Latest generated partner export metadata.",
  },
  {
    method: "GET",
    path: "/v1/partner/integration-status",
    purpose: "Partner-visible readiness and integration status.",
  },
];

export default async function Page({ searchParams }: ApiContractPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

  const query = await searchParams;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return (
    <AdminDetailShell
      eyebrow="Builder interface"
      title="API contract detail"
      description="Review the partner and operations API contract represented by the admin API preview."
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Authentication",
            value: "Operations sessions and partner bearer keys.",
          },
          {
            label: "Browser path",
            value: "/api/clinicpulse/* same-origin proxy",
          },
          {
            label: "API service",
            value: "ClinicPulse Go API",
          },
          {
            label: "Primary review page",
            value: "Integrations",
          },
          {
            label: "Safety boundary",
            value: "Partner endpoints hide reporter identity and internal metadata.",
            className: "sm:col-span-2",
          },
        ]}
      />
      <AdminDetailJsonBlock title="Endpoint contract" value={endpointContract} />
    </AdminDetailShell>
  );
}
