import { describe, expect, it, vi } from "vitest";

import {
  ClinicPulseApiError,
  type ClinicPulseFetch,
  createPublicDemoLead,
  createReport,
  createPartnerApiKey,
  createPartnerExport,
  createPartnerWebhook,
  fetchAlternatives,
  fetchClinic,
  fetchClinicAuditEvents,
  fetchClinicReports,
  fetchClinicStatus,
  fetchClinics,
  fetchOperationalClinics,
  fetchPartnerReadiness,
  fetchSyncSummary,
  requestClinicPulseApi,
  reconcileStatusStaleness,
  revokePartnerApiKey,
  syncOfflineReportsApi,
  testPartnerWebhook,
  updateAdminDemoLeadStatus,
} from "@/lib/demo/api-client";
import type {
  CreatePartnerApiKeyApiInput,
  CreatePartnerExportApiInput,
  CreatePartnerWebhookApiInput,
  CreateReportApiInput,
} from "@/lib/demo/api-types";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

function mockFetch(body: unknown = {}) {
  return vi.fn<ClinicPulseFetch>().mockImplementation(() => Promise.resolve(jsonResponse(body)));
}

function mockNoContentFetch() {
  return vi.fn<ClinicPulseFetch>().mockImplementation(() =>
    Promise.resolve(new Response(null, { status: 204 })),
  );
}

