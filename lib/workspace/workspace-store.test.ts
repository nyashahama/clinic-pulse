import { describe, expect, it } from "vitest";

import { allowsSeededWorkspaceFallback } from "@/lib/workspace/workspace-hydration";
import { STOCKOUT_TRIGGER_CLINIC_ID } from "@/lib/workspace/clinics";
import { applyIncidentReplayStep } from "@/lib/workspace/incident-replay";
import {
  createWorkspaceStoreInitialState,
  getWorkspaceBackendHydrationSignature,
  mergeWorkspaceBackendHydrationState,
} from "@/lib/workspace/workspace-store";
import { createInitialWorkspaceState } from "@/lib/workspace/scenarios";

describe("Workspace store hydration", () => {
  it("allows seeded fallback only outside production or with explicit opt-in", () => {
    expect(allowsSeededWorkspaceFallback({ NODE_ENV: "development" })).toBe(true);
    expect(allowsSeededWorkspaceFallback({ NODE_ENV: "test" })).toBe(true);
    expect(
      allowsSeededWorkspaceFallback({
        NODE_ENV: "production",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "true",
      }),
    ).toBe(true);
    expect(allowsSeededWorkspaceFallback({ NODE_ENV: "production" })).toBe(false);
    expect(
      allowsSeededWorkspaceFallback({
        NODE_ENV: "production",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
      }),
    ).toBe(false);
  });

  it("uses an API-backed initial state as the primary store seed", () => {
    const fallbackState = createInitialWorkspaceState();
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

    const state = createWorkspaceStoreInitialState(apiState);

    expect(state.clinics).toEqual(apiState.clinics);
    expect(state.clinicStates).toEqual(apiState.clinicStates);
    expect(state.reports).toEqual([]);
    expect(state.auditEvents).toEqual([]);
    expect(state).not.toBe(apiState);
    expect(state.clinics).not.toBe(apiState.clinics);
  });

  it("merges changed backend hydration while preserving browser-owned state", () => {
    const baseState = createInitialWorkspaceState();
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

    const state = mergeWorkspaceBackendHydrationState(currentState, nextBackendState);

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

  it("signs only backend-owned hydration data for refresh detection", () => {
    const baseState = createInitialWorkspaceState();
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

    expect(getWorkspaceBackendHydrationSignature(currentState)).toBe(
      getWorkspaceBackendHydrationSignature(baseState),
    );
    expect(getWorkspaceBackendHydrationSignature(nextBackendState)).not.toBe(
      getWorkspaceBackendHydrationSignature(baseState),
    );
  });

  it("applies the field report replay step through the store contract state shape", () => {
    const now = "2026-05-03T08:00:00.000Z";
    const state = applyIncidentReplayStep(createWorkspaceStoreInitialState(), "field_report", now);

    expect(state.reports[0]).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      reporterName: "Incident replay field worker",
      submittedAt: now,
      source: "field_worker",
      offlineCreated: false,
    });
    expect(
      state.clinicStates.find((clinicState) => clinicState.clinicId === STOCKOUT_TRIGGER_CLINIC_ID),
    ).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      status: "non_functional",
      lastReportedAt: now,
      reporterName: "Incident replay field worker",
    });
  });
});
