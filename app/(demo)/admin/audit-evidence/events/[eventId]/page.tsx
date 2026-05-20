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
import { requireDemoWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminAuditEvents } from "../../../admin-loaders";
import {
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../../governance-formatters";

type AuditEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

function eventEntity({
  clinicId,
  entityType,
  entityId,
}: {
  clinicId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  if (clinicId) {
    return clinicId;
  }

  if (entityType || entityId) {
    return [entityType, entityId].filter(Boolean).join(" ");
  }

  return "Unavailable";
}

export default async function Page({
  params,
  searchParams,
}: AuditEventDetailPageProps) {
  await requireDemoWorkflowAccess("admin");

  const [{ eventId }, query, auditEvents] = await Promise.all([
    params,
    searchParams,
    loadAdminAuditEvents(),
  ]);
  const parsedEventId = parseAdminNumericId(eventId);

  if (!parsedEventId) {
    notFound();
  }

  const event = auditEvents.find((row) => row.id === parsedEventId);

  if (!event) {
    notFound();
  }

  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return (
    <AdminDetailShell
      eyebrow="Organisation operations"
      title="Audit event detail"
      description={event.summary}
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
            label: "Actor",
            value: event.actorName ?? "System activity",
          },
          {
            label: "Actor role",
            value: formatLabel(event.actorRole),
          },
          {
            label: "Entity",
            value: eventEntity(event),
          },
          {
            label: "Organisation",
            value: event.organisationId
              ? `Organisation ${event.organisationId}`
              : "Platform",
          },
          {
            label: "Created",
            value: formatDateTime(event.createdAt),
          },
          {
            label: "Summary",
            value: event.summary,
            className: "sm:col-span-2 xl:col-span-3",
          },
        ]}
      />
      <AdminDetailJsonBlock title="Metadata" value={event.metadata ?? {}} />
    </AdminDetailShell>
  );
}
