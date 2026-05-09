import { connection } from "next/server";

import type { ClientAuthSession } from "@/lib/auth/api";
import { getSessionCookieHeader } from "@/lib/auth/session";
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
  const session = {
    displayName: workflowSession.user.displayName,
    email: workflowSession.user.email,
    role: workflowSession.role,
    ...(workflowSession.activeMembership.district
      ? { district: workflowSession.activeMembership.district }
      : {}),
    ...(workflowSession.activeMembership.organisationId === undefined
      ? {}
      : { organisationId: workflowSession.activeMembership.organisationId }),
  } satisfies ClientAuthSession;

  return <DistrictConsolePageClient session={session} syncSummary={syncSummary} />;
}
