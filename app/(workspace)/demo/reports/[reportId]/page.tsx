import { connection } from "next/server";

import { requireDashboardWorkflowAccess } from "../../../workflow-guard";
import ReportDetailPageClient from "./page-client";

export default async function ReportDetailPage() {
  await connection();
  await requireDashboardWorkflowAccess("demo");

  return <ReportDetailPageClient />;
}
