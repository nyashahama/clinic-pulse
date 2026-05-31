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
import { loadAdminPartnerReadiness } from "../../../admin-loaders";

type ApiKeyDetailPageProps = {
  params: Promise<{
    apiKeyId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: ApiKeyDetailPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

  const [{ apiKeyId }, query, readiness] = await Promise.all([
    params,
    searchParams,
    loadAdminPartnerReadiness(),
  ]);
  const parsedApiKeyId = parseAdminNumericId(apiKeyId);

  if (!parsedApiKeyId) {
    notFound();
  }

  const apiKey = readiness.apiKeys.find((row) => row.id === parsedApiKeyId);

  if (!apiKey) {
    notFound();
  }

  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const model = buildIntegrationDetailModel({
    kind: "api-key",
    apiKey,
    returnHref: returnTarget.href,
  });

  return (
    <AdminDetailShell
      eyebrow={model.eyebrow}
      title="API key detail"
      description={model.description}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <IntegrationEvidenceDetailBriefing model={model} />
    </AdminDetailShell>
  );
}
