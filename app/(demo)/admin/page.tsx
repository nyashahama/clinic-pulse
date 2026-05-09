import { connection } from "next/server";

import type { ClientAuthSession } from "@/lib/auth/api";
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
  const clientSession = {
    userId: session.user.id,
    name: session.user.displayName,
    displayName: session.user.displayName,
    email: session.user.email,
    role: session.role,
    ...(session.activeMembership.organisation?.name
      ? { organisationName: session.activeMembership.organisation.name }
      : {}),
    ...(session.activeMembership.district
      ? { district: session.activeMembership.district }
      : {}),
    ...(session.activeMembership.organisationId === undefined
      ? {}
      : { organisationId: session.activeMembership.organisationId }),
  } satisfies ClientAuthSession;

  return (
    <AdminPageClient
      session={clientSession}
      syncSummary={syncSummary}
      partnerReadiness={partnerReadiness}
    />
  );
}
