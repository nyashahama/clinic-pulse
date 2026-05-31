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

type WebhookSubscriptionDetailPageProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: WebhookSubscriptionDetailPageProps) {
  await requireDemoWorkflowAccess("admin");

  const [{ subscriptionId }, query, readiness] = await Promise.all([
    params,
    searchParams,
    loadAdminPartnerReadiness(),
  ]);
  const parsedSubscriptionId = parseAdminNumericId(subscriptionId);

  if (!parsedSubscriptionId) {
    notFound();
  }

  const subscription = readiness.webhookSubscriptions.find(
    (row) => row.id === parsedSubscriptionId,
  );

  if (!subscription) {
    notFound();
  }

  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const model = buildIntegrationDetailModel({
    kind: "webhook-subscription",
    subscription,
    returnHref: returnTarget.href,
  });

  return (
    <AdminDetailShell
      eyebrow={model.eyebrow}
      title="Webhook subscription detail"
      description={model.description}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <IntegrationEvidenceDetailBriefing model={model} />
    </AdminDetailShell>
  );
}
