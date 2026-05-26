import { describe, expect, it } from "vitest";

import type {
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerExportRunApiResponse,
  PartnerReadinessApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/demo/api-types";
import {
  buildPartnerLaunchCockpitModel,
  buildPartnerReadinessModel,
  createEmptyPartnerReadiness,
  createOneTimePartnerApiKeySecret,
  filterPartnerEvidenceRows,
  getDefaultPartnerEvidenceRowId,
} from "@/lib/demo/partner-readiness";

const checkedAt = "2026-05-04T09:00:00.000Z";

function makeApiKey(
  overrides: Partial<PartnerApiKeyApiResponse> = {},
): PartnerApiKeyApiResponse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? "Demo partner",
    environment: overrides.environment ?? "demo",
    keyPrefix: overrides.keyPrefix ?? "cp_demo_abcd1234",
    scopes: overrides.scopes ?? [
      "clinics:read",
      "status:read",
      "alternatives:read",
      "exports:read",
    ],
    allowedDistricts: overrides.allowedDistricts ?? ["Tshwane North Demo District"],
    expiresAt: overrides.expiresAt,
    revokedAt: overrides.revokedAt,
    createdAt: overrides.createdAt ?? checkedAt,
    updatedAt: overrides.updatedAt ?? checkedAt,
  };
}

function makeExportRun(
  overrides: Partial<PartnerExportRunApiResponse> = {},
): PartnerExportRunApiResponse {
  return {
    id: overrides.id ?? 1,
    format: overrides.format ?? "json",
    scope: overrides.scope ?? { district: "Tshwane North Demo District" },
    recordCounts: overrides.recordCounts ?? { clinics: 12, statuses: 10 },
    checksum: overrides.checksum ?? "sha256:abcd",
    payload: overrides.payload ?? {},
    createdAt: overrides.createdAt ?? checkedAt,
  };
}

function makeWebhookEvent(
  overrides: Partial<PartnerWebhookEventApiResponse> = {},
): PartnerWebhookEventApiResponse {
  return {
    id: overrides.id ?? 1,
    subscriptionId: overrides.subscriptionId ?? 1,
    eventType: overrides.eventType ?? "clinicpulse.webhook_test",
    payload: overrides.payload ?? { previewOnly: true },
    metadata: overrides.metadata ?? { previewOnly: true },
    status: overrides.status ?? "preview_only",
    attemptCount: overrides.attemptCount ?? 0,
    createdAt: overrides.createdAt ?? checkedAt,
  };
}

function makeWebhookSubscription(
  overrides: Partial<PartnerWebhookSubscriptionApiResponse> = {},
): PartnerWebhookSubscriptionApiResponse {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? "Operations partner webhook",
    targetUrl:
      overrides.targetUrl ?? "https://partner.example.test/webhooks/clinicpulse",
    eventTypes: overrides.eventTypes ?? ["clinic.status_changed"],
    status: overrides.status ?? "active",
    lastTestedAt: overrides.lastTestedAt,
    lastTestStatus: overrides.lastTestStatus,
    lastTestMetadata: overrides.lastTestMetadata ?? {},
    lastError: overrides.lastError,
    createdAt: overrides.createdAt ?? checkedAt,
    updatedAt: overrides.updatedAt ?? checkedAt,
  };
}

function makeCheck(
  checkName: string,
  status: IntegrationStatusCheckApiResponse["status"] = "passing",
): IntegrationStatusCheckApiResponse {
  return {
    id: 1,
    checkName,
    status,
    summary: `${checkName} ${status}`,
    metadata: {},
    checkedAt,
  };
}

function makeReadyReadiness(
  overrides: Partial<PartnerReadinessApiResponse> = {},
): PartnerReadinessApiResponse {
  return {
    apiKeys: overrides.apiKeys ?? [makeApiKey()],
    webhookSubscriptions: overrides.webhookSubscriptions ?? [],
    webhookEvents: overrides.webhookEvents ?? [makeWebhookEvent()],
    exportRuns: overrides.exportRuns ?? [makeExportRun()],
    integrationChecks:
      overrides.integrationChecks ??
      [
        makeCheck("api_key_active"),
        makeCheck("export_generated"),
        makeCheck("webhook_test_recorded"),
        makeCheck("offline_sync_health_available"),
        makeCheck("stale_status_reconciliation_available"),
        makeCheck("deployment_env_configured"),
      ],
  };
}

