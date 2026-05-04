import { connection } from "next/server";

import { getSessionCookieHeader } from "@/lib/auth/session";
import {
  loadPartnerReadiness,
  loadSyncSummaryForRole,
} from "@/lib/demo/server-hydration";
import { requireDemoWorkflowAccess } from "../workflow-guard";
import AdminPageClient from "./page-client";

export default async function AdminPage() {
  await connection();
  const session = await requireDemoWorkflowAccess("admin");
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
  const [syncSummary, partnerReadiness] = await Promise.all([
    loadSyncSummaryForRole(session.role, apiOptions),
    loadPartnerReadiness(apiOptions),
  ]);

  return (
    <AdminPageClient
      syncSummary={syncSummary}
      partnerReadiness={partnerReadiness}
    />
  );
}
