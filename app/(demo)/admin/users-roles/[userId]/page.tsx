import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRightIcon } from "lucide-react";

import {
  AdminDetailActionPanel,
  AdminDetailEvidenceList,
  AdminDetailShell,
  AdminDetailSignalBar,
  AdminDetailTimeline,
} from "@/components/product/admin-detail";
import { buttonVariants } from "@/components/ui/button";
import {
  buildAccessUserDetailModel,
} from "@/lib/product/admin-access-governance";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
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
  const detailModel = buildAccessUserDetailModel(user);

  return (
    <AdminDetailShell
      eyebrow="Access governance"
      title="User detail"
      description={`${user.displayName} / ${user.email}`}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailSignalBar signals={detailModel.signals} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)]">
        <AdminDetailEvidenceList
          title="Access evidence"
          description="Role, scope, lifecycle, and session facts used for the access review decision."
          items={detailModel.evidenceItems}
        />
        <AdminDetailActionPanel
          title="Access decision"
          description={
            detailModel.reasons.length
              ? "Close the access exception in users and roles, then use audit evidence as the durable record."
              : "No access exception is visible from the current evidence."
          }
        >
          {detailModel.decisionActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={buttonVariants({
                variant: action.label === "Manage access" ? "default" : "outline",
                size: "sm",
                className: "min-h-9 justify-between whitespace-normal text-left",
              })}
            >
              <span className="min-w-0">
                <span className="block font-medium">{action.label}</span>
                <span className="block text-xs font-normal opacity-75">
                  {action.description}
                </span>
              </span>
              <ArrowUpRightIcon aria-hidden="true" />
            </Link>
          ))}
        </AdminDetailActionPanel>
      </div>
      <AdminDetailTimeline
        title="Access evidence timeline"
        description="The organisation admin can verify why the account is in review before changing access."
        items={detailModel.timeline}
      />
    </AdminDetailShell>
  );
}
