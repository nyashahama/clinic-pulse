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

import { requireDemoWorkflowAccess } from "../../../workflow-guard";
import { loadAdminUsers } from "../../admin-loaders";

type UserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: UserDetailPageProps) {
  await requireDemoWorkflowAccess("admin");

  const [{ userId }, query, users] = await Promise.all([
    params,
    searchParams,
    loadAdminUsers(),
  ]);
  const parsedUserId = parseAdminNumericId(userId);

  if (!parsedUserId) {
    notFound();
  }

  const user = users.find((row) => row.userId === parsedUserId);

  if (!user) {
    notFound();
  }

  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const model = buildIdentityAuditDetailModel({
    kind: "user",
    user,
    returnHref: returnTarget.href,
  });

  return (
    <AdminDetailShell
      eyebrow={model.eyebrow}
      title="User detail"
      description={model.description}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <IdentityAuditDetailBriefing model={model} />
    </AdminDetailShell>
  );
}
