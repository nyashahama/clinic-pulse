import { connection } from "next/server";

import { getSessionCookieHeader, toClientAuthSession } from "@/lib/auth/session";
import {
  loadPendingReportsForRole,
  loadSyncSummaryForRole,
} from "@/lib/workspace/server-hydration";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import DistrictSeverityQueuePageClient from "./page-client";

export default async function DistrictSeverityQueuePage() {
  await connection();
  const workflowSession = await requireDashboardWorkflowAccess("district");
  const cookieHeader = await getSessionCookieHeader();
  const apiOptions = {
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  };
  const [syncSummary, pendingReports] = await Promise.all([
    loadSyncSummaryForRole(workflowSession.role, apiOptions),
    loadPendingReportsForRole(workflowSession.role, apiOptions),
  ]);

  return (
    <DistrictSeverityQueuePageClient
      pendingReports={pendingReports}
      session={toClientAuthSession(workflowSession)}
      syncSummary={syncSummary}
    />
  );
}
