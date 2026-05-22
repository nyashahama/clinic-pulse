import { connection } from "next/server";

import { requireDemoWorkflowAccess } from "../../../workflow-guard";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import LeadDetailPageClient from "./page-client";

type LeadDetailPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

export default async function LeadDetailPage({
  searchParams,
}: LeadDetailPageProps) {
  await connection();
  await requireDemoWorkflowAccess("admin");

  const query = await searchParams;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return <LeadDetailPageClient returnTarget={returnTarget} />;
}
