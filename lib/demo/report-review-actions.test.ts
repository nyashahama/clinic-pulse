import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getSessionCookieHeader: vi.fn(),
  requireRole: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  reviewReport: vi.fn(),
}));

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();

  return {
    ...actual,
    ...authMocks,
  };
});
vi.mock("@/lib/demo/api-client", () => apiMocks);

import { reviewPendingReportAction } from "@/app/(demo)/report-review-actions";

describe("reviewPendingReportAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionCookieHeader.mockResolvedValue("clinicpulse_session=session-token");
    authMocks.getCurrentSession.mockResolvedValue({
      role: "district_manager",
      user: {
        displayName: "District Manager",
        email: "district-manager@clinicpulse.local",
        id: 1,
      },
    });
    authMocks.requireRole.mockImplementation((session) => session);
    apiMocks.reviewReport.mockResolvedValue({
      report: {
        clinicId: "clinic-akasia-hills",
      },
    });
  });

  it("forwards the session cookie with the server mutation header", async () => {
    await reviewPendingReportAction({
      decision: "accepted",
      notes: "Reviewed.",
      reportId: 42,
    });

    expect(apiMocks.reviewReport).toHaveBeenCalledWith(
      42,
      {
        decision: "accepted",
        notes: "Reviewed.",
      },
      {
        init: {
          headers: {
            cookie: "clinicpulse_session=session-token",
            "x-clinicpulse-server-mutation": "1",
          },
        },
      },
    );
  });
});
