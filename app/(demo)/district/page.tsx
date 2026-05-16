import { connection } from "next/server";
import Link from "next/link";

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
    <div className="grid gap-4">
      <p className="rounded-lg border border-border-subtle bg-bg-default p-3 text-xs text-content-subtle shadow-sm">
        Pilot safety: confirm stale or pending data before operational decisions.{" "}
        <Link href="/legal/safety" className="underline">
          Read safety notes
        </Link>
        .
      </p>
      <DistrictConsolePageClient
        consoleHref="/district"
        session={toClientAuthSession(workflowSession)}
        pendingReports={pendingReports}
        showReportReview={true}
        syncSummary={syncSummary}
      />
    </div>
  );
}
