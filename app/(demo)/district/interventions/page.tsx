import { connection } from "next/server";

import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import DistrictInterventionsPageClient from "./page-client";

export default async function DistrictInterventionsPage() {
  await connection();
  await requireDashboardWorkflowAccess("district");

  return <DistrictInterventionsPageClient />;
}
