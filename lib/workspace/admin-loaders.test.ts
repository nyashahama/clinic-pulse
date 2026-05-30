import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => {
  class AuthenticationRequiredError extends Error {
    constructor() {
      super("Authentication required");
      this.name = "AuthenticationRequiredError";
    }
  }

  return {
    AuthenticationRequiredError,
    getCurrentSession: vi.fn(),
    getSessionCookieHeader: vi.fn(),
    requireWorkflowRole: vi.fn(),
  };
});

const apiClientMocks = vi.hoisted(() => ({
  fetchAdminAuditEvents: vi.fn(),
  fetchAdminUsers: vi.fn(),
  fetchPartnerReadiness: vi.fn(),
  fetchSyncSummary: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => authMocks);

vi.mock("@/lib/workspace/api-client", () => apiClientMocks);

import {
  getAdminLoaderOptions,
  loadAdminAuditEvents,
  loadAdminGovernanceData,
  loadAdminUsers,
} from "@/app/(workspace)/admin/admin-loaders";
import { AuthenticationRequiredError } from "@/lib/auth/session";

const cookieHeader = "clinicpulse_session=session-token";
const adminLoaderOptions = {
  init: {
    headers: {
      cookie: cookieHeader,
      "x-clinicpulse-server-mutation": "1",
    },
  },
};
const adminSession = {
  role: "system_admin",
  user: { id: 1, email: "admin@example.test", displayName: "Admin" },
};

describe("admin governance loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionCookieHeader.mockResolvedValue(cookieHeader);
    authMocks.getCurrentSession.mockResolvedValue(adminSession);
    authMocks.requireWorkflowRole.mockReturnValue(adminSession);
    apiClientMocks.fetchAdminUsers.mockResolvedValue([]);
    apiClientMocks.fetchAdminAuditEvents.mockResolvedValue([]);
    apiClientMocks.fetchPartnerReadiness.mockResolvedValue({
      apiKeys: [],
      exportRuns: [],
      integrationChecks: [],
      webhookEvents: [],
      webhookSubscriptions: [],
    });
    apiClientMocks.fetchSyncSummary.mockResolvedValue({
      conflictsNeedingAttention: 0,
      duplicateSyncsHandled: 0,
      medianCurrentStatusAgeHours: null,
      needsConfirmationClinics: 0,
      offlineReportsReceived: 0,
      pendingOfflineReports: 0,
      staleClinics: 0,
      validationFailures: 0,
      windowStartedAt: "2026-05-11T00:00:00.000Z",
    });
  });

  it("marks the module as server-only", () => {
    const source = readFileSync("app/(workspace)/admin/admin-loaders.ts", "utf8");

    expect(source.startsWith('import "server-only";')).toBe(true);
  });

  it("rejects with AuthenticationRequiredError when no cookie header exists", async () => {
    authMocks.getSessionCookieHeader.mockResolvedValue(null);

    await expect(getAdminLoaderOptions()).rejects.toBeInstanceOf(AuthenticationRequiredError);
    expect(authMocks.getCurrentSession).not.toHaveBeenCalled();
    expect(authMocks.requireWorkflowRole).not.toHaveBeenCalled();
  });

  it("loads the session, requires admin workflow access, and returns cookie headers", async () => {
    const options = await getAdminLoaderOptions();

    expect(authMocks.getCurrentSession).toHaveBeenCalledWith({ cookieHeader });
    expect(authMocks.requireWorkflowRole).toHaveBeenCalledWith(adminSession, "admin");
    expect(options).toEqual(adminLoaderOptions);
  });

  it("forwards loader options to fetchAdminUsers", async () => {
    await loadAdminUsers();

    expect(apiClientMocks.fetchAdminUsers).toHaveBeenCalledWith(adminLoaderOptions);
  });

  it("forwards loader options to fetchAdminAuditEvents", async () => {
    await loadAdminAuditEvents();

    expect(apiClientMocks.fetchAdminAuditEvents).toHaveBeenCalledWith(adminLoaderOptions);
  });

  it("loads governance data with the same options object for each fetch", async () => {
    await loadAdminGovernanceData();

    const options = apiClientMocks.fetchAdminUsers.mock.calls[0]?.[0];
    expect(apiClientMocks.fetchAdminAuditEvents).toHaveBeenCalledWith(options);
    expect(apiClientMocks.fetchPartnerReadiness).toHaveBeenCalledWith(options);
    expect(apiClientMocks.fetchSyncSummary).toHaveBeenCalledWith(options);
  });
});
