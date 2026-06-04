import { connection } from "next/server";

import { requireDashboardWorkflowAccess } from "../../../workflow-guard";
import ClinicDetailPageClient from "./page-client";

export default async function DistrictClinicDetailPage() {
  await connection();
  await requireDashboardWorkflowAccess("district");

  return <ClinicDetailPageClient consoleHref="/district" />;
}
