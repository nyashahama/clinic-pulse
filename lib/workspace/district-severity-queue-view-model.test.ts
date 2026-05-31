import { describe, expect, it } from "vitest";

import { createInitialWorkspaceState } from "@/lib/workspace/scenarios";
import {
  buildDistrictSeverityQueueViewModel,
  type DistrictSeverityQueueFilters,
} from "@/lib/workspace/district-severity-queue-view-model";

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

const emptyFilters: DistrictSeverityQueueFilters = {
  status: "all",
  freshness: "all",
  alertState: "all",
  offlineState: "all",
  service: "all",
};

describe("buildDistrictSeverityQueueViewModel", () => {
  it("builds metrics, queue items, selected action links, and filter options", () => {
    const state = createInitialWorkspaceState();
    const viewModel = buildDistrictSeverityQueueViewModel({
      state,
      session,
      filters: emptyFilters,
      selectedClinicId: null,
    });

    expect(viewModel.metrics).toHaveLength(4);
    expect(viewModel.queue.length).toBeGreaterThan(0);
    expect(viewModel.selectedItem?.clinicId).toBe(viewModel.queue[0]?.clinicId);
    expect(viewModel.selectedAction?.clinicHref).toMatch(
      /^\/district\/clinics\/[^?]+\?from=district-severity-queue$/,
    );
    expect(viewModel.selectedAction?.reportLinks[0]?.href).toMatch(
      /^\/district\/reports\/[^?]+\?from=district-severity-queue$/,
    );
    expect(viewModel.filterOptions.services).toContain("Pharmacy");
  });

  it("filters by status, freshness, alert state, and service", () => {
    const state = createInitialWorkspaceState();
    const viewModel = buildDistrictSeverityQueueViewModel({
      state,
      session,
      filters: {
        status: "non_functional",
        freshness: "fresh",
        alertState: "active",
        offlineState: "all",
        service: "Pharmacy",
      },
      selectedClinicId: null,
    });

    expect(viewModel.queue.length).toBeGreaterThan(0);
    expect(
      viewModel.queue.every(
        (item) =>
          item.status === "non_functional" &&
          item.freshness === "fresh" &&
          item.hasActiveAlert &&
          item.services.includes("Pharmacy"),
      ),
    ).toBe(true);
  });

  it("filters clinics that have queued offline reports", () => {
    const state = createInitialWorkspaceState();
    const sourceReport = state.reports.find(
      (report) => report.clinicId === "clinic-mabopane-station",
    );

    expect(sourceReport).toBeDefined();

    const viewModel = buildDistrictSeverityQueueViewModel({
      state: {
        ...state,
        offlineQueue: [
          {
            ...sourceReport!,
            id: "queued-report-001",
            queuedAt: "2026-05-21T09:45:00.000Z",
            syncStatus: "queued",
          },
        ],
      },
      session,
      filters: {
        ...emptyFilters,
        offlineState: "queued",
      },
      selectedClinicId: null,
    });

    expect(viewModel.queue.map((item) => item.clinicId)).toEqual([
      "clinic-mabopane-station",
    ]);
    expect(viewModel.queue[0]?.isInOfflineQueue).toBe(true);
  });

  it("falls back to the top filtered item when the selected clinic is missing", () => {
    const state = createInitialWorkspaceState();
    const viewModel = buildDistrictSeverityQueueViewModel({
      state,
      session,
      filters: emptyFilters,
      selectedClinicId: "clinic-missing",
    });

    expect(viewModel.selectedItem?.clinicId).toBe(viewModel.queue[0]?.clinicId);
  });

  it("returns a clear no-results state for filters with no matches", () => {
    const state = createInitialWorkspaceState();
    const viewModel = buildDistrictSeverityQueueViewModel({
      state,
      session,
      filters: {
        status: "operational",
        freshness: "stale",
        alertState: "active",
        offlineState: "queued",
        service: "Imaginary service",
      },
      selectedClinicId: null,
    });

    expect(viewModel.queue).toEqual([]);
    expect(viewModel.selectedItem).toBeNull();
    expect(viewModel.emptyState.title).toBe("No clinics match these filters");
    expect(viewModel.emptyState.description).toContain("Clear filters");
  });
});
