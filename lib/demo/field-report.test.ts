import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFieldReport, syncQueuedFieldReports } from "@/app/(demo)/field/actions";
import {
  getCurrentSession,
  getSessionCookieHeader,
} from "@/lib/auth/session";
import { createReport, syncOfflineReportsApi } from "@/lib/demo/api-client";
import {
  mapOnlineFieldReportToCreateReportInput,
  submitOnlineFieldReport,
} from "@/lib/demo/field-report";
import type { AuthRole } from "@/lib/auth/api";
import type { OfflineReportQueueItem, SubmitFieldReportInput } from "@/lib/demo/types";

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();

  return {
    ...actual,
    getCurrentSession: vi.fn(),
    getSessionCookieHeader: vi.fn(),
  };
});

vi.mock("@/lib/demo/api-client", () => ({
  createReport: vi.fn().mockResolvedValue({ report: {}, currentStatus: {}, auditEvent: {} }),
  syncOfflineReportsApi: vi.fn().mockResolvedValue({
    results: [],
    summary: { created: 0, duplicate: 0, conflict: 0, failed: 0 },
  }),
}));

const createReportMock = vi.mocked(createReport);
const syncOfflineReportsApiMock = vi.mocked(syncOfflineReportsApi);
const getCurrentSessionMock = vi.mocked(getCurrentSession);
const getSessionCookieHeaderMock = vi.mocked(getSessionCookieHeader);
type CurrentSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>;

const report: SubmitFieldReportInput = {
  clinicId: "form-clinic-id",
  reporterName: "Field worker",
  source: "field_worker",
  status: "degraded",
  reason: "Mamelodi East status update from field worker report.",
  staffPressure: "strained",
  stockPressure: "low",
  queuePressure: "high",
  notes: "Pharmacy queue is backing up.",
  submittedAt: "2026-05-03T08:30:00.000Z",
  offlineCreated: true,
};

const queuedReport: OfflineReportQueueItem = {
  clientReportId: "client-report-1",
  schemaVersion: 1,
  clinicId: "clinic-mamelodi-east",
  status: "degraded",
  reason: "Mamelodi East status update from offline field capture.",
  staffPressure: "strained",
  stockPressure: "low",
  queuePressure: "high",
  notes: "Pharmacy queue is backing up.",
  submittedAt: "2026-05-03T08:30:00.000Z",
  queuedAt: "2026-05-03T08:31:00.000Z",
  updatedAt: "2026-05-03T08:32:00.000Z",
  syncStatus: "queued",
  attemptCount: 2,
  nextRetryAt: null,
  lastAttemptAt: null,
  lastError: null,
  lastServerReportId: null,
  lastServerReviewState: null,
  conflictReason: null,
};

function authSession({
  displayName = "Authenticated Reporter",
  email = "reporter@example.test",
  role = "reporter",
}: {
  displayName?: string;
  email?: string;
  role?: AuthRole;
} = {}): CurrentSession {
  return {
    user: {
      id: 77,
      email,
      displayName,
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-01T08:00:00.000Z",
    },
    session: {
      id: 99,
      userId: 77,
      createdAt: "2026-05-01T08:00:00.000Z",
      expiresAt: "2026-05-08T08:00:00.000Z",
    },
    memberships: [
      {
        id: 12,
        organisationId: 3,
        userId: 77,
        role,
        district: "Tshwane",
        createdAt: "2026-05-01T08:00:00.000Z",
      },
    ],
    activeMembership: {
      id: 12,
      organisationId: 3,
      userId: 77,
      role,
      district: "Tshwane",
      createdAt: "2026-05-01T08:00:00.000Z",
    },
    role,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  createReportMock.mockResolvedValue({ report: {} as never });
  syncOfflineReportsApiMock.mockResolvedValue({
    results: [],
    summary: { created: 0, duplicate: 0, conflict: 0, failed: 0 },
  });
  getCurrentSessionMock.mockResolvedValue(authSession());
  getSessionCookieHeaderMock.mockResolvedValue("clinicpulse_session=session-token");
});

