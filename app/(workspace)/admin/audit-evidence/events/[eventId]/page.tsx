import { notFound } from "next/navigation";

import { AdminDetailShell } from "@/components/product/admin-detail";
import { IdentityAuditDetailBriefing } from "@/components/product/identity-audit-detail-briefing";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { buildIdentityAuditDetailModel } from "@/lib/product/identity-audit-detail";
import { requireWorkspaceWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminAuditEvents } from "../../../admin-loaders";

type AuditEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: AuditEventDetailPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

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
  const model = buildIdentityAuditDetailModel({
    kind: "audit-event",
    event,
    returnHref: returnTarget.href,
  });

  return (
    <AdminDetailShell
      eyebrow={model.eyebrow}
      title="Audit event detail"
      description={model.description}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <IdentityAuditDetailBriefing model={model} />
    </AdminDetailShell>
  );
}
