import { describe, expect, it, vi } from "vitest";

import {
  ClinicPulseApiError,
  type ClinicPulseFetch,
  createReport,
  fetchAlternatives,
  fetchClinic,
  fetchClinicAuditEvents,
  fetchClinicReports,
  fetchClinicStatus,
  fetchClinics,
  fetchOperationalClinics,
  fetchSyncSummary,
  requestClinicPulseApi,
  reconcileStatusStaleness,
  syncOfflineReportsApi,
} from "@/lib/demo/api-client";
import type { CreateReportApiInput } from "@/lib/demo/api-types";

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
