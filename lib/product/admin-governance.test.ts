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
  const componentSource = readFileSync("components/product/reporting-coverage-ledger.tsx", "utf8");
  const modelSource = readFileSync("lib/product/reporting-coverage.ts", "utf8");

  expect(source).toContain("ReportingCoverageLedger");
  expect(source).not.toContain("AdminEvidenceTable");
  expect(componentSource).toContain('aria-label={viewModel.ledger.title}');
  expect(componentSource).toContain("Inspect coverage receipt for");
  expect(componentSource).toContain("onSelectReceipt(row.clinicId)");
  expect(modelSource).toContain('const RETURN_SOURCE = "admin-reporting-coverage";');
  expect(modelSource).toContain(
    '`/district/clinics/${encodeURIComponent(clinicId)}?from=${RETURN_SOURCE}`',
  );
});

it("links data-ingestion clinic and report rows to operational clinic detail", () => {
  const source = readFileSync("app/(demo)/admin/data-ingestion/page.tsx", "utf8");
  const componentSource = readFileSync("components/product/data-ingestion-workspace.tsx", "utf8");

  expect(source).toContain("DataIngestionWorkspace");
  expect(source).toContain("ingestionMetrics");
  expect(source).toContain("buildClinicBacklogLedgerItem");
  expect(source).toContain("ingestionBacklogItems");
  expect(source).toContain("classifyReportIssue");
  expect(source).toContain("trustSourceForClinicStatus");
  expect(source).not.toContain("stageForReport");
  expect(componentSource).toContain('aria-label="Ingestion evidence events"');
  expect(componentSource).not.toContain('aria-label="Pending report queue"');
  expect(componentSource).toContain('aria-label="Ingestion evidence workspace"');
  expect(componentSource).toContain("Ingestion evidence ledger");
  expect(componentSource).toContain("Evidence inspector");
  expect(componentSource).toContain("Receipt and payload checks");
  expect(componentSource).toContain("Receipt trail");
  expect(componentSource).toContain("Payload checks");
  expect(componentSource).toContain(
    "aria-label={`Inspect evidence for ${item.clinicId}`}",
  );
  expect(componentSource).toContain(
    "aria-label={`Open clinic context for ${item.clinicId}`}",
  );
  expect(componentSource).toContain("href={item.clinicHref}");
  expect(componentSource).toContain("href={selectedItem.clinicHref}");
  expect(source).toContain(
    'const returnSource = "admin-data-ingestion";',
  );
  expect(source).toContain(
    '`/district/clinics/${encodeURIComponent(clinicId)}?from=${returnSource}`',
  );
  expect(componentSource).toContain(
    "aria-label={`Open ${item.clinicName} clinic ingestion detail`}",
  );
  expect(componentSource).toContain("href={item.clinicHref}");
});

it("links security evidence through an Unkey-style selected-row workspace", () => {
  const source = readFileSync("app/(demo)/admin/security/page.tsx", "utf8");
  const componentSource = readFileSync("components/product/security-evidence-workspace.tsx", "utf8");
  const modelSource = readFileSync("lib/demo/admin-security-evidence.ts", "utf8");

  expect(source).toContain("SecurityEvidenceWorkspace");
  expect(source).toContain("buildSecurityEvidenceViewModel");
  expect(source).not.toContain("SecurityPostureWorkspace");
  expect(source).not.toContain("securityFindings");
  expect(componentSource).toContain('aria-label="Security evidence workspace"');
  expect(componentSource).toContain('aria-label="Security evidence summary"');
  expect(componentSource).toContain('aria-label="Security evidence controls"');
  expect(componentSource).toContain('aria-label="Security evidence lanes"');
  expect(componentSource).toContain('aria-label="Security evidence rows"');
  expect(componentSource).toContain('aria-label="Selected security evidence"');
  expect(componentSource).toContain("Clear filters");
  expect(componentSource).toContain("Open source evidence");
  expect(componentSource).toContain("onSelectRow(row.id)");
  expect(componentSource).toContain("aria-pressed={isSelected}");
  expect(componentSource).toContain("filterSecurityEvidenceRows");
  expect(componentSource).not.toContain("Evidence map");
  expect(componentSource).not.toContain("Security evidence dossier");
  expect(componentSource).not.toContain("Security exposure map");
  expect(modelSource).toContain('const returnSource = "admin-security";');
  expect(modelSource).toContain("buildAdminApiKeyDetailHref");
  expect(modelSource).toContain("buildAdminWebhookEventDetailHref");
  expect(modelSource).toContain("buildAdminWebhookSubscriptionDetailHref");
  expect(modelSource).toContain("buildAdminUserDetailHref");
  expect(modelSource).toContain("buildAdminAuditEventDetailHref");
});