describe("partner readiness helpers", () => {
  it("marks readiness clear when core checks pass and returns metrics including API keys", () => {
    const apiKeys = Array.from({ length: 1234 }, (_, index) =>
      makeApiKey({ id: index + 1, keyPrefix: `cp_demo_${index + 1}` }),
    );

    const model = buildPartnerReadinessModel(makeReadyReadiness({ apiKeys }));

    expect(model.severity).toBe("clear");
    expect(model.title).toBe("Partner readiness clear");
    expect(model.metrics).toContainEqual(
      expect.objectContaining({
        label: "API keys",
        value: new Intl.NumberFormat("en-ZA").format(1234),
      }),
    );
  });

  it("marks empty readiness as attention with integration review copy", () => {
    const readiness = createEmptyPartnerReadiness();
    const model = buildPartnerReadinessModel(readiness);

    expect(readiness).toEqual({
      apiKeys: [],
      webhookSubscriptions: [],
      webhookEvents: [],
      exportRuns: [],
      integrationChecks: [],
    });
    expect(model.severity).toBe("attention");
    expect(model.title).toBe("Integration checks need attention");
  });

  it("marks attention checks as watch when core assets exist", () => {
    const model = buildPartnerReadinessModel(
      makeReadyReadiness({
        integrationChecks: [
          makeCheck("api_key_active"),
          makeCheck("export_generated"),
          makeCheck("webhook_test_recorded"),
          makeCheck("deployment_env_configured", "attention"),
        ],
      }),
    );

    expect(model.severity).toBe("watch");
  });

  it("does not count revoked keys as active API keys", () => {
    const model = buildPartnerReadinessModel(
      makeReadyReadiness({
        apiKeys: [makeApiKey({ revokedAt: "2026-05-04T10:00:00.000Z" })],
      }),
    );

    expect(model.severity).toBe("attention");
    expect(model.metrics).toContainEqual(
      expect.objectContaining({
        label: "API keys",
        value: "0",
      }),
    );
  });

  it("does not count expired keys as active API keys", () => {
    const model = buildPartnerReadinessModel(
      makeReadyReadiness({
        apiKeys: [makeApiKey({ expiresAt: "2000-01-01T00:00:00.000Z" })],
      }),
    );

    expect(model.severity).toBe("attention");
    expect(model.metrics).toContainEqual(
      expect.objectContaining({
        label: "API keys",
        value: "0",
      }),
    );
  });

  it("marks active API keys without required partner scopes as attention", () => {
    const model = buildPartnerReadinessModel(
      makeReadyReadiness({
        apiKeys: [makeApiKey({ scopes: ["clinics:read"] })],
      }),
    );

    expect(model.severity).toBe("attention");
    expect(model.metrics).toContainEqual(
      expect.objectContaining({
        label: "API keys",
        value: "1",
        detail: "Missing required scopes",
        tone: "attention",
      }),
    );
  });

  it("builds one-time API key secret display state from the create response", () => {
    const secret = createOneTimePartnerApiKeySecret({
      apiKey: makeApiKey({
        id: 42,
        name: "Restricted district partner",
        keyPrefix: "cp_demo_once",
      }),
      secret: "cp_demo_raw_secret",
    });

    expect(secret).toEqual({
      id: 42,
      name: "Restricted district partner",
      keyPrefix: "cp_demo_once",
      secret: "cp_demo_raw_secret",
    });
  });

  it("builds launch cockpit gates for access, contract, delivery, and operations", () => {
    const model = buildPartnerLaunchCockpitModel(
      makeReadyReadiness({
        webhookSubscriptions: [makeWebhookSubscription()],
      }),
    );

    expect(model.gates.map((gate) => gate.id)).toEqual([
      "access",
      "contract",
      "delivery",
      "operations",
    ]);
    expect(model.gates).toContainEqual(
      expect.objectContaining({
        id: "access",
        label: "Access",
        tone: "clear",
        status: "Ready",
      }),
    );
    expect(model.handoffPacket.items.map((item) => item.label)).toEqual([
      "API credential",
      "Endpoint contract",
      "Webhook evidence",
      "Export checksum",
    ]);
  });

  it("marks the launch access gate as attention when required scopes are missing", () => {
    const model = buildPartnerLaunchCockpitModel(
      makeReadyReadiness({
        apiKeys: [makeApiKey({ scopes: ["clinics:read"] })],
      }),
    );

    expect(model.gates).toContainEqual(
      expect.objectContaining({
        id: "access",
        tone: "attention",
        status: "Scope gap",
      }),
    );
    expect(model.gates.find((gate) => gate.id === "access")?.summary).toContain(
      "Missing status:read, alternatives:read, exports:read",
    );
  });

  it("sorts event delivery rows newest-first with status, attempts, and target labels", () => {
    const model = buildPartnerLaunchCockpitModel(
      makeReadyReadiness({
        webhookSubscriptions: [
          makeWebhookSubscription({ id: 7, name: "District partner receiver" }),
        ],
        webhookEvents: [
          makeWebhookEvent({
            id: 1,
            subscriptionId: 7,
            eventType: "clinic.status_changed",
            status: "delivered",
            attemptCount: 2,
            createdAt: "2026-05-04T09:00:00.000Z",
            deliveredAt: "2026-05-04T09:01:00.000Z",
          }),
          makeWebhookEvent({
            id: 2,
            subscriptionId: 7,
            eventType: "partner.export_ready",
            status: "queued",
            attemptCount: 1,
            createdAt: "2026-05-04T10:00:00.000Z",
          }),
        ],
      }),
    );

    expect(model.deliveryRows.map((row) => row.eventType)).toEqual([
      "partner.export_ready",
      "clinic.status_changed",
    ]);
    expect(model.deliveryRows[0]).toEqual(
      expect.objectContaining({
        state: "queued",
        attempts: "1 attempt",
        target: "District partner receiver",
        tone: "watch",
      }),
    );
  });

  it("builds a partner evidence ledger from credentials, contract, delivery, export, and checks", () => {
    const model = buildPartnerLaunchCockpitModel(
      makeReadyReadiness({
        webhookSubscriptions: [
          makeWebhookSubscription({ id: 7, name: "District partner receiver" }),
        ],
      }),
    );

    expect(model.evidenceRows.map((row) => row.kind)).toEqual(
      expect.arrayContaining([
        "credential",
        "contract",
        "delivery",
        "export",
        "check",
      ]),
    );
    expect(model.evidenceRows).toContainEqual(
      expect.objectContaining({
        id: "credential-1",
        title: "Demo partner",
        laneLabel: "Credential",
        sourceLabel: "Partner API key",
        nextStep: expect.stringContaining("Rotate or revoke"),
      }),
    );
    expect(model.evidenceRows).toContainEqual(
      expect.objectContaining({
        id: "contract-required-scopes",
        title: "Endpoint contract",
        laneLabel: "Contract",
        rawFacts: expect.arrayContaining([
          { label: "Required scopes", value: "clinics:read, status:read, alternatives:read, exports:read" },
        ]),
      }),
    );
  });

  it("filters partner evidence rows by lane, state, and query", () => {
    const model = buildPartnerLaunchCockpitModel(
      makeReadyReadiness({
        apiKeys: [makeApiKey({ scopes: ["clinics:read"] })],
        webhookSubscriptions: [
          makeWebhookSubscription({ id: 7, name: "District partner receiver" }),
        ],
      }),
    );

    expect(getDefaultPartnerEvidenceRowId(model.evidenceRows)).toBe("credential-1");
    expect(
      filterPartnerEvidenceRows(model.evidenceRows, {
        activeKind: "credential",
        stateFilter: "needs-review",
        query: "scope gap",
      }).map((row) => row.id),
    ).toEqual(["credential-1"]);
  });

  it("builds an action queue for the next partner launch actions", () => {
    const model = buildPartnerLaunchCockpitModel(
      makeReadyReadiness({
        apiKeys: [],
        webhookSubscriptions: [],
        webhookEvents: [],
        exportRuns: [],
      }),
    );

    expect(model.actionQueue.map((item) => item.id)).toEqual([
      "create-key",
      "create-webhook",
      "generate-export",
      "test-webhook",
    ]);
    expect(model.actionQueue[0]).toEqual(
      expect.objectContaining({
        label: "Create scoped API key",
        tone: "attention",
        action: "create-key",
      }),
    );
  });

  it("exposes source-backed references for the partner launch cockpit", () => {
    const model = buildPartnerLaunchCockpitModel(makeReadyReadiness());

    expect(model.sourceReferences.map((reference) => reference.source)).toEqual([
      "Cal.com connector setup",
      "Trigger.dev run controls",
      "Unkey key verification logs",
      "Infisical Permission Audit",
      "Dub activity metadata",
    ]);
    expect(model.sourceReferences.map((reference) => reference.licenseUse)).toEqual([
      "adaptable",
      "adaptable",
      "reference-only",
      "adaptable",
      "reference-only",
    ]);
    expect(model).not.toHaveProperty("references");
  });
});
