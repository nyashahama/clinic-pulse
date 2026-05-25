import { notFound } from "next/navigation";

import {
  AdminDetailFieldGrid,
  AdminDetailJsonBlock,
  AdminDetailShell,
} from "@/components/product/admin-detail";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { requireDashboardWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminPartnerReadiness } from "../../../admin-loaders";
import {
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../../governance-formatters";

type IntegrationCheckDetailPageProps = {
  params: Promise<{
    checkId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

function checkTone(status: string) {
  if (status === "passing") {
    return "clear" as const;
  }

  if (status === "failing") {
    return "blocked" as const;
  }

  return "attention" as const;
}

export default async function Page({
  params,
  searchParams,
}: IntegrationCheckDetailPageProps) {
  await requireDashboardWorkflowAccess("admin");

  const [{ checkId }, query, readiness] = await Promise.all([
    params,
    searchParams,
    loadAdminPartnerReadiness(),
  ]);
  const parsedCheckId = parseAdminNumericId(checkId);

  if (!parsedCheckId) {
    notFound();
  }

  const check = readiness.integrationChecks.find((row) => row.id === parsedCheckId);

  if (!check) {
    notFound();
  }

  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return (
    <AdminDetailShell
      eyebrow="Partner operations"
      title="Integration check detail"
      description={check.summary}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Check",
            value: formatLabel(check.checkName),
          },
          {
            label: "Status",
            value: (
              <StatusBadge tone={checkTone(check.status)}>
                {formatLabel(check.status)}
              </StatusBadge>
            ),
          },
          {
            label: "Organisation",
            value: check.organisationId
              ? `Organisation ${check.organisationId}`
              : "Platform",
          },
          {
            label: "Checked",
            value: formatDateTime(check.checkedAt),
          },
          {
            label: "Summary",
            value: check.summary,
            className: "sm:col-span-2 xl:col-span-3",
          },
        ]}
      />
      <AdminDetailJsonBlock title="Metadata" value={check.metadata} />
    </AdminDetailShell>
  );
}