describe("ClinicPulse API client", () => {
  it("builds clinic read URLs with encoded path segments", async () => {
    const fetchImpl = mockFetch([]);
    const options = {
      baseUrl: "https://api.example.test/root/",
      fetch: fetchImpl,
    };

    await fetchClinics(options);
    await fetchOperationalClinics(options);
    await fetchClinic("clinic/a b", options);
    await fetchClinicStatus("clinic/a b", options);
    await fetchClinicReports("clinic/a b", options);
    await fetchClinicAuditEvents("clinic/a b", options);

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "https://api.example.test/root/v1/public/clinics",
      "https://api.example.test/root/v1/clinics",
      "https://api.example.test/root/v1/public/clinics/clinic%2Fa%20b",
      "https://api.example.test/root/v1/clinics/clinic%2Fa%20b/status",
      "https://api.example.test/root/v1/clinics/clinic%2Fa%20b/reports",
      "https://api.example.test/root/v1/clinics/clinic%2Fa%20b/audit-events",
    ]);
  });

  it("builds alternatives query URLs with encoded query values", async () => {
    const fetchImpl = mockFetch([]);

    await fetchAlternatives("clinic/a b", "Maternal health & HIV", {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.test/v1/public/alternatives?clinicId=clinic%2Fa+b&service=Maternal+health+%26+HIV",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("posts create report JSON to the reports endpoint", async () => {
    const fetchImpl = mockFetch({ report: {}, currentStatus: {}, auditEvent: {} });
    const input: CreateReportApiInput = {
      clinicId: "clinic-1",
      status: "degraded",
      staffPressure: "strained",
      stockPressure: "low",
      queuePressure: "high",
      reason: "Short staffed and pharmacy queue is backing up.",
      source: "field_worker",
      reporterName: "Nomsa Dlamini",
      confidence: 88,
      offlineCreated: true,
      submittedAt: "2026-05-01T06:30:00.000Z",
      notes: "Sync completed from a field device.",
    };

    await createReport(input, {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/reports");
    expect(init).toMatchObject({
      body: JSON.stringify(input),
      method: "POST",
    });
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("posts offline sync batches to the reports sync endpoint", async () => {
    const fetchImpl = mockFetch({
      results: [],
      summary: { created: 0, duplicate: 0, conflict: 0, failed: 0 },
    });

    await syncOfflineReportsApi(
      { items: [] },
      {
        baseUrl: "https://api.example.test",
        fetch: fetchImpl,
      },
    );

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.example.test/v1/reports/offline-sync",
    );
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "POST" });
  });

  it("fetches the sync summary endpoint", async () => {
    const fetchImpl = mockFetch({
      windowStartedAt: "2026-05-03T00:00:00.000Z",
      offlineReportsReceived: 0,
      duplicateSyncsHandled: 0,
      conflictsNeedingAttention: 0,
      validationFailures: 0,
      pendingOfflineReports: 0,
      needsConfirmationClinics: 0,
      staleClinics: 0,
      medianCurrentStatusAgeHours: null,
    });

    await fetchSyncSummary({
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.example.test/v1/sync/summary");
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("posts status staleness reconciliation", async () => {
    const fetchImpl = mockFetch({
      checked: 4,
      markedNeedsConfirmation: 1,
      markedStale: 1,
    });

    await reconcileStatusStaleness({
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.example.test/v1/status/reconcile-staleness",
    );
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "POST" });
  });

  it("creates public demo leads through the public endpoint", async () => {
    const fetchImpl = mockFetch({
      id: 42,
      name: "Buyer",
      workEmail: "buyer@example.test",
      organization: "District",
      role: "Ops",
      interest: "government",
      note: "Requested slot",
      status: "new",
      source: "public_booking",
      createdAt: "2026-05-05T08:00:00.000Z",
      updatedAt: "2026-05-05T08:00:00.000Z",
    });

    await createPublicDemoLead(
      {
        name: "Buyer",
        workEmail: "buyer@example.test",
        organization: "District",
        role: "Ops",
        interest: "government",
        note: "Requested slot",
      },
      { baseUrl: "https://api.example.test", fetch: fetchImpl },
    );

    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.example.test/v1/public/demo-leads");
    expect(fetchImpl.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Buyer",
          workEmail: "buyer@example.test",
          organization: "District",
          role: "Ops",
          interest: "government",
          note: "Requested slot",
        }),
      }),
    );
  });

  it("updates admin demo lead status", async () => {
    const fetchImpl = mockFetch({
      id: 42,
      name: "Buyer",
      workEmail: "buyer@example.test",
      organization: "District",
      role: "Ops",
      interest: "government",
      note: "",
      status: "completed",
      source: "manual_admin",
      createdAt: "2026-05-05T08:00:00.000Z",
      updatedAt: "2026-05-05T09:00:00.000Z",
    });

    await updateAdminDemoLeadStatus(
      42,
      { status: "completed" },
      { baseUrl: "https://api.example.test", fetch: fetchImpl },
    );

    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.example.test/v1/admin/demo-leads/42");
    expect(fetchImpl.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      }),
    );
  });

  it("posts partner API key creation to the admin API keys endpoint", async () => {
    const fetchImpl = mockFetch({
      apiKey: {
        id: 1,
        name: "Demo partner",
        environment: "demo",
        keyPrefix: "cp_demo_abcd1234",
        scopes: ["clinics:read", "exports:read"],
        allowedDistricts: ["Tshwane North Demo District"],
        createdAt: "2026-05-04T09:00:00.000Z",
        updatedAt: "2026-05-04T09:00:00.000Z",
      },
      secret: "cp_demo_secret",
    });
    const input: CreatePartnerApiKeyApiInput = {
      name: "Demo partner",
      environment: "demo",
      scopes: ["clinics:read", "exports:read"],
      allowedDistricts: ["Tshwane North Demo District"],
      expiresAt: "2026-06-01T00:00:00.000Z",
    };

    await createPartnerApiKey(input, {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/admin/api-keys");
    expect(init).toMatchObject({
      body: JSON.stringify(input),
      method: "POST",
    });
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("fetches partner readiness from the admin partner readiness endpoint", async () => {
    const fetchImpl = mockFetch({
      apiKeys: [],
      webhookSubscriptions: [],
      webhookEvents: [],
      exportRuns: [],
      integrationChecks: [],
    });

    await fetchPartnerReadiness({
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.example.test/v1/admin/partner-readiness",
    );
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("posts webhook tests and partner export generation to admin endpoints", async () => {
    const fetchImpl = mockFetch({
      id: 12,
      subscriptionId: 7,
      eventType: "clinicpulse.webhook_test",
      payload: { previewOnly: true },
      metadata: { previewOnly: true },
      status: "preview_only",
      attemptCount: 0,
      createdAt: "2026-05-04T09:00:00.000Z",
    });
    const exportInput: CreatePartnerExportApiInput = {
      format: "json",
      scope: { district: "Tshwane North Demo District" },
    };

    await testPartnerWebhook(7, {
      baseUrl: "https://api.example.test/root/",
      fetch: fetchImpl,
    });
    await createPartnerExport(exportInput, {
      baseUrl: "https://api.example.test/root/",
      fetch: fetchImpl,
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.example.test/root/v1/admin/webhooks/7/test",
    );
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetchImpl.mock.calls[1][0]).toBe("https://api.example.test/root/v1/admin/exports");
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({
      body: JSON.stringify(exportInput),
      method: "POST",
    });
  });

  it("posts partner API key revocation and webhook creation to admin endpoints", async () => {
    const revokeFetchImpl = mockNoContentFetch();

    await revokePartnerApiKey(3, {
      baseUrl: "https://api.example.test",
      fetch: revokeFetchImpl,
    });

    expect(revokeFetchImpl.mock.calls[0][0]).toBe(
      "https://api.example.test/v1/admin/api-keys/3/revoke",
    );
    expect(revokeFetchImpl.mock.calls[0][1]).toMatchObject({ method: "POST" });

    const createFetchImpl = mockFetch({
      subscription: {
        id: 4,
        name: "Status webhook",
        targetUrl: "https://partner.example.test/webhooks/clinicpulse",
        eventTypes: ["clinic.status_changed"],
        status: "active",
        lastTestMetadata: {},
        createdAt: "2026-05-04T09:00:00.000Z",
        updatedAt: "2026-05-04T09:00:00.000Z",
      },
      secret: "cp_whsec_secret",
    });
    const input: CreatePartnerWebhookApiInput = {
      name: "Status webhook",
      targetUrl: "https://partner.example.test/webhooks/clinicpulse",
      eventTypes: ["clinic.status_changed"],
    };

    await createPartnerWebhook(input, {
      baseUrl: "https://api.example.test",
      fetch: createFetchImpl,
    });

    expect(createFetchImpl.mock.calls[0][0]).toBe("https://api.example.test/v1/admin/webhooks");
    expect(createFetchImpl.mock.calls[0][1]).toMatchObject({
      body: JSON.stringify(input),
      method: "POST",
    });
    expect(new Headers(createFetchImpl.mock.calls[0][1]?.headers).get("content-type")).toBe(
      "application/json",
    );
  });

  it("preserves client-level Headers instances when posting JSON", async () => {
    const fetchImpl = mockFetch({ report: {}, currentStatus: {}, auditEvent: {} });
    const input: CreateReportApiInput = {
      clinicId: "clinic-1",
      status: "operational",
      staffPressure: "normal",
      stockPressure: "normal",
      queuePressure: "low",
      reason: "Facility is open.",
      source: "field_worker",
    };

    await createReport(input, {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
      init: {
        headers: new Headers([
          ["authorization", "Bearer field-token"],
          ["x-request-source", "field-console"],
        ]),
      },
    });

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer field-token");
    expect(headers.get("x-request-source")).toBe("field-console");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("preserves plain object headers when posting JSON", async () => {
    const fetchImpl = mockFetch({ report: {}, currentStatus: {}, auditEvent: {} });
    const input: CreateReportApiInput = {
      clinicId: "clinic-1",
      status: "operational",
      staffPressure: "normal",
      stockPressure: "normal",
      queuePressure: "low",
      reason: "Facility is open.",
      source: "field_worker",
    };

    await createReport(input, {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
      init: {
        headers: {
          authorization: "Bearer object-token",
          "x-request-source": "district-console",
        },
      },
    });

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer object-token");
    expect(headers.get("x-request-source")).toBe("district-console");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("preserves tuple array headers and caller content type overrides", async () => {
    const fetchImpl = mockFetch({ report: {}, currentStatus: {}, auditEvent: {} });
    const input: CreateReportApiInput = {
      clinicId: "clinic-1",
      status: "operational",
      staffPressure: "normal",
      stockPressure: "normal",
      queuePressure: "low",
      reason: "Facility is open.",
      source: "field_worker",
    };

    await createReport(input, {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
      init: {
        headers: [
          ["authorization", "Bearer tuple-token"],
          ["content-type", "application/vnd.clinicpulse.report+json"],
        ],
      },
    });

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer tuple-token");
    expect(headers.get("content-type")).toBe("application/vnd.clinicpulse.report+json");
  });

  it("uses the public API base URL environment variable by default", async () => {
    const previousBaseUrl = process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
    process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = "https://env-api.example.test/base";
    const fetchImpl = mockFetch([]);

    try {
      await fetchClinics({ fetch: fetchImpl });
    } finally {
      if (previousBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = previousBaseUrl;
      }
    }

    expect(fetchImpl.mock.calls[0][0]).toBe("https://env-api.example.test/base/v1/public/clinics");
  });

  it("uses the private API base URL for server-side calls", async () => {
    const previousPrivateBaseUrl = process.env.CLINICPULSE_API_BASE_URL;
    const previousPublicBaseUrl = process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
    process.env.CLINICPULSE_API_BASE_URL = "https://server-api.example.test/root";
    process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = "/api/clinicpulse";
    const fetchImpl = mockFetch([]);

    try {
      await fetchClinics({ fetch: fetchImpl });
    } finally {
      if (previousPrivateBaseUrl === undefined) {
        delete process.env.CLINICPULSE_API_BASE_URL;
      } else {
        process.env.CLINICPULSE_API_BASE_URL = previousPrivateBaseUrl;
      }
      if (previousPublicBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = previousPublicBaseUrl;
      }
    }

    expect(fetchImpl.mock.calls[0][0]).toBe("https://server-api.example.test/root/v1/public/clinics");
  });

  it("supports relative public API base URLs for browser calls", async () => {
    const previousBaseUrl = process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
    process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = "/api/clinicpulse";
    vi.stubGlobal("window", {});
    const fetchImpl = mockFetch([]);

    try {
      await fetchAlternatives("clinic-1", "Primary care", { fetch: fetchImpl });
    } finally {
      vi.unstubAllGlobals();
      if (previousBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = previousBaseUrl;
      }
    }

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "/api/clinicpulse/v1/public/alternatives?clinicId=clinic-1&service=Primary+care",
    );
  });

  it("does not add JSON content type for URLSearchParams bodies", async () => {
    const fetchImpl = mockFetch({});

    await requestClinicPulseApi(["v1", "reports"], {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
      init: {
        body: new URLSearchParams({ clinicId: "clinic-1" }),
        method: "POST",
      },
    });

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.has("content-type")).toBe(false);
  });

  it("throws API errors with response status, code, and message", async () => {
    const fetchImpl = vi.fn<ClinicPulseFetch>().mockResolvedValue(
      jsonResponse(
        { error: { code: "not_found", message: "clinic not found" } },
        { status: 404 },
      ),
    );

    await expect(
      fetchClinic("missing-clinic", {
        baseUrl: "https://api.example.test",
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({
      code: "not_found",
      message: "clinic not found",
      status: 404,
    } satisfies Partial<ClinicPulseApiError>);
  });
});
