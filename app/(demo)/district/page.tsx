import { connection } from "next/server";

import { getSessionCookieHeader, toClientAuthSession } from "@/lib/auth/session";
import {
  loadPendingReportsForRole,
  loadSyncSummaryForRole,
} from "@/lib/demo/server-hydration";
import { requireDashboardWorkflowAccess } from "../workflow-guard";
import DistrictConsolePageClient from "../demo/page-client";

export default async function DistrictWorkspacePage() {
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
    <DistrictConsolePageClient
      consoleHref="/district"
      session={toClientAuthSession(workflowSession)}
      pendingReports={pendingReports}
      syncSummary={syncSummary}
    />
  );
}
