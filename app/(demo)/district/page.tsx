import { connection } from "next/server";

import { getSessionCookieHeader, toClientAuthSession } from "@/lib/auth/session";
import { loadSyncSummaryForRole } from "@/lib/demo/server-hydration";
import { requireDashboardWorkflowAccess } from "../workflow-guard";
import DistrictConsolePageClient from "../demo/page-client";

export default async function DistrictWorkspacePage() {
  await connection();
  const workflowSession = await requireDashboardWorkflowAccess("district");
  const cookieHeader = await getSessionCookieHeader();
  const syncSummary = await loadSyncSummaryForRole(workflowSession.role, {
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  });

  return (
    <DistrictConsolePageClient
      consoleHref="/district"
      session={toClientAuthSession(workflowSession)}
      syncSummary={syncSummary}
    />
  );
}
