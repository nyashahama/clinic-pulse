import { connection } from "next/server";

import { requireDemoWorkflowAccess } from "../../../workflow-guard";
import ReportDetailPageClient from "./page-client";

export default async function ReportDetailPage() {
  await connection();
  await requireDemoWorkflowAccess("demo");

  return <ReportDetailPageClient />;
}
