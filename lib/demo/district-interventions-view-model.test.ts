import { describe, expect, it } from "vitest";

import { createInitialDemoState } from "@/lib/demo/scenarios";
import {
  buildDistrictInterventionsViewModel,
  type DistrictInterventionsFilters,
} from "./district-interventions-view-model";

const emptyFilters: DistrictInterventionsFilters = {
  lens: "all",
  priority: "all",
  service: "all",
  query: "",
};

describe("buildDistrictInterventionsViewModel", () => {
  it("builds intervention metrics, active plans, selected inspector, and stage lanes", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictInterventionsViewModel({
      state,
      filters: emptyFilters,
      selectedPlanId: null,
    });

    expect(viewModel.header.title).toBe("Interventions");
    expect(viewModel.metrics.map((metric) => metric.label)).toEqual([
      "Active plans",
      "Routing moves",
      "Proof due",
      "Owner load",
    ]);
    expect(viewModel.plans.length).toBeGreaterThan(0);
    expect(viewModel.stageLanes.map((lane) => lane.label)).toEqual([
      "Routing",
      "Verification",
      "Proof due",
      "Monitoring",
    ]);
    expect(viewModel.plans[0]).toEqual(
      expect.objectContaining({
        clinicHref: expect.stringContaining("/district/clinics/"),
        evidenceHref: expect.stringContaining("/district/clinic-evidence"),
        ownerLabel: expect.any(String),
        planId: expect.stringMatching(/^intervention-/),
        priority: expect.stringMatching(/critical|watch|attention|stable/),
        proofStatus: expect.any(String),
        routePlan: expect.any(String),
        severityHref: "/district/severity-queue",
        stage: expect.stringMatching(/routing|verification|proof_due|monitoring/),
      }),
    );
    expect(viewModel.selectedPlan?.tabs.map((tab) => tab.label)).toEqual([
      "Decision",
      "Route",
      "Proof",
      "Timeline",
    ]);
    expect(viewModel.selectedPlan?.actions.map((action) => action.label)).toEqual([
      "Stage plan",
      "Assign owner",
      "Protect route",
      "Review evidence",
    ]);
  });

  it("filters plans by stage lens, priority, service, and search query", () => {
    const state = createInitialDemoState();
    const allPlans = buildDistrictInterventionsViewModel({
      state,
      filters: emptyFilters,
      selectedPlanId: null,
    });
    const routingPlans = buildDistrictInterventionsViewModel({
      state,
      filters: {
        ...emptyFilters,
        lens: "routing",
      },
      selectedPlanId: null,
    });
    const criticalPlans = buildDistrictInterventionsViewModel({
      state,
      filters: {
        ...emptyFilters,
        priority: "critical",
      },
      selectedPlanId: null,
    });
    const serviceName = allPlans.filterOptions.services[0];
    const servicePlans = buildDistrictInterventionsViewModel({
      state,
      filters: {
        ...emptyFilters,
        service: serviceName,
      },
      selectedPlanId: null,
    });
    const selectedClinicName = allPlans.plans[0]?.clinicName.split(" ")[0] ?? "";
    const searchedPlans = buildDistrictInterventionsViewModel({
      state,
      filters: {
        ...emptyFilters,
        query: selectedClinicName,
      },
      selectedPlanId: null,
    });

    expect(routingPlans.plans.length).toBeGreaterThan(0);
    expect(routingPlans.plans.every((plan) => plan.stage === "routing")).toBe(true);
    expect(criticalPlans.plans.every((plan) => plan.priority === "critical")).toBe(true);
    expect(servicePlans.plans.every((plan) => plan.services.includes(serviceName))).toBe(true);
    expect(searchedPlans.plans.length).toBeGreaterThan(0);
    expect(
      searchedPlans.plans.every((plan) =>
        [plan.clinicName, plan.facilityCode, plan.ownerLabel, plan.routePlan]
          .join(" ")
          .toLowerCase()
          .includes(selectedClinicName.toLowerCase()),
      ),
    ).toBe(true);
  });

  it("scopes stage lane counts to the other active filters", () => {
    const state = createInitialDemoState();
    const criticalPlans = buildDistrictInterventionsViewModel({
      state,
      filters: {
        ...emptyFilters,
        priority: "critical",
      },
      selectedPlanId: null,
    });

    const laneCounts = new Map(
      criticalPlans.stageLanes.map((lane) => [lane.id, lane.count]),
    );

    for (const lane of criticalPlans.stageLanes) {
      expect(lane.count).toBe(
        criticalPlans.plans.filter((plan) => plan.stage === lane.id).length,
      );
    }
    expect(Array.from(laneCounts.values()).reduce((total, count) => total + count, 0)).toBe(
      criticalPlans.plans.length,
    );
  });

  it("selects a requested plan and falls back when shared filters make it stale", () => {
    const state = createInitialDemoState();
    const allPlans = buildDistrictInterventionsViewModel({
      state,
      filters: emptyFilters,
      selectedPlanId: null,
    });
    const secondPlan = allPlans.plans[1];

    expect(secondPlan).toBeDefined();

    const selected = buildDistrictInterventionsViewModel({
      state,
      filters: emptyFilters,
      selectedPlanId: secondPlan.planId,
    });
    const staleSelection = buildDistrictInterventionsViewModel({
      state,
      filters: {
        ...emptyFilters,
        query: "does-not-exist",
      },
      selectedPlanId: secondPlan.planId,
    });

    expect(selected.selectedPlan?.planId).toBe(secondPlan.planId);
    expect(staleSelection.selectedPlan).toBeNull();
    expect(staleSelection.emptyState.title).toBe("No intervention plans match these filters");
  });

  it("exposes navigation through the filtered intervention plans", () => {
    const state = createInitialDemoState();
    const allPlans = buildDistrictInterventionsViewModel({
      state,
      filters: emptyFilters,
      selectedPlanId: null,
    });
    const secondPlan = allPlans.plans[1];

    expect(secondPlan).toBeDefined();

    const selected = buildDistrictInterventionsViewModel({
      state,
      filters: emptyFilters,
      selectedPlanId: secondPlan.planId,
    });

    expect(selected.selectedPlan?.navigation).toEqual({
      nextPlanId: allPlans.plans[2]?.planId ?? null,
      position: 2,
      previousPlanId: allPlans.plans[0]?.planId ?? null,
      total: allPlans.plans.length,
    });
  });

  it("returns a calm empty state when no clinic signal is loaded", () => {
    const state = {
      ...createInitialDemoState(),
      alerts: [],
      auditEvents: [],
      clinicStates: [],
      clinics: [],
      offlineQueue: [],
      reports: [],
    };
    const viewModel = buildDistrictInterventionsViewModel({
      state,
      filters: emptyFilters,
      selectedPlanId: null,
    });

    expect(viewModel.plans).toEqual([]);
    expect(viewModel.selectedPlan).toBeNull();
    expect(viewModel.emptyState.title).toBe("No intervention signal loaded");
  });
});
