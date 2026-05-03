import { connection } from "next/server";

import { getSessionCookieHeader } from "@/lib/auth/session";
import { loadSyncSummaryForRole } from "@/lib/demo/server-hydration";
import { requireDemoWorkflowAccess } from "../workflow-guard";
import DistrictConsolePageClient from "./page-client";

export default async function DistrictConsolePage() {
  await connection();
  const session = await requireDemoWorkflowAccess("demo");
  const cookieHeader = await getSessionCookieHeader();
  const syncSummary = await loadSyncSummaryForRole(session.role, {
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  });

  return <DistrictConsolePageClient syncSummary={syncSummary} />;
}
