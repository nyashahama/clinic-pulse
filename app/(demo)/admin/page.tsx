import { connection } from "next/server";

import { getSessionCookieHeader } from "@/lib/auth/session";
import { loadSyncSummaryForRole } from "@/lib/demo/server-hydration";
import { requireDemoWorkflowAccess } from "../workflow-guard";
import AdminPageClient from "./page-client";

export default async function AdminPage() {
  await connection();
  const session = await requireDemoWorkflowAccess("admin");
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

  return <AdminPageClient syncSummary={syncSummary} />;
}
