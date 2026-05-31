import { connection } from "next/server";

import { requireDashboardWorkflowAccess } from "../../../workflow-guard";
import ReportDetailPageClient from "../../../district/reports/[reportId]/page-client";

export default async function DistrictReportDetailPage() {
  await connection();
  await requireDashboardWorkflowAccess("district");

  return <ReportDetailPageClient consoleHref="/district" />;
}
