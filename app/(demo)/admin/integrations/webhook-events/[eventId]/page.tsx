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

type WebhookEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: WebhookEventDetailPageProps) {
  await requireDemoWorkflowAccess("admin");

  const [{ eventId }, query, readiness] = await Promise.all([
    params,
    searchParams,
    loadAdminPartnerReadiness(),
  ]);
  const parsedEventId = parseAdminNumericId(eventId);

  if (!parsedEventId) {
    notFound();
  }

  const event = readiness.webhookEvents.find((row) => row.id === parsedEventId);

  if (!event) {
    notFound();
  }

  const subscription = readiness.webhookSubscriptions.find(
    (row) => row.id === event.subscriptionId,
  );
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const model = buildIntegrationDetailModel({
    kind: "webhook-event",
    event,
    subscription,
    returnHref: returnTarget.href,
  });

  return (
    <AdminDetailShell
      eyebrow={model.eyebrow}
      title="Webhook event detail"
      description={model.description}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <IntegrationEvidenceDetailBriefing model={model} />
    </AdminDetailShell>
  );
}
