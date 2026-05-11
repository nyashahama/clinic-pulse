import { readFileSync } from "node:fs";

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

  it("flags district managers without district scope for review", () => {
    expect(
      classifyAccessRisk({
        role: "district_manager",
        disabled: false,
        district: null,
        lastSeenAt: "2026-05-11T08:00:00.000Z",
      }),
    ).toEqual({
      tone: "attention",
      label: "Review",
      reasons: ["Missing district scope"],
    });
  });

  it("includes disabled account risk reasons", () => {
    expect(
      classifyAccessRisk({
        role: "reporter",
        disabled: true,
        district: "Tshwane North",
        lastSeenAt: "2026-05-11T08:00:00.000Z",
      }),
    ).toEqual({
      tone: "attention",
      label: "Review",
      reasons: ["Disabled account"],
    });
  });

  it("returns clear access status for non-risk access", () => {
    expect(
      classifyAccessRisk({
        role: "reporter",
        disabled: false,
        district: null,
        lastSeenAt: "2026-05-11T08:00:00.000Z",
      }),
    ).toEqual({
      tone: "clear",
      label: "Clear",
      reasons: [],
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
      readinessPercent: 13,
      blockers: ["3 pending reviews", "2 stale clinics", "1 validation failure"],
    });
  });

  it("returns zero readiness when there are no clinics", () => {
    expect(
      summarizeReportingCoverage({
        clinicCount: 0,
        staleClinicCount: 1,
        pendingReviewCount: 1,
        queuedOfflineCount: 1,
        validationFailureCount: 1,
      }).readinessPercent,
    ).toBe(0);
  });

  it("returns clear coverage when there are no blockers", () => {
    expect(
      summarizeReportingCoverage({
        clinicCount: 8,
        staleClinicCount: 0,
        pendingReviewCount: 0,
        queuedOfflineCount: 0,
        validationFailureCount: 0,
      }),
    ).toEqual({
      tone: "clear",
      readinessPercent: 100,
      blockers: [],
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

  it("summarizes clear API key posture", () => {
    expect(
      summarizeSecurityPosture({
        activeApiKeys: 2,
        revokedApiKeys: 1,
        privilegedUsers: 0,
        failedWebhookEvents: 0,
      }),
    ).toEqual({
      tone: "clear",
      summary: "2 active API keys and 1 revoked keys are recorded.",
    });
  });
});

it("exports the shared admin module primitives", () => {
  const source = readFileSync("components/product/admin-module.tsx", "utf8");
  expect(source).toContain("export function AdminModuleHeader");
  expect(source).toContain("export function AdminMetricStrip");
  expect(source).toContain("export function AdminEvidenceTable");
});
