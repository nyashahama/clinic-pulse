import { connection } from "next/server";

import { toClientAuthSession } from "@/lib/auth/session";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import DistrictClinicNetworkPageClient from "./page-client";

export default async function DistrictClinicNetworkPage() {
  await connection();
  const workflowSession = await requireDashboardWorkflowAccess("district");

  return <DistrictClinicNetworkPageClient session={toClientAuthSession(workflowSession)} />;
}
