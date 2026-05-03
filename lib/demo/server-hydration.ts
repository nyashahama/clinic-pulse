import type { AuthRole } from "@/lib/auth/api";
import {
  fetchClinicAuditEvents,
  fetchClinicReports,
  fetchClinics,
  fetchOperationalClinics,
  fetchSyncSummary,
  type ClinicPulseApiClientOptions,
} from "@/lib/demo/api-client";
import {
  type ApiDemoHydrationPayload,
  mapApiDemoHydrationToState,
} from "@/lib/demo/api-mappers";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import { allowsSeededDemoFallback } from "@/lib/demo/demo-hydration";
import { createEmptySyncSummary } from "@/lib/demo/pilot-readiness";
import { createInitialDemoState } from "@/lib/demo/scenarios";

async function withSeededFallback<T>(load: () => Promise<T>, getFallback: () => T) {
  try {
    return await load();
  } catch (error) {
    if (!allowsSeededDemoFallback()) {
      throw error;
    }

    console.warn(
      "Using seeded demo fallback for local recovery because a ClinicPulse API load failed.",
      error,
    );
    return getFallback();
  }
}

export async function loadPublicDemoHydration(options?: ClinicPulseApiClientOptions) {
  return withSeededFallback(async () => {
    const fallbackState = createInitialDemoState();
    const clinics = await fetchClinics(options);
    const payload: ApiDemoHydrationPayload = {
      clinics,
      reportsByClinicId: {},
      auditEventsByClinicId: {},
    };

    return mapApiDemoHydrationToState(payload, fallbackState);
  }, createInitialDemoState);
}

export async function loadOperationalDemoHydration(options?: ClinicPulseApiClientOptions) {
  return withSeededFallback(async () => {
    const fallbackState = createInitialDemoState();
    const clinics = await fetchOperationalClinics(options);
    const reportEntries = await Promise.all(
      clinics.map(async (clinic) => [
        clinic.clinic.id,
        await fetchClinicReports(clinic.clinic.id, options),
      ] as const),
    );
    const auditEventEntries = await Promise.all(
      clinics.map(async (clinic) => [
        clinic.clinic.id,
        await fetchClinicAuditEvents(clinic.clinic.id, options),
      ] as const),
    );
    const payload: ApiDemoHydrationPayload = {
      clinics,
      reportsByClinicId: Object.fromEntries(reportEntries),
      auditEventsByClinicId: Object.fromEntries(auditEventEntries),
    };

    return mapApiDemoHydrationToState(payload, fallbackState);
  }, createInitialDemoState);
}

export function loadDemoHydrationForRole(
  role: AuthRole,
  options?: ClinicPulseApiClientOptions,
) {
  if (role === "reporter") {
    return loadPublicDemoHydration(options);
  }

  return loadOperationalDemoHydration(options);
}

export async function loadOperationalSyncSummary(
  options?: ClinicPulseApiClientOptions,
): Promise<SyncSummaryApiResponse> {
  return withSeededFallback(
    () => fetchSyncSummary(options),
    () => createEmptySyncSummary(),
  );
}

export function loadSyncSummaryForRole(
  role: AuthRole,
  options?: ClinicPulseApiClientOptions,
) {
  if (role === "reporter") {
    return Promise.resolve(null);
  }

  return loadOperationalSyncSummary(options);
}
