import {
  AuthenticationRequiredError,
  getCurrentSession,
  getSessionCookieHeader,
  requireWorkflowRole,
} from "@/lib/auth/session";
import {
  fetchAdminAuditEvents,
  fetchAdminUsers,
  fetchPartnerReadiness,
  fetchSyncSummary,
  type ClinicPulseApiClientOptions,
} from "@/lib/demo/api-client";

export async function getAdminLoaderOptions(): Promise<ClinicPulseApiClientOptions> {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    throw new AuthenticationRequiredError();
  }

  const session = await getCurrentSession({ cookieHeader });
  requireWorkflowRole(session, "admin");

  return {
    init: {
      headers: {
        cookie: cookieHeader,
      },
    },
  };
}

export async function loadAdminUsers() {
  return fetchAdminUsers(await getAdminLoaderOptions());
}

export async function loadAdminAuditEvents() {
  return fetchAdminAuditEvents(await getAdminLoaderOptions());
}

export async function loadAdminGovernanceData() {
  const options = await getAdminLoaderOptions();
  const [users, auditEvents, partnerReadiness, syncSummary] = await Promise.all([
    fetchAdminUsers(options),
    fetchAdminAuditEvents(options),
    fetchPartnerReadiness(options),
    fetchSyncSummary(options),
  ]);

  return {
    users,
    auditEvents,
    partnerReadiness,
    syncSummary,
  };
}
