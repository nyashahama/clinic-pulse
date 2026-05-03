import { describe, expect, it, vi } from "vitest";

import {
  buildFinderAlternativeFallback,
  loadAlternativeRecommendations,
  resolveAlternativeService,
} from "@/lib/demo/alternatives";
import type { AlternativeApiResponse } from "@/lib/demo/api-types";
import type { ClinicPulseFetch } from "@/lib/demo/api-client";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getClinicRows } from "@/lib/demo/selectors";
import type { ClinicRow } from "@/lib/demo/types";

function getRows() {
  return getClinicRows(createInitialDemoState());
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

function cloneClinic(row: ClinicRow, overrides: Partial<ClinicRow> = {}): ClinicRow {
  return {
    ...row,
    services: [...row.services],
    ...overrides,
  };
}

describe("resolveAlternativeService", () => {
  it("uses the requested service before falling back to the clinic primary service", () => {
    const [source] = getRows();

    expect(resolveAlternativeService(source, " HIV treatment ")).toBe("HIV treatment");
    expect(resolveAlternativeService(source, "")).toBe(source.services[0]);
  });
});

describe("loadAlternativeRecommendations", () => {
  it("uses backend alternatives as the primary recommendation source", async () => {
    const rows = getRows();
    const source = rows[0];
    const backendAlternative: AlternativeApiResponse = {
      clinic: {
        clinic: {
          id: rows[1].id,
          name: rows[1].name,
          facilityCode: rows[1].facilityCode,
          province: rows[1].province,
          district: rows[1].district,
          latitude: rows[1].latitude,
          longitude: rows[1].longitude,
          operatingHours: rows[1].operatingHours,
          facilityType: "clinic",
          verificationStatus: "verified",
          createdAt: rows[1].lastReportedAt,
          updatedAt: rows[1].lastReportedAt,
        },
        services: rows[1].services.map((serviceName) => ({
          clinicId: rows[1].id,
          serviceName,
          currentAvailability: "available",
        })),
        currentStatus: {
          clinicId: rows[1].id,
          status: "operational",
          freshness: "fresh",
          reason: "Backend-ranked alternative.",
          updatedAt: rows[1].lastReportedAt,
        },
      },
      distanceKm: 4.2,
      reasonCode: "operational_fresh",
      rankReason: "Operational and fresh with requested service",
      matchedService: source.services[0],
    };
    const fetchImpl = vi.fn<ClinicPulseFetch>().mockResolvedValue(
      jsonResponse([backendAlternative]),
    );

    const recommendations = await loadAlternativeRecommendations({
      sourceClinic: source,
      localClinics: rows,
      requestedService: source.services[0],
      apiOptions: {
        baseUrl: "https://api.example.test",
        fetch: fetchImpl,
      },
      allowLocalFallback: true,
      localFallback: () => [
        {
          clinic: cloneClinic(rows[2], { id: "local-fallback" }),
          compatibilityServices: [source.services[0]],
          distanceKm: 99,
          estimatedMinutes: 99,
          reason: "Local fallback should not be used on success.",
        },
      ],
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/v1/public/alternatives?clinicId=${source.id}&service=${source.services[0].replaceAll(" ", "+")}`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(recommendations).toEqual([
      expect.objectContaining({
        clinic: expect.objectContaining({
          id: rows[1].id,
          imageKey: rows[1].imageKey,
          status: "operational",
        }),
        compatibilityServices: [source.services[0]],
        distanceKm: 4.2,
        estimatedMinutes: 12,
        reason: "Operational and fresh with requested service",
      }),
    ]);
  });

  it("uses local fallback only when explicitly allowed after a backend fetch failure", async () => {
    const rows = getRows();
    const source = rows.find((clinic) => clinic.id === "clinic-mabopane-station");

    expect(source).toBeDefined();

    const fetchImpl = vi.fn<ClinicPulseFetch>().mockRejectedValue(new Error("API unavailable"));
    const recommendations = await loadAlternativeRecommendations({
      sourceClinic: source!,
      localClinics: rows,
      requestedService: source!.services[0],
      apiOptions: {
        baseUrl: "https://api.example.test",
        fetch: fetchImpl,
      },
      allowLocalFallback: true,
    });

    expect(recommendations).toEqual(buildFinderAlternativeFallback(rows, source!));
  });

  it("returns no fallback recommendations in production-style mode after a backend fetch failure", async () => {
    const rows = getRows();
    const source = rows[0];
    const fetchImpl = vi.fn<ClinicPulseFetch>().mockRejectedValue(new Error("API unavailable"));

    await expect(
      loadAlternativeRecommendations({
        sourceClinic: source,
        localClinics: rows,
        requestedService: source.services[0],
        apiOptions: {
          baseUrl: "https://api.example.test",
          fetch: fetchImpl,
        },
        allowLocalFallback: false,
      }),
    ).resolves.toEqual([]);
  });
});
