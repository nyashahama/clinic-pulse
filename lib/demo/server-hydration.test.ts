import { describe, expect, it, vi } from "vitest";

import { loadDemoHydrationForRole } from "@/lib/demo/server-hydration";
import type { ClinicPulseFetch } from "@/lib/demo/api-client";
import type {
  AuditEventApiResponse,
  ClinicDetailApiResponse,
  ReportApiResponse,
} from "@/lib/demo/api-types";

const clinic: ClinicDetailApiResponse = {
  clinic: {
    id: "clinic-mamelodi-east",
    name: "Mamelodi East Community Clinic",
    facilityCode: "GP-TND-001",
    province: "Gauteng",
    district: "Tshwane North Demo District",
    latitude: -25.7096,
    longitude: 28.3676,
    operatingHours: "Mon-Sat 07:00-19:00",
    facilityType: "clinic",
    verificationStatus: "verified",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-05-01T06:40:00.000Z",
  },
  services: [
    {
      clinicId: "clinic-mamelodi-east",
      serviceName: "Primary care",
      currentAvailability: "available",
    },
  ],
  currentStatus: {
    clinicId: "clinic-mamelodi-east",
    status: "degraded",
    reason: "Lab courier delayed and queues are stacking.",
    freshness: "needs_confirmation",
    reporterName: "Nomsa Dlamini",
    source: "clinic_coordinator",
    updatedAt: "2026-05-01T06:41:00.000Z",
  },
};

const report: ReportApiResponse = {
  id: 42,
  externalId: "mobile-report-42",
  clinicId: "clinic-mamelodi-east",
  reporterName: "Nomsa Dlamini",
  source: "field_worker",
  offlineCreated: false,
  submittedAt: "2026-05-01T06:35:00.000Z",
  receivedAt: "2026-05-01T06:40:00.000Z",
  status: "degraded",
  reason: "Lab courier delayed and queues are stacking.",
  staffPressure: "strained",
  stockPressure: "low",
  queuePressure: "high",
  notes: "Pharmacy queue moving within target.",
  reviewState: "accepted",
};

const auditEvent: AuditEventApiResponse = {
  id: 9,
  externalId: "audit-mobile-9",
  clinicId: "clinic-mamelodi-east",
  actorName: "District Ops Desk",
  eventType: "clinic.status_changed",
  summary: "Clinic status changed after the latest field report.",
  createdAt: "2026-05-01T06:42:00.000Z",
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}

describe("server demo hydration", () => {
  it("loads protected operational hydration with the caller session cookie for district roles", async () => {
    const fetchImpl = vi.fn<ClinicPulseFetch>().mockImplementation((input) => {
      const path = new URL(input).pathname;

      if (path === "/v1/clinics") {
        return Promise.resolve(jsonResponse([clinic]));
      }
      if (path === "/v1/clinics/clinic-mamelodi-east/reports") {
        return Promise.resolve(jsonResponse([report]));
      }
      if (path === "/v1/clinics/clinic-mamelodi-east/audit-events") {
        return Promise.resolve(jsonResponse([auditEvent]));
      }

      return Promise.resolve(jsonResponse({ error: { message: "unexpected route" } }));
    });

    const state = await loadDemoHydrationForRole("district_manager", {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
      init: {
        headers: {
          cookie: "clinicpulse_session=session-token",
        },
      },
    });

    expect(fetchImpl.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      "/v1/clinics",
      "/v1/clinics/clinic-mamelodi-east/reports",
      "/v1/clinics/clinic-mamelodi-east/audit-events",
    ]);
    for (const [, init] of fetchImpl.mock.calls) {
      expect(new Headers(init?.headers).get("cookie")).toBe(
        "clinicpulse_session=session-token",
      );
    }
    expect(state.clinics).toHaveLength(1);
    expect(state.reports).toEqual([expect.objectContaining({ id: "mobile-report-42" })]);
    expect(state.auditEvents).toEqual([expect.objectContaining({ id: "audit-mobile-9" })]);
  });

  it("keeps reporter hydration on public-safe clinic data without restricted streams", async () => {
    const fetchImpl = vi.fn<ClinicPulseFetch>().mockResolvedValue(jsonResponse([clinic]));

    const state = await loadDemoHydrationForRole("reporter", {
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    expect(fetchImpl.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      "/v1/public/clinics",
    ]);
    expect(state.clinics).toHaveLength(1);
    expect(state.reports).toEqual([]);
    expect(state.auditEvents).toEqual([]);
  });
});
