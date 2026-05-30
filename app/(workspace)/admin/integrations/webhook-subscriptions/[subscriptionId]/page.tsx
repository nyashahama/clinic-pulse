import { notFound } from "next/navigation";

import {
  AdminDetailFieldGrid,
  AdminDetailJsonBlock,
  AdminDetailShell,
  formatAdminDetailList,
} from "@/components/product/admin-detail";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { requireWorkspaceWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminPartnerReadiness } from "../../../admin-loaders";
import {
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../../governance-formatters";

type WebhookSubscriptionDetailPageProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

function subscriptionTone(status: string) {
  return status === "active" ? "clear" : "attention";
}

export default async function Page({
  params,
  searchParams,
}: WebhookSubscriptionDetailPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

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

  return (
    <AdminDetailShell
      eyebrow="Partner operations"
      title="Webhook subscription detail"
      description={`${subscription.name} / ${subscription.targetUrl}`}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Subscription",
            value: subscription.name,
          },
          {
            label: "Status",
            value: (
              <StatusBadge tone={subscriptionTone(subscription.status)}>
                {formatLabel(subscription.status)}
              </StatusBadge>
            ),
          },
          {
            label: "Target URL",
            value: (
              <span className="break-all font-mono text-xs">
                {subscription.targetUrl}
              </span>
            ),
            className: "sm:col-span-2",
          },
          {
            label: "Event types",
            value: formatAdminDetailList(subscription.eventTypes.map(formatLabel)),
            className: "sm:col-span-2",
          },
          {
            label: "Last tested",
            value: formatDateTime(subscription.lastTestedAt),
          },
          {
            label: "Last test status",
            value: formatLabel(subscription.lastTestStatus),
          },
          {
            label: "Last error",
            value: subscription.lastError ?? "None recorded",
            className: "sm:col-span-2",
          },
          {
            label: "Created",
            value: formatDateTime(subscription.createdAt),
          },
          {
            label: "Updated",
            value: formatDateTime(subscription.updatedAt),
          },
        ]}
      />
      <AdminDetailJsonBlock
        title="Last test metadata"
        value={subscription.lastTestMetadata}
      />
    </AdminDetailShell>
  );
}
