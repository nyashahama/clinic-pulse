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
import { requireDemoWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminPartnerReadiness } from "../../../admin-loaders";

type IntegrationCheckDetailPageProps = {
  params: Promise<{
    checkId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: IntegrationCheckDetailPageProps) {
  await requireDemoWorkflowAccess("admin");

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
  const model = buildIntegrationDetailModel({
    kind: "integration-check",
    check,
    returnHref: returnTarget.href,
  });

  return (
    <AdminDetailShell
      eyebrow={model.eyebrow}
      title="Integration check detail"
      description={model.description}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <IntegrationEvidenceDetailBriefing model={model} />
    </AdminDetailShell>
  );
}
