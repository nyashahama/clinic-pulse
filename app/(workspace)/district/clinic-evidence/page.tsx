import { connection } from "next/server";

import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import DistrictClinicEvidencePageClient from "./page-client";

export default async function DistrictClinicEvidencePage() {
  await connection();
  await requireDashboardWorkflowAccess("district");

  return <DistrictClinicEvidencePageClient />;
}