describe("field report submission", () => {
  it("submits online field reports to the API as the current session actor", async () => {
    getCurrentSessionMock.mockResolvedValue(
      authSession({
        displayName: "Nomsa Dlamini",
        email: "nomsa@example.test",
      }),
    );

    const result = await createFieldReport({
      clinicId: "clinic-mamelodi-east",
      report: {
        ...report,
        reporterName: "Caller Controlled Name",
      },
    });

    expect(result).toEqual({ ok: true, reporterName: "Nomsa Dlamini" });
    expect(createReportMock).toHaveBeenCalledTimes(1);

    const [input, options] = createReportMock.mock.calls[0];
    expect(input).toMatchObject({
      clinicId: "clinic-mamelodi-east",
      offlineCreated: false,
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
    });
    expect(input.reporterName).not.toBe("Caller Controlled Name");
    expect(input).not.toHaveProperty("submittedAt");
    expect(new Headers(options?.init?.headers).get("cookie")).toBe(
      "clinicpulse_session=session-token",
    );
  });

  it("uses the current session email when the display name is blank", async () => {
    getCurrentSessionMock.mockResolvedValue(
      authSession({
        displayName: "",
        email: "blank-name@example.test",
      }),
    );

    await createFieldReport({
      clinicId: "clinic-mamelodi-east",
      report,
    });

    expect(createReportMock.mock.calls[0][0]).toMatchObject({
      reporterName: "blank-name@example.test",
    });
  });

  it("rejects unauthenticated field report actions before calling the API", async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    await expect(
      createFieldReport({
        clinicId: "clinic-mamelodi-east",
        report,
      }),
    ).rejects.toThrow("Authentication required");

    expect(createReportMock).not.toHaveBeenCalled();
  });

  it("forces online field reports to use the field worker source", () => {
    expect(
      mapOnlineFieldReportToCreateReportInput({
        clinicId: "clinic-mamelodi-east",
        report: {
          ...report,
          source: "seed",
        } as SubmitFieldReportInput,
      }),
    ).toMatchObject({
      source: "field_worker",
    });
  });

  it("forces online field reports to be durable backend submissions", () => {
    expect(
      mapOnlineFieldReportToCreateReportInput({
        clinicId: "clinic-mamelodi-east",
        report: {
          ...report,
          offlineCreated: true,
        } as SubmitFieldReportInput,
      }),
    ).toMatchObject({
      offlineCreated: false,
    });
  });

  it("forwards only fields owned by the field report flow", () => {
    const input = mapOnlineFieldReportToCreateReportInput({
      clinicId: "clinic-mamelodi-east",
      report: {
        ...report,
        confidence: 0.01,
        externalId: "caller-controlled-id",
      } as SubmitFieldReportInput & {
        confidence: number;
        externalId: string;
      },
    });

    expect(input).not.toHaveProperty("confidence");
    expect(input).not.toHaveProperty("externalId");
    expect(input).not.toHaveProperty("submittedAt");
  });

  it("omits optional fields when the field form did not provide them", () => {
    const input = mapOnlineFieldReportToCreateReportInput({
      clinicId: "clinic-mamelodi-east",
      report: {
        reporterName: "",
        status: "operational",
        reason: "Routine field check.",
        staffPressure: "normal",
        stockPressure: "normal",
        queuePressure: "low",
        notes: "",
      },
    });

    expect(input).not.toHaveProperty("reporterName");
    expect(input).not.toHaveProperty("submittedAt");
    expect(input).not.toHaveProperty("notes");
  });

  it("submits online field reports and refreshes without updating visible state", async () => {
    const submitReport = vi.fn().mockResolvedValue({
      ok: true,
      reporterName: "Authenticated Reporter",
    });
    const refresh = vi.fn();

    const result = await submitOnlineFieldReport({
      clinicId: "clinic-mamelodi-east",
      refresh,
      report,
      submitReport,
    });

    expect(result).toEqual({ ok: true, reporterName: "Authenticated Reporter" });
    expect(submitReport).toHaveBeenCalledWith({
      clinicId: "clinic-mamelodi-east",
      report,
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(submitReport.mock.invocationCallOrder[0]).toBeLessThan(
      refresh.mock.invocationCallOrder[0],
    );
  });

  it("does not update local visible state when the online submission rejects", async () => {
    const submitReport = vi.fn().mockRejectedValue(new Error("API unavailable"));
    const refresh = vi.fn();

    await expect(
      submitOnlineFieldReport({
        clinicId: "clinic-mamelodi-east",
        refresh,
        report,
        submitReport,
      }),
    ).rejects.toThrow("API unavailable");

    expect(refresh).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated queued field report syncs before calling the API", async () => {
    getSessionCookieHeaderMock.mockResolvedValue(null);

    await expect(syncQueuedFieldReports([queuedReport])).rejects.toThrow("Authentication required");

    expect(getCurrentSessionMock).not.toHaveBeenCalled();
    expect(syncOfflineReportsApiMock).not.toHaveBeenCalled();
  });

  it("forwards the session cookie when syncing queued field reports", async () => {
    await syncQueuedFieldReports([queuedReport]);

    expect(getCurrentSessionMock).toHaveBeenCalledWith({
      cookieHeader: "clinicpulse_session=session-token",
    });
    expect(
      new Headers(syncOfflineReportsApiMock.mock.calls[0][1]?.init?.headers).get("cookie"),
    ).toBe("clinicpulse_session=session-token");
  });

  it("maps queue items to offline sync API request items", async () => {
    await syncQueuedFieldReports([queuedReport]);

    expect(syncOfflineReportsApiMock.mock.calls[0][0]).toEqual({
      items: [
        {
          clientReportId: "client-report-1",
          clinicId: "clinic-mamelodi-east",
          status: "degraded",
          reason: "Mamelodi East status update from offline field capture.",
          staffPressure: "strained",
          stockPressure: "low",
          queuePressure: "high",
          notes: "Pharmacy queue is backing up.",
          submittedAt: "2026-05-03T08:30:00.000Z",
          queuedAt: "2026-05-03T08:31:00.000Z",
          attemptCount: 2,
        },
      ],
    });
  });

  it("returns the queued sync API response without mutating client storage", async () => {
    const response = {
      results: [
        {
          clientReportId: "client-report-1",
          result: "created" as const,
          report: { id: 42, reviewState: "pending" },
        },
      ],
      summary: { created: 1, duplicate: 0, conflict: 0, failed: 0 },
    };
    syncOfflineReportsApiMock.mockResolvedValue(response);
    const queueItems = [structuredClone(queuedReport)];
    const originalItems = structuredClone(queueItems);

    await expect(syncQueuedFieldReports(queueItems)).resolves.toBe(response);

    expect(queueItems).toEqual(originalItems);
  });
});
