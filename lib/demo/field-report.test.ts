import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFieldReport } from "@/app/(demo)/field/actions";
import {
  getCurrentSession,
  getSessionCookieHeader,
} from "@/lib/auth/session";
import { createReport } from "@/lib/demo/api-client";
import {
  mapOnlineFieldReportToCreateReportInput,
  submitOnlineFieldReport,
} from "@/lib/demo/field-report";
import type { AuthRole } from "@/lib/auth/api";
import type { SubmitFieldReportInput } from "@/lib/demo/types";

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
}));

const createReportMock = vi.mocked(createReport);
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

  it("submits online field reports before updating visible state and refreshing", async () => {
    const submitReport = vi.fn().mockResolvedValue({ ok: true });
    const submitFieldReport = vi.fn();
    const refresh = vi.fn();

    await submitOnlineFieldReport({
      clinicId: "clinic-mamelodi-east",
      refresh,
      report,
      submitReport,
      submitFieldReport,
    });

    const durableReport = {
      ...report,
      clinicId: "clinic-mamelodi-east",
      offlineCreated: false,
    };
    delete durableReport.submittedAt;
    expect(submitReport).toHaveBeenCalledWith({
      clinicId: "clinic-mamelodi-east",
      report,
    });
    expect(submitFieldReport).toHaveBeenCalledWith(durableReport);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(submitReport.mock.invocationCallOrder[0]).toBeLessThan(
      submitFieldReport.mock.invocationCallOrder[0],
    );
    expect(submitFieldReport.mock.invocationCallOrder[0]).toBeLessThan(
      refresh.mock.invocationCallOrder[0],
    );
  });

  it("uses the server-confirmed reporter name for the visible online report", async () => {
    const submitReport = vi.fn().mockResolvedValue({
      ok: true,
      reporterName: "Authenticated Reporter",
    });
    const submitFieldReport = vi.fn();
    const refresh = vi.fn();

    await submitOnlineFieldReport({
      clinicId: "clinic-mamelodi-east",
      refresh,
      report: {
        ...report,
        reporterName: "Caller Controlled Name",
      },
      submitReport,
      submitFieldReport,
    });

    expect(submitFieldReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: "Authenticated Reporter",
      }),
    );
  });

  it("does not update local visible state when the online submission rejects", async () => {
    const submitReport = vi.fn().mockRejectedValue(new Error("API unavailable"));
    const submitFieldReport = vi.fn();
    const refresh = vi.fn();

    await expect(
      submitOnlineFieldReport({
        clinicId: "clinic-mamelodi-east",
        refresh,
        report,
        submitReport,
        submitFieldReport,
      }),
    ).rejects.toThrow("API unavailable");

    expect(submitFieldReport).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
