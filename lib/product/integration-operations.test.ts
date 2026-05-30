import { describe, expect, it } from "vitest";

import type {
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerExportRunApiResponse,
  PartnerReadinessApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/workspace/api-types";
import {
  buildIntegrationOperationsModel,
  filterIntegrationEvidenceRows,
  getDefaultIntegrationEvidenceRowId,
  integrationEndpointRows,
} from "@/lib/product/integration-operations";

const observedAt = "2026-05-24T10:00:00.000Z";

function makeApiKey(
  overrides: Partial<PartnerApiKeyApiResponse> = {},
): PartnerApiKeyApiResponse {
  return {
    id: overrides.id ?? 11,
    name: overrides.name ?? "District partner key",
    environment: overrides.environment ?? "demo",
    keyPrefix: overrides.keyPrefix ?? "cp_demo_1234",
    scopes:
      overrides.scopes ?? [
        "clinics:read",
        "status:read",
        "alternatives:read",
        "exports:read",
      ],
    allowedDistricts: overrides.allowedDistricts ?? ["Tshwane North"],
    expiresAt: overrides.expiresAt,
    revokedAt: overrides.revokedAt,
    lastUsedAt: overrides.lastUsedAt ?? "2026-05-23T08:00:00.000Z",
    lastUsedIp: overrides.lastUsedIp ?? "10.0.0.5",
    createdByUserId: overrides.createdByUserId ?? 101,
    createdAt: overrides.createdAt ?? observedAt,
    updatedAt: overrides.updatedAt ?? observedAt,
  };
}

function makeSubscription(
  overrides: Partial<PartnerWebhookSubscriptionApiResponse> = {},
): PartnerWebhookSubscriptionApiResponse {
  return {
    id: overrides.id ?? 21,
    name: overrides.name ?? "Partner callback",
    targetUrl: overrides.targetUrl ?? "https://partner.example.test/webhook",
    eventTypes: overrides.eventTypes ?? ["clinic.status_changed"],
    status: overrides.status ?? "active",
    lastTestedAt: overrides.lastTestedAt ?? "2026-05-23T08:10:00.000Z",
    lastTestStatus: overrides.lastTestStatus ?? "failed",
    lastTestMetadata: overrides.lastTestMetadata ?? { statusCode: 500 },
    lastError: overrides.lastError ?? "500 from partner endpoint",
    createdByUserId: overrides.createdByUserId ?? 101,
    createdAt: overrides.createdAt ?? observedAt,
    updatedAt: overrides.updatedAt ?? observedAt,
  };
}

function makeWebhookEvent(
  overrides: Partial<PartnerWebhookEventApiResponse> = {},
): PartnerWebhookEventApiResponse {
  return {
    id: overrides.id ?? 22,
    subscriptionId: overrides.subscriptionId ?? 21,
    eventType: overrides.eventType ?? "clinic.status_changed",
    payload: overrides.payload ?? { clinicId: "clinic-1" },
    metadata: overrides.metadata ?? { attempt: 1 },
    status: overrides.status ?? "delivered",
    attemptCount: overrides.attemptCount ?? 1,
    lastError: overrides.lastError ?? null,
    createdAt: overrides.createdAt ?? observedAt,
    deliveredAt: overrides.deliveredAt ?? "2026-05-23T08:16:00.000Z",
  };
}

function makeExportRun(
  overrides: Partial<PartnerExportRunApiResponse> = {},
): PartnerExportRunApiResponse {
  return {
    id: overrides.id ?? 31,
    format: overrides.format ?? "json",
    scope: overrides.scope ?? { district: "Tshwane North" },
    recordCounts: overrides.recordCounts ?? { clinics: 12, statuses: 10 },
    checksum: overrides.checksum ?? "sha256:abcd",
    payload: overrides.payload ?? { generatedBy: "test" },
    createdAt: overrides.createdAt ?? "2026-05-23T09:00:00.000Z",
  };
}

function makeCheck(
  overrides: Partial<IntegrationStatusCheckApiResponse> = {},
): IntegrationStatusCheckApiResponse {
  return {
    id: overrides.id ?? 41,
    checkName: overrides.checkName ?? "api_key_active",
    status: overrides.status ?? "passing",
    summary: overrides.summary ?? "API key is active",
    metadata: overrides.metadata ?? { observed: true },
    checkedAt: overrides.checkedAt ?? "2026-05-23T09:30:00.000Z",
  };
}

function makeReadiness(
  overrides: Partial<PartnerReadinessApiResponse> = {},
): PartnerReadinessApiResponse {
  return {
    apiKeys: overrides.apiKeys ?? [makeApiKey()],
    webhookSubscriptions: overrides.webhookSubscriptions ?? [makeSubscription()],
    webhookEvents: overrides.webhookEvents ?? [makeWebhookEvent()],
    exportRuns: overrides.exportRuns ?? [makeExportRun()],
    integrationChecks: overrides.integrationChecks ?? [makeCheck()],
  };
}

describe("buildIntegrationOperationsModel", () => {
  it("summarizes connection state, endpoint coverage, delivery review, and latest export", () => {
    const model = buildIntegrationOperationsModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(model.summaryMetrics.map((metric) => metric.label)).toEqual([
      "Connection state",
      "Endpoint coverage",
      "Delivery review",
      "Latest export",
    ]);
    expect(model.summaryMetrics[0]).toMatchObject({
      value: "1 active",
      detail: "1 total credential",
      tone: "clear",
    });
    expect(model.summaryMetrics[1]).toMatchObject({
      value: `${integrationEndpointRows.length} / ${integrationEndpointRows.length}`,
      tone: "clear",
    });
    expect(model.summaryMetrics[2]).toMatchObject({
      value: "1 review",
      tone: "attention",
    });
    expect(model.summaryMetrics[3]).toMatchObject({
      value: "json",
      tone: "clear",
    });
  });

  it("orders review evidence first and preserves canonical detail routes", () => {
    const model = buildIntegrationOperationsModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(model.evidenceRows.map((row) => row.kind)).toEqual([
      "webhook",
      "credential",
      "webhook",
      "export",
      "check",
    ]);
    expect(model.evidenceRows[0]).toMatchObject({
      id: "webhook-subscription-21",
      sourceHref:
        "/admin/integrations/webhook-subscriptions/21?from=admin-integrations",
      stateLabel: "Failed",
      tone: "attention",
      sourceLabel: "Webhook subscription",
    });
    expect(model.evidenceRows.find((row) => row.id === "credential-11")).toMatchObject({
      sourceHref: "/admin/integrations/api-keys/11?from=admin-integrations",
      stateLabel: "Active",
      tone: "clear",
    });
    expect(model.evidenceRows.find((row) => row.id === "export-31")).toMatchObject({
      sourceHref: "/admin/integrations/export-runs/31?from=admin-integrations",
      sourceLabel: "Export package",
    });
    expect(model.evidenceRows.find((row) => row.id === "check-41")).toMatchObject({
      sourceHref: "/admin/integrations/checks/41?from=admin-integrations",
      sourceLabel: "Integration check",
    });
  });

  it("filters evidence rows by lane, state, and query", () => {
    const model = buildIntegrationOperationsModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(
      filterIntegrationEvidenceRows(model.evidenceRows, {
        activeKind: "webhook",
        stateFilter: "needs-review",
        query: "500",
      }).map((row) => row.id),
    ).toEqual(["webhook-subscription-21"]);

    expect(
      filterIntegrationEvidenceRows(model.evidenceRows, {
        activeKind: "all",
        stateFilter: "all",
        query: "sha256:abcd",
      }).map((row) => row.id),
    ).toEqual(["export-31"]);
  });

  it("selects the first review row by default", () => {
    const model = buildIntegrationOperationsModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(getDefaultIntegrationEvidenceRowId(model.evidenceRows)).toBe(
      "webhook-subscription-21",
    );
  });

  it("gives every command-center card a concrete operational action", () => {
    const model = buildIntegrationOperationsModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(model.actionCards.map((card) => card.actionLabel)).toEqual([
      "Manage keys",
      "Review delivery",
      "Review packet",
    ]);
    expect(model.actionCards.find((card) => card.id === "receiver-health")).toMatchObject({
      href: "#webhook-delivery-log",
      actionLabel: "Review delivery",
    });
  });

  it("exposes source-backed references for integration operations patterns", () => {
    const model = buildIntegrationOperationsModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(model.sourceReferences.map((reference) => reference.source)).toEqual([
      "Infisical admin integrations",
      "Cal.com BTCPay setup",
      "Unkey request log details",
      "Dub events metadata",
      "OpenStatus health check",
    ]);
    expect(model.sourceReferences.every((reference) => reference.repositoryUrl)).toBe(true);
    expect(model.sourceReferences.map((reference) => reference.license)).toEqual([
      "MIT",
      "MIT",
      "AGPL reference-only",
      "AGPL reference-only",
      "AGPL reference-only",
    ]);
  });
});
