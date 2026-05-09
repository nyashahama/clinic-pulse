import { connection } from "next/server";

import { getSessionCookieHeader, toClientAuthSession } from "@/lib/auth/session";
import { loadSyncSummaryForRole } from "@/lib/demo/server-hydration";
import { requireDemoWorkflowAccess } from "../workflow-guard";
import DistrictConsolePageClient from "./page-client";

export default async function DistrictConsolePage() {
  await connection();
  const workflowSession = await requireDemoWorkflowAccess("demo");
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
      session={toClientAuthSession(workflowSession)}
      syncSummary={syncSummary}
    />
  );
}
