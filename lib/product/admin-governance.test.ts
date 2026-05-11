import { describe, expect, it } from "vitest";

import {
  classifyAccessRisk,
  summarizeReportingCoverage,
  summarizeSecurityPosture,
} from "@/lib/product/admin-governance";

describe("classifyAccessRisk", () => {
  it("flags privileged users without recent sessions", () => {
    expect(
      classifyAccessRisk({
        role: "system_admin",
        disabled: false,
        district: null,
        lastSeenAt: null,
      }),
    ).toEqual({
      tone: "attention",
      label: "Privileged",
      reasons: ["System administrator access", "No recent session"],
    });
  });
});

describe("summarizeReportingCoverage", () => {
  it("summarizes reporting readiness from review blockers", () => {
    expect(
      summarizeReportingCoverage({
        clinicCount: 8,
        staleClinicCount: 2,
        pendingReviewCount: 3,
        queuedOfflineCount: 1,
        validationFailureCount: 1,
      }),
    ).toEqual({
      tone: "attention",
      readinessPercent: 50,
      blockers: ["3 pending reviews", "2 stale clinics", "1 validation failure"],
    });
  });
});

describe("summarizeSecurityPosture", () => {
  it("summarizes failed webhook and privileged user review needs", () => {
    expect(
      summarizeSecurityPosture({
        activeApiKeys: 2,
        revokedApiKeys: 1,
        privilegedUsers: 2,
        failedWebhookEvents: 1,
      }),
    ).toEqual({
      tone: "attention",
      summary: "1 failed webhook event and 2 privileged users need review.",
    });
  });
});
