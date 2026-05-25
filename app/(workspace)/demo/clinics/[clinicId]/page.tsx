import { connection } from "next/server";

import { requireDashboardWorkflowAccess } from "../../../workflow-guard";
import ClinicDetailPageClient from "./page-client";

export default async function ClinicDetailPage() {
  await connection();
  await requireDashboardWorkflowAccess("demo");

  return <ClinicDetailPageClient />;
}
