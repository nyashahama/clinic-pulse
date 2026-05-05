import { describe, expect, it } from "vitest";

import { allowsSeededDemoFallback } from "@/lib/demo/demo-hydration";
import {
  createDemoStoreInitialState,
  getDemoBackendHydrationSignature,
  mergeDemoBackendHydrationState,
  mergeDemoLeadHydrationState,
  mergeStoredDemoLeadHydrationState,
} from "@/lib/demo/demo-store";
import { createInitialDemoState } from "@/lib/demo/scenarios";

describe("Demo store hydration", () => {
  it("allows seeded fallback only outside production or with explicit opt-in", () => {
    expect(allowsSeededDemoFallback({ NODE_ENV: "development" })).toBe(true);
    expect(allowsSeededDemoFallback({ NODE_ENV: "test" })).toBe(true);
    expect(
      allowsSeededDemoFallback({
        NODE_ENV: "production",
        CLINICPULSE_ALLOW_DEMO_FALLBACK: "true",
      }),
    ).toBe(true);
    expect(allowsSeededDemoFallback({ NODE_ENV: "production" })).toBe(false);
    expect(
      allowsSeededDemoFallback({
        NODE_ENV: "production",
        CLINICPULSE_ALLOW_DEMO_FALLBACK: "false",
      }),
    ).toBe(false);
  });

  it("uses an API-backed initial state as the primary store seed", () => {
    const fallbackState = createInitialDemoState();
    const apiState = {
      ...fallbackState,
      clinics: [
        {
          ...fallbackState.clinics[0],
          id: "clinic-api-primary",
          name: "API Primary Clinic",
        },
      ],
      clinicStates: [
        {
          ...fallbackState.clinicStates[0],
          clinicId: "clinic-api-primary",
          status: "degraded" as const,
        },
      ],
      reports: [],
      auditEvents: [],
    };

    const state = createDemoStoreInitialState(apiState);

    expect(state.clinics).toEqual(apiState.clinics);
    expect(state.clinicStates).toEqual(apiState.clinicStates);
    expect(state.reports).toEqual([]);
    expect(state.auditEvents).toEqual([]);
    expect(state).not.toBe(apiState);
    expect(state.clinics).not.toBe(apiState.clinics);
  });

  it("merges changed backend hydration while preserving browser-owned state", () => {
    const baseState = createInitialDemoState();
    const currentState = {
      ...baseState,
      clinics: [
        {
          ...baseState.clinics[0],
          id: "clinic-first-backend",
          name: "First backend clinic",
        },
      ],
      clinicStates: [
        {
          ...baseState.clinicStates[0],
          clinicId: "clinic-first-backend",
        },
      ],
      reports: [{ ...baseState.reports[0], clinicId: "clinic-first-backend" }],
      auditEvents: [{ ...baseState.auditEvents[0], clinicId: "clinic-first-backend" }],
      alerts: [{ ...baseState.alerts[0], clinicId: "clinic-first-backend" }],
      leads: [{ ...baseState.leads[0], id: "lead-browser-owned" }],
      offlineQueue: [
        {
          ...baseState.reports[0],
          id: "queued-browser-report",
          queuedAt: "2026-05-01T06:41:00.000Z",
          syncStatus: "queued" as const,
        },
      ],
      role: "field_worker" as const,
      lastSyncAt: "2026-05-01T06:42:00.000Z",
    };
    const nextBackendState = {
      ...baseState,
      clinics: [
        {
          ...baseState.clinics[1],
          id: "clinic-second-backend",
          name: "Second backend clinic",
        },
      ],
      clinicStates: [
        {
          ...baseState.clinicStates[1],
          clinicId: "clinic-second-backend",
          status: "degraded" as const,
        },
      ],
      reports: [{ ...baseState.reports[1], clinicId: "clinic-second-backend" }],
      auditEvents: [{ ...baseState.auditEvents[1], clinicId: "clinic-second-backend" }],
      alerts: [{ ...baseState.alerts[1], clinicId: "clinic-second-backend" }],
      leads: [{ ...baseState.leads[1], id: "lead-backend-baseline" }],
      offlineQueue: [],
      role: "founder_admin" as const,
      lastSyncAt: null,
    };

    const state = mergeDemoBackendHydrationState(currentState, nextBackendState);

    expect(state.clinics).toEqual(nextBackendState.clinics);
    expect(state.clinicStates).toEqual(nextBackendState.clinicStates);
    expect(state.reports).toEqual(nextBackendState.reports);
    expect(state.auditEvents).toEqual(nextBackendState.auditEvents);
    expect(state.alerts).toEqual(currentState.alerts);
    expect(state.leads).toEqual(currentState.leads);
    expect(state.offlineQueue).toEqual(currentState.offlineQueue);
    expect(state.role).toBe("field_worker");
    expect(state.lastSyncAt).toBe("2026-05-01T06:42:00.000Z");
  });

  it("hydrates backend leads without duplicating existing lead ids", () => {
    const state = createDemoStoreInitialState({
      ...createInitialDemoState(),
      leads: [
        {
          id: "42",
          name: "Old Lead",
          workEmail: "old@example.test",
          organization: "Old Org",
          role: "Ops",
          interest: "government",
          note: "",
          createdAt: "2026-05-05T08:00:00.000Z",
          status: "new",
        },
      ],
    });

    const next = mergeDemoLeadHydrationState(state, [
      {
        id: "42",
        name: "Updated Lead",
        workEmail: "updated@example.test",
        organization: "Updated Org",
        role: "Ops",
        interest: "government",
        note: "",
        createdAt: "2026-05-05T08:00:00.000Z",
        status: "contacted",
      },
    ]);

    expect(next.leads).toHaveLength(1);
    expect(next.leads[0]).toEqual(
      expect.objectContaining({ name: "Updated Lead", status: "contacted" }),
    );
  });

  it("hydrates backend seeded leads without duplicating local fallback seeds", () => {
    const state = createDemoStoreInitialState();
    const backendSeedLead = {
      ...state.leads[0],
      id: "101",
      status: "completed" as const,
    };

    const next = mergeDemoLeadHydrationState(state, [backendSeedLead]);

    expect(next.leads.filter((lead) => lead.workEmail === backendSeedLead.workEmail)).toHaveLength(
      1,
    );
    expect(next.leads[0]).toEqual(expect.objectContaining({ id: "101", status: "completed" }));
  });

  it("hydrates stored leads without replacing matching backend leads", () => {
    const state = createDemoStoreInitialState();
    const backendSeedLead = {
      ...state.leads[0],
      id: "101",
      status: "completed" as const,
    };
    const backendState = mergeDemoLeadHydrationState(state, [backendSeedLead]);

    const next = mergeStoredDemoLeadHydrationState(backendState, [
      {
        ...state.leads[0],
        id: "lead-001",
        status: "new",
      },
    ]);

    expect(next.leads.filter((lead) => lead.workEmail === backendSeedLead.workEmail)).toHaveLength(
      1,
    );
    expect(next.leads[0]).toEqual(expect.objectContaining({ id: "101", status: "completed" }));
  });

  it("signs only backend-owned hydration data for refresh detection", () => {
    const baseState = createInitialDemoState();
    const currentState = {
      ...baseState,
      leads: [{ ...baseState.leads[0], id: "lead-browser-owned" }],
      role: "field_worker" as const,
    };
    const nextBackendState = {
      ...currentState,
      clinicStates: [
        {
          ...currentState.clinicStates[0],
          status: "degraded" as const,
        },
        ...currentState.clinicStates.slice(1),
      ],
    };

    expect(getDemoBackendHydrationSignature(currentState)).toBe(
      getDemoBackendHydrationSignature(baseState),
    );
    expect(getDemoBackendHydrationSignature(nextBackendState)).not.toBe(
      getDemoBackendHydrationSignature(baseState),
    );
  });
});
