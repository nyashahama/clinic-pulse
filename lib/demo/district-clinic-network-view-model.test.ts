import { describe, expect, it } from "vitest";

import { createInitialDemoState } from "@/lib/demo/scenarios";
import {
  buildDistrictClinicNetworkViewModel,
  type DistrictClinicNetworkFilters,
} from "@/lib/demo/district-clinic-network-view-model";

const session = {
  userId: 2,
  email: "district-manager@clinicpulse.local",
  name: "District Manager",
  displayName: "District Manager",
  role: "district_manager",
  organisationName: "ClinicPulse Pilot",
  district: "Tshwane North",
  organisationId: 1,
} as const;

const emptyFilters: DistrictClinicNetworkFilters = {
  status: "all",
  freshness: "all",
  source: "all",
  service: "all",
  query: "",
};

describe("buildDistrictClinicNetworkViewModel", () => {
  it("builds metrics, clinic rows, selected profile, and detail links", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicNetworkViewModel({
      state,
      session,
      filters: emptyFilters,
      selectedClinicId: null,
    });

    expect(viewModel.metrics).toHaveLength(4);
    expect(viewModel.clinics).toHaveLength(state.clinics.length);
    expect(viewModel.selectedClinic?.clinicId).toBe(viewModel.clinics[0]?.clinicId);
    expect(viewModel.selectedClinic?.clinicHref).toMatch(
      /^\/district\/clinics\/[^?]+\?from=district-clinic-network$/,
    );
    expect(viewModel.selectedClinic?.routingAlternatives.length).toBeGreaterThan(0);
    expect(viewModel.selectedClinic?.routingAlternatives[0]).toEqual(
      expect.objectContaining({
        clinicHref: expect.stringMatching(
          /^\/district\/clinics\/[^?]+\?from=district-clinic-network$/,
        ),
        clinicName: expect.any(String),
        coverageLabel: expect.any(String),
        facilityCode: expect.any(String),
        matchedService: expect.any(String),
      }),
    );
    expect(viewModel.filterOptions.services).toContain("Pharmacy");
    expect(viewModel.coverage.totalClinics).toBe(state.clinics.length);
  });

  it("filters by status, freshness, source, service, and search query", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicNetworkViewModel({
      state,
      session,
      filters: {
        status: "non_functional",
        freshness: "fresh",
        source: "field_worker",
        service: "Pharmacy",
        query: "Mabopane",
      },
      selectedClinicId: null,
    });

    expect(viewModel.clinics.map((clinic) => clinic.clinicId)).toEqual([
      "clinic-mabopane-station",
    ]);
    expect(viewModel.clinics[0]).toMatchObject({
      status: "non_functional",
      freshness: "fresh",
      source: "field_worker",
    });
    expect(viewModel.clinics[0]?.services).toContain("Pharmacy");
  });

  it("falls back to the first filtered clinic when the selected clinic is missing", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicNetworkViewModel({
      state,
      session,
      filters: {
        ...emptyFilters,
        status: "operational",
      },
      selectedClinicId: "clinic-missing",
    });

    expect(viewModel.selectedClinic?.clinicId).toBe(viewModel.clinics[0]?.clinicId);
    expect(viewModel.emptyState).toBeNull();
  });

  it("returns a clear empty state when no clinics match filters", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicNetworkViewModel({
      state,
      session,
      filters: {
        status: "operational",
        freshness: "stale",
        source: "field_worker",
        service: "Imaginary service",
        query: "missing clinic",
      },
      selectedClinicId: null,
    });

    expect(viewModel.clinics).toEqual([]);
    expect(viewModel.selectedClinic).toBeNull();
    expect(viewModel.emptyState?.title).toBe("No clinics match these filters");
    expect(viewModel.emptyState?.description).toContain("Clear filters");
  });
});
