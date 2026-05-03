import type { AuthRole } from "@/lib/auth/api";
import {
  fetchClinicAuditEvents,
  fetchClinicReports,
  fetchClinics,
  fetchOperationalClinics,
  type ClinicPulseApiClientOptions,
} from "@/lib/demo/api-client";
import {
  type ApiDemoHydrationPayload,
  mapApiDemoHydrationToState,
} from "@/lib/demo/api-mappers";
import { allowsSeededDemoFallback } from "@/lib/demo/demo-hydration";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import type { DemoState } from "@/lib/demo/types";

async function withSeededFallback(load: () => Promise<DemoState>) {
  const fallbackState = createInitialDemoState();

  try {
    return await load();
  } catch (error) {
    if (!allowsSeededDemoFallback()) {
      throw error;
    }

    console.warn(
      "Using seeded demo fallback for local recovery because ClinicPulse API hydration failed.",
      error,
    );
    return fallbackState;
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
  });
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
  });
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
