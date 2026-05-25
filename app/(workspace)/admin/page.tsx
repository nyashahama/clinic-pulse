import { connection } from "next/server";

import { getSessionCookieHeader, toClientAuthSession } from "@/lib/auth/session";
import {
  loadPendingReportsForRole,
  loadPartnerReadiness,
  loadSyncSummaryForRole,
} from "@/lib/demo/server-hydration";
import { requireDashboardWorkflowAccess } from "../workflow-guard";
import AdminPageClient from "./page-client";

export default async function AdminPage() {
  await connection();
  const session = await requireDashboardWorkflowAccess("admin");
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
  const [syncSummary, partnerReadiness, pendingReports] = await Promise.all([
    loadSyncSummaryForRole(session.role, apiOptions),
    loadPartnerReadiness(apiOptions),
    loadPendingReportsForRole(session.role, apiOptions),
  ]);

  return (
    <AdminPageClient
      session={toClientAuthSession(session)}
      syncSummary={syncSummary}
      partnerReadiness={partnerReadiness}
      pendingReports={pendingReports}
    />
  );
}
