import { notFound } from "next/navigation";

import { AdminDetailShell } from "@/components/product/admin-detail";
import { IntegrationEvidenceDetailBriefing } from "@/components/product/integration-evidence-detail-briefing";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { buildIntegrationDetailModel } from "@/lib/product/integration-detail";
import { requireWorkspaceWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminGovernanceData } from "../../../admin-loaders";

type ExportRunDetailPageProps = {
  params: Promise<{
    exportRunId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: ExportRunDetailPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

  const [{ exportRunId }, query, data] = await Promise.all([
    params,
    searchParams,
    loadAdminGovernanceData(),
  ]);
  const parsedExportRunId = parseAdminNumericId(exportRunId);

  if (!parsedExportRunId) {
    notFound();
  }

  const exportRun = data.partnerReadiness.exportRuns.find(
    (row) => row.id === parsedExportRunId,
  );

  if (!exportRun) {
    notFound();
  }

  const requester = exportRun.requestedByUserId
    ? data.users.find((user) => user.userId === exportRun.requestedByUserId)
    : undefined;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const requesterLabel = requester
    ? `${requester.displayName} (${requester.email})`
    : exportRun.requestedByUserId
      ? `User ${exportRun.requestedByUserId}`
      : "Unavailable";
  const model = buildIntegrationDetailModel({
    kind: "export-run",
    exportRun,
    requesterLabel,
    returnHref: returnTarget.href,
  });

  return (
    <AdminDetailShell
      eyebrow={model.eyebrow}
      title="Export run detail"
      description={model.description}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <IntegrationEvidenceDetailBriefing model={model} />
    </AdminDetailShell>
  );
}
