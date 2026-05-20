import { existsSync, readFileSync } from "node:fs";

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
      blockers: [
        "3 pending reviews",
        "2 stale clinics",
        "1 queued offline report",
        "1 validation failure",
      ],
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

  it("treats queued offline reports as coverage blockers", () => {
    expect(
      summarizeReportingCoverage({
        clinicCount: 8,
        staleClinicCount: 0,
        pendingReviewCount: 0,
        queuedOfflineCount: 2,
        validationFailureCount: 0,
      }),
    ).toEqual({
      tone: "attention",
      readinessPercent: 75,
      blockers: ["2 queued offline reports"],
    });
  });

  it("treats needs-confirmation clinics as coverage blockers", () => {
    expect(
      summarizeReportingCoverage({
        clinicCount: 8,
        staleClinicCount: 0,
        pendingReviewCount: 0,
        queuedOfflineCount: 0,
        validationFailureCount: 0,
        needsConfirmationClinicCount: 2,
      }),
    ).toEqual({
      tone: "attention",
      readinessPercent: 75,
      blockers: ["2 needs-confirmation clinics"],
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
  expect(source).toContain("export function AdminFilterBar");
  expect(source).toContain("export function AdminEvidenceTable");
  expect(source).toContain("export function AdminEmptyState");
  expect(source).toContain("export type AdminTone");
  expect(source).toContain("export type AdminAction");
  expect(source).toContain("break-words");
});

it("links reporting coverage clinic rows to operational clinic detail", () => {
  const source = readFileSync("app/(demo)/admin/reporting-coverage/page.tsx", "utf8");

  expect(source).toContain("next/link");
  expect(source).toContain('const returnSource = "admin-reporting-coverage";');
  expect(source).toContain(
    '`/district/clinics/${encodeURIComponent(clinicId)}?from=${returnSource}`',
  );
});

it("links data-ingestion clinic and report rows to operational clinic detail", () => {
  const source = readFileSync("app/(demo)/admin/data-ingestion/page.tsx", "utf8");

  expect(source).toContain(
    "getRowAriaLabel={(row) => `Open pending report evidence for ${row.clinicId}`}",
  );
  expect(source).toContain(
    'const returnSource = "admin-data-ingestion";',
  );
  expect(source).toContain(
    '`/district/clinics/${encodeURIComponent(clinicId)}?from=${returnSource}`',
  );
  expect(source).toContain(
    "getRowAriaLabel={(row) => `Open ${row.clinic.name} clinic ingestion detail`}",
  );
});

it("uses admin clinic detail return sources for back navigation", () => {
  const source = readFileSync("app/(demo)/demo/clinics/[clinicId]/page-client.tsx", "utf8");

  expect(source).toContain("useSearchParams");
  expect(source).toContain('"admin-data-ingestion"');
  expect(source).toContain('"Back to data ingestion"');
  expect(source).toContain('"admin-reporting-coverage"');
  expect(source).toContain('"Back to reporting coverage"');
  expect(source).toContain(
    "returnTarget.href",
  );
});

it("keeps aggregate data-ingestion signal rows static", () => {
  const source = readFileSync("app/(demo)/admin/data-ingestion/page.tsx", "utf8");
  const signalTableStart = source.indexOf('label="Ingestion signal evidence"');
  const pendingTableStart = source.indexOf('label="Pending report evidence"');

  expect(signalTableStart).toBeGreaterThan(-1);
  expect(pendingTableStart).toBeGreaterThan(signalTableStart);
  expect(source.slice(signalTableStart, pendingTableStart)).not.toContain("getRowHref");
});

it("defines canonical detail routes for entity-backed admin evidence rows", () => {
  const routes = [
    "app/(demo)/admin/users-roles/[userId]/page.tsx",
    "app/(demo)/admin/audit-evidence/events/[eventId]/page.tsx",
    "app/(demo)/admin/integrations/api-keys/[apiKeyId]/page.tsx",
    "app/(demo)/admin/integrations/webhook-subscriptions/[subscriptionId]/page.tsx",
    "app/(demo)/admin/integrations/webhook-events/[eventId]/page.tsx",
    "app/(demo)/admin/integrations/export-runs/[exportRunId]/page.tsx",
    "app/(demo)/admin/integrations/checks/[checkId]/page.tsx",
  ];

  for (const route of routes) {
    expect(existsSync(route), `${route} should exist`).toBe(true);
    const source = readFileSync(route, "utf8");

    expect(source).toContain('requireDemoWorkflowAccess("admin")');
    expect(source).toContain("getAdminReturnTarget");
  }
});

it("links admin user evidence rows to user detail", () => {
  const usersPage = readFileSync("app/(demo)/admin/users-roles/page.tsx", "utf8");
  const lifecycle = readFileSync("components/product/admin-user-lifecycle.tsx", "utf8");
  const accessReview = readFileSync("app/(demo)/admin/access-review/page.tsx", "utf8");

  expect(usersPage).toContain('const returnSource = "admin-users-roles";');
  expect(usersPage).toContain("detailReturnSource={returnSource}");
  expect(lifecycle).toContain("buildAdminUserDetailHref(user.userId, detailReturnSource)");
  expect(lifecycle).toContain('import Link from "next/link";');
  expect(accessReview).toContain('const returnSource = "admin-access-review";');
  expect(accessReview).toContain("buildAdminUserDetailHref(row.userId, returnSource)");
});

it("links audit evidence rows to canonical entity details", () => {
  const auditEvidence = readFileSync("app/(demo)/admin/audit-evidence/page.tsx", "utf8");

  expect(auditEvidence).toContain('const returnSource = "admin-audit-evidence";');
  expect(auditEvidence).toContain("buildAdminAuditEventDetailHref(row.id, returnSource)");
  expect(auditEvidence).toContain("buildAdminExportRunDetailHref(row.id, returnSource)");
  expect(auditEvidence).toContain("buildAdminWebhookEventDetailHref(row.id, returnSource)");
});

it("links integration and security entity rows to canonical details", () => {
  const integrations = readFileSync("app/(demo)/admin/integrations/page.tsx", "utf8");
  const security = readFileSync("app/(demo)/admin/security/page.tsx", "utf8");

  expect(integrations).toContain('const returnSource = "admin-integrations";');
  expect(integrations).toContain("buildAdminApiKeyDetailHref(row.id, returnSource)");
  expect(integrations).toContain("buildAdminWebhookSubscriptionDetailHref");
  expect(integrations).toContain("buildAdminWebhookEventDetailHref");
  expect(integrations).toContain("buildAdminExportRunDetailHref(row.id, returnSource)");
  expect(integrations).toContain("buildAdminIntegrationCheckDetailHref(row.id, returnSource)");

  expect(security).toContain('const returnSource = "admin-security";');
  expect(security).toContain("buildAdminApiKeyDetailHref(row.id, returnSource)");
  expect(security).toContain("buildAdminUserDetailHref(row.userId, returnSource)");
  expect(security).toContain("buildAdminAuditEventDetailHref(row.id, returnSource)");
});
