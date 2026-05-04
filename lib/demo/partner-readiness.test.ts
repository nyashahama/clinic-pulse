import { describe, expect, it } from "vitest";

import type {
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerExportRunApiResponse,
  PartnerReadinessApiResponse,
  PartnerWebhookEventApiResponse,
} from "@/lib/demo/api-types";
import {
  buildPartnerReadinessModel,
  createEmptyPartnerReadiness,
  createOneTimePartnerApiKeySecret,
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
    scopes: overrides.scopes ?? ["clinics:read", "status:read", "exports:read"],
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

  it("marks empty readiness as attention with setup copy", () => {
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
    expect(model.title).toBe("Partner readiness needs setup");
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
});