it("uses a scenario operations workspace instead of generic action cards", () => {
  const source = readFileSync("app/(demo)/admin/demo-controls/page-client.tsx", "utf8");
  const componentSource = readFileSync("components/product/scenario-controls-workspace.tsx", "utf8");
  const modelSource = readFileSync("lib/product/scenario-controls.ts", "utf8");

  expect(source).toContain("ScenarioControlsWorkspace");
  expect(source).toContain("buildScenarioControlsViewModel");
  expect(source).not.toContain("DemoControls");
  expect(source).not.toContain("AdminEvidenceTable");
  expect(componentSource).toContain('aria-label="Scenario controls workspace"');
  expect(componentSource).toContain('aria-label="Scenario runbook"');
  expect(componentSource).toContain('aria-label="Scenario command panel"');
  expect(componentSource).toContain('aria-label="Selected scenario evidence flow"');
  expect(componentSource).toContain('aria-label="Scenario evidence timeline"');
  expect(componentSource).toContain('aria-label="Scenario safety checks"');
  expect(componentSource).toContain("onSelectCommand(command.id)");
  expect(componentSource).toContain("onRunCommand(selectedCommand.id)");
  expect(componentSource).toContain("aria-pressed={isSelected}");
  expect(componentSource).not.toContain("Airflow");
  expect(componentSource).not.toContain("Temporal");
  expect(componentSource).not.toContain("Backstage");
  expect(componentSource).not.toContain("Reference map");
  expect(modelSource).toContain("scenarioControlCommandIds");
  expect(modelSource).toContain('"incident_replay"');
  expect(modelSource).toContain('"offline_sync"');
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
  const componentSource = readFileSync("components/product/data-ingestion-workspace.tsx", "utf8");
  const signalSectionStart = componentSource.indexOf('aria-label="Ingestion signal diagnostics"');
  const backlogSectionStart = componentSource.indexOf('aria-label="Clinic freshness backlog"');

  expect(signalSectionStart).toBeGreaterThan(-1);
  expect(backlogSectionStart).toBeGreaterThan(signalSectionStart);
  expect(componentSource.slice(signalSectionStart, backlogSectionStart)).not.toContain("href=");
});

