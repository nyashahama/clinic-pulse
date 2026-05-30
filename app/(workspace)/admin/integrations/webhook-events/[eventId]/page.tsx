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
import { requireWorkspaceWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminPartnerReadiness } from "../../../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../../governance-formatters";

type WebhookEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

function eventTone(status: string) {
  if (status === "failed") {
    return "blocked" as const;
  }

  if (status === "delivered") {
    return "clear" as const;
  }

  return "info" as const;
}

export default async function Page({
  params,
  searchParams,
}: WebhookEventDetailPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

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

  return (
    <AdminDetailShell
      eyebrow="Partner operations"
      title="Webhook event detail"
      description={`${formatLabel(event.eventType)} / ${formatLabel(event.status)}`}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Event type",
            value: <StatusBadge tone="info">{formatLabel(event.eventType)}</StatusBadge>,
          },
          {
            label: "Status",
            value: (
              <StatusBadge tone={eventTone(event.status)}>
                {formatLabel(event.status)}
              </StatusBadge>
            ),
          },
          {
            label: "Subscription",
            value: subscription
              ? `${subscription.name} (${event.subscriptionId})`
              : `Subscription ${event.subscriptionId}`,
          },
          {
            label: "Attempts",
            value: formatCount(event.attemptCount),
          },
          {
            label: "Created",
            value: formatDateTime(event.createdAt),
          },
          {
            label: "Delivered",
            value: formatDateTime(event.deliveredAt),
          },
          {
            label: "Last error",
            value: event.lastError ?? "None recorded",
            className: "sm:col-span-2 xl:col-span-3",
          },
        ]}
      />
      <AdminDetailJsonBlock title="Payload" value={event.payload} />
      <AdminDetailJsonBlock title="Metadata" value={event.metadata} />
    </AdminDetailShell>
  );
}
