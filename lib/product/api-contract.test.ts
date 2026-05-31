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
  buildApiContractModel,
  filterApiContractEndpoints,
  getDefaultApiContractEndpointId,
} from "@/lib/product/api-contract";

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
        "alternatives:read",
        "exports:read",
        "status:read",
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
    lastTestStatus: overrides.lastTestStatus ?? "passed",
    lastTestMetadata: overrides.lastTestMetadata ?? { statusCode: 202 },
    lastError: overrides.lastError,
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
    checkName: overrides.checkName ?? "partner_api_smoke",
    status: overrides.status ?? "passing",
    summary: overrides.summary ?? "Partner API smoke checks are passing",
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

describe("buildApiContractModel", () => {
  it("builds an inspectable endpoint contract with parameters, responses, samples, and evidence", () => {
    const model = buildApiContractModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });
    const exportEndpoint = model.endpoints.find(
      (endpoint) => endpoint.id === "export-latest",
    );

    expect(model.summaryMetrics.map((metric) => metric.label)).toEqual([
      "Endpoints",
      "Partner scope coverage",
      "Checks needing review",
      "Evidence handoffs",
    ]);
    expect(exportEndpoint).toMatchObject({
      method: "GET",
      path: "/v1/partner/export/latest",
      sourceHref: "/admin/integrations/export-runs/31?from=admin-api-contract",
      readinessTone: "clear",
    });
    expect(exportEndpoint?.parameters.map((parameter) => parameter.name)).toEqual([
      "Authorization",
      "format",
    ]);
    expect(exportEndpoint?.responses.map((response) => response.status)).toEqual([
      "200",
      "401",
      "404",
    ]);
    expect(exportEndpoint?.samplePayload).toContain("sha256:abcd");
    expect(exportEndpoint?.readinessChecks.map((check) => check.label)).toContain(
      "Export package",
    );
  });

  it("promotes missing partner scopes and failing checks into the default selected endpoint", () => {
    const model = buildApiContractModel(
      makeReadiness({
        apiKeys: [makeApiKey({ scopes: ["alternatives:read"] })],
        integrationChecks: [
          makeCheck({
            status: "failing",
            summary: "Partner API smoke check failed with 502",
          }),
        ],
      }),
      {
        now: new Date("2026-05-24T10:00:00.000Z"),
      },
    );

    expect(model.summaryMetrics[1]).toMatchObject({
      value: "1 / 3",
      tone: "attention",
    });
    expect(getDefaultApiContractEndpointId(model.endpoints)).toBe("export-latest");
    expect(model.endpoints.find((endpoint) => endpoint.id === "export-latest")).toMatchObject({
      readinessTone: "attention",
      sourceHref: "/admin/integrations/export-runs/31?from=admin-api-contract",
    });
    expect(
      model.endpoints
        .find((endpoint) => endpoint.id === "export-latest")
        ?.readinessChecks.find((check) => check.id === "export-latest-scope"),
    ).toMatchObject({
      tone: "attention",
      sourceHref: "/admin/partner-readiness",
    });
    expect(model.endpoints.find((endpoint) => endpoint.id === "integration-status")).toMatchObject({
      readinessTone: "attention",
    });
  });

  it("filters endpoint contracts without changing the selected endpoint by implication", () => {
    const model = buildApiContractModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(
      filterApiContractEndpoints(model.endpoints, {
        method: "GET",
        readiness: "all",
        query: "integration-status",
      }).map((endpoint) => endpoint.id),
    ).toEqual(["integration-status"]);
    expect(getDefaultApiContractEndpointId(model.endpoints)).toBe("clinics");
  });

  it("records the permissive source references used for the contract workspace", () => {
    const model = buildApiContractModel(makeReadiness(), {
      now: new Date("2026-05-24T10:00:00.000Z"),
    });

    expect(model.sourceReferences.map((reference) => reference.source)).toEqual([
      "Swagger UI operation components",
      "OpenMetadata data contract schema table",
    ]);
    expect(model.sourceReferences.map((reference) => reference.license)).toEqual([
      "Apache-2.0",
      "Apache-2.0",
    ]);
    expect(model.sourceReferences.every((reference) => reference.sourcePath)).toBe(true);
  });
});