it("defines canonical detail routes for entity-backed admin evidence rows", () => {
  const routes = [
    "app/(demo)/admin/users-roles/[userId]/page.tsx",
    "app/(demo)/admin/audit-evidence/events/[eventId]/page.tsx",
    "app/(demo)/admin/leads/[leadId]/page.tsx",
    "app/(demo)/admin/reports/[reportId]/page.tsx",
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

it("links stakeholder activity rows to lead detail", () => {
  const adminPage = readFileSync("app/(demo)/admin/page-client.tsx", "utf8");
  const routes = readFileSync("lib/product/admin-detail-routes.ts", "utf8");

  expect(routes).toContain("buildAdminLeadDetailHref");
  expect(adminPage).toContain("buildAdminLeadDetailHref(lead.id, returnSource)");
  expect(adminPage).toContain("Open lead detail");
  expect(existsSync("app/(demo)/admin/leads/[leadId]/page.tsx")).toBe(true);
});

it("uses operational detail layouts for report and lead details", () => {
  const adminReportDetail = readFileSync("app/(demo)/admin/reports/[reportId]/page.tsx", "utf8");
  const demoReportDetail = readFileSync("app/(demo)/demo/reports/[reportId]/page-client.tsx", "utf8");
  const leadDetail = readFileSync("app/(demo)/admin/leads/[leadId]/page-client.tsx", "utf8");

  for (const source of [adminReportDetail, demoReportDetail, leadDetail]) {
    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("EvidenceDecisionPanel");
    expect(source).toContain("EvidenceTimeline");
    expect(source).not.toContain("<EvidencePacketPanel");
    expect(source).not.toContain("AdminDetailStatStrip");
    expect(source).not.toContain("AdminDetailFieldGrid");
  }

  expect(adminReportDetail).toContain("buildReportDecisionCopy");
  expect(demoReportDetail).toContain("buildReportDecisionCopy");
  expect(leadDetail).toContain("buildLeadDecisionCopy");
  expect(adminReportDetail).toContain('contextLabel: "Backstop review"');
  expect(demoReportDetail).toContain('contextLabel: "Signal response"');
  expect(leadDetail).toContain('contextLabel: "Stakeholder handoff"');
  expect(adminReportDetail).toContain('label: "Signal summary"');
  expect(demoReportDetail).toContain('label: "Signal summary"');
  expect(leadDetail).toContain('label: "Follow-up summary"');
  expect(adminReportDetail).toContain('title: "Operational pressure"');
  expect(demoReportDetail).toContain('title: "Operational pressure"');
  expect(leadDetail).toContain('title: "Qualification"');
  expect(adminReportDetail).toContain("content-start gap-4");
  expect(demoReportDetail).toContain("content-start gap-4");
  expect(leadDetail).toContain("content-start gap-4");

  for (const source of [adminReportDetail, demoReportDetail, leadDetail]) {
    expect(source).not.toContain("Selected evidence decision");
    expect(source).not.toContain("Selected signal decision");
    expect(source).not.toContain("Selected lead decision");
  }
});

it("uses a distinct estate health board for tenant health", () => {
  const source = readFileSync("app/(demo)/admin/tenant-health/page.tsx", "utf8");

  expect(source).toContain("buildTenantHealthViewModel");
  expect(source).toContain("TenantHealthBoard");
  expect(source).not.toContain("EvidenceCommandHeader");
  expect(source).not.toContain("EvidenceCommandMetricStrip");
  expect(source).not.toContain("EvidenceCaseBriefPanel");
  expect(source).not.toContain("EvidenceDecisionPanel");
  expect(source).not.toContain("EvidenceTimeline");
  expect(source).not.toContain("<AdminEvidenceTable");
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
  const integrations = readFileSync("lib/product/integration-operations.ts", "utf8");
  const security = readFileSync("lib/demo/admin-security-evidence.ts", "utf8");

  expect(integrations).toContain('const returnSource = "admin-integrations";');
  expect(integrations).toContain("buildAdminApiKeyDetailHref(row.id, returnSource)");
  expect(integrations).toContain("buildAdminWebhookSubscriptionDetailHref");
  expect(integrations).toContain("buildAdminWebhookEventDetailHref");
  expect(integrations).toContain("buildAdminExportRunDetailHref(row.id, returnSource)");
  expect(integrations).toContain("buildAdminIntegrationCheckDetailHref(row.id, returnSource)");

  expect(security).toContain('const returnSource = "admin-security";');
  expect(security).toContain("buildAdminApiKeyDetailHref(apiKey.id, returnSource)");
  expect(security).toContain("buildAdminUserDetailHref(user.userId, returnSource)");
  expect(security).toContain("buildAdminAuditEventDetailHref(event.id, returnSource)");
  expect(security).toContain("buildAdminWebhookSubscriptionDetailHref(subscription.id, returnSource)");
  expect(security).toContain("buildAdminWebhookEventDetailHref(event.id, returnSource)");
});

it("uses an operations workspace for integration evidence", () => {
  const source = readFileSync("app/(demo)/admin/integrations/page.tsx", "utf8");
  const componentSource = readFileSync(
    "components/product/integration-operations-workspace.tsx",
    "utf8",
  );
  const modelSource = readFileSync("lib/product/integration-operations.ts", "utf8");

  expect(source).toContain("IntegrationOperationsWorkspace");
  expect(source).toContain("IntegrationOperationsSummary");
  expect(source).toContain("buildIntegrationOperationsModel");
  expect(source).toContain('aria-label="Integration command center"');
  expect(source).toContain('aria-label="Developer handoff"');
  expect(source).toContain('aria-label="Webhook delivery log"');
  expect(source).toContain('id="webhook-delivery-log"');
  expect(source).toContain("commandCardAccentClassName");
  expect(source).toContain("whitespace-pre-wrap");
  expect(source).not.toContain("overflow-x-auto rounded-md");
  expect(source).not.toContain("<AdminEvidenceTable");
  expect(source).not.toContain("<AdminMetricStrip");
  expect(source).not.toContain("getAdminToneClassName(card.tone)");

  expect(componentSource).toContain('aria-label="Integration evidence workspace"');
  expect(componentSource).toContain('aria-label="Integration evidence summary"');
  expect(componentSource).toContain('aria-label="Integration evidence controls"');
  expect(componentSource).toContain('aria-label="Integration evidence lanes"');
  expect(componentSource).toContain('aria-label="Integration evidence rows"');
  expect(componentSource).toContain('aria-label="Integration check evidence"');
  expect(componentSource).toContain('aria-label="Selected integration evidence"');
  expect(componentSource).toContain("Clear filters");
  expect(componentSource).toContain("Open source evidence");
  expect(componentSource).toContain("onSelectRow(row.id)");
  expect(componentSource).toContain("aria-selected={isSelected}");
  expect(componentSource).toContain("navigateToSource(row)");
  expect(componentSource).toContain("filterIntegrationEvidenceRows");
  expect(componentSource).toContain("hidden sm:inline");
  expect(componentSource).toContain("md:sticky md:top-3");
  expect(componentSource).not.toContain("Reference map");
  expect(componentSource).not.toContain("Hookdeck");
  expect(componentSource).not.toContain("Dub");
  expect(modelSource).toContain('const returnSource = "admin-integrations";');
  expect(modelSource).toContain("buildAdminApiKeyDetailHref(row.id, returnSource)");
  expect(modelSource).toContain("buildAdminWebhookSubscriptionDetailHref");
  expect(modelSource).toContain("buildAdminWebhookEventDetailHref");
  expect(modelSource).toContain("buildAdminExportRunDetailHref(row.id, returnSource)");
  expect(modelSource).toContain("buildAdminIntegrationCheckDetailHref(row.id, returnSource)");
});

it("links report review cards to report detail", () => {
  const adminPage = readFileSync("app/(demo)/admin/page-client.tsx", "utf8");
  const reportReviewQueue = readFileSync("components/product/report-review-queue.tsx", "utf8");
  const routes = readFileSync("lib/product/admin-detail-routes.ts", "utf8");

  expect(routes).toContain("buildAdminReportDetailHref");
  expect(adminPage).toContain("buildAdminReportDetailHref(item.reportId, returnSource)");
  expect(reportReviewQueue).toContain("getReportDetailHref");
  expect(reportReviewQueue).toContain("Open details");
});

it("routes admin overview preview controls to detail pages", () => {
  const adminPage = readFileSync("app/(demo)/admin/page-client.tsx", "utf8");
  const exportPreview = readFileSync("components/demo/export-preview.tsx", "utf8");
  const apiPreview = readFileSync("components/demo/api-preview.tsx", "utf8");

  expect(existsSync("app/(demo)/admin/export-schema/page.tsx")).toBe(true);
  expect(existsSync("app/(demo)/admin/api-contract/page.tsx")).toBe(true);
  expect(adminPage).toContain('exportSchemaHref="/admin/export-schema?from=admin"');
  expect(adminPage).toContain('apiContractHref="/admin/api-contract?from=admin"');
  expect(exportPreview).toContain("exportSchemaHref");
  expect(exportPreview).toContain("Open export schema");
  expect(apiPreview).toContain("apiContractHref");
  expect(apiPreview).toContain("Open API contract");
});
