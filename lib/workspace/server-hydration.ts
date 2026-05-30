import type { AuthRole } from "@/lib/auth/api";
import {
  fetchClinicAuditEvents,
  fetchClinicReports,
  fetchClinics,
  fetchOperationalClinics,
  fetchPartnerReadiness,
  fetchPendingReports,
  fetchSyncSummary,
  type ClinicPulseApiClientOptions,
} from "@/lib/workspace/api-client";
import {
  type ApiWorkspaceHydrationPayload,
  mapApiWorkspaceHydrationToState,
} from "@/lib/workspace/api-mappers";
import type {
  PartnerReadinessApiResponse,
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/workspace/api-types";
import { allowsSeededWorkspaceFallback } from "@/lib/workspace/workspace-hydration";
import { createEmptySyncSummary } from "@/lib/workspace/pilot-readiness";
import { createInitialWorkspaceState } from "@/lib/workspace/scenarios";

async function withSeededFallback<T>(load: () => Promise<T>, getFallback: () => T) {
  try {
    return await load();
  } catch (error) {
    if (!allowsSeededWorkspaceFallback()) {
      throw error;
    }

    console.warn(
      "Using seeded workspace fallback for local recovery because a ClinicPulse API load failed.",
      error,
    );
    return getFallback();
  }
}

export async function loadPublicWorkspaceHydration(options?: ClinicPulseApiClientOptions) {
  return withSeededFallback(async () => {
    const fallbackState = createInitialWorkspaceState();
    const clinics = await fetchClinics(options);
    const payload: ApiWorkspaceHydrationPayload = {
      clinics,
      reportsByClinicId: {},
      auditEventsByClinicId: {},
    };

    return mapApiWorkspaceHydrationToState(payload, fallbackState);
  }, createInitialWorkspaceState);
}

export async function loadOperationalWorkspaceHydration(options?: ClinicPulseApiClientOptions) {
  return withSeededFallback(async () => {
    const fallbackState = createInitialWorkspaceState();
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
    const payload: ApiWorkspaceHydrationPayload = {
      clinics,
      reportsByClinicId: Object.fromEntries(reportEntries),
      auditEventsByClinicId: Object.fromEntries(auditEventEntries),
    };

    return mapApiWorkspaceHydrationToState(payload, fallbackState);
  }, createInitialWorkspaceState);
}

export function loadWorkspaceHydrationForRole(
  role: AuthRole,
  options?: ClinicPulseApiClientOptions,
) {
  if (role === "reporter") {
    return loadPublicWorkspaceHydration(options);
  }

  return loadOperationalWorkspaceHydration(options);
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

export async function loadPendingReportsForRole(
  role: AuthRole,
  options?: ClinicPulseApiClientOptions,
): Promise<ReportApiResponse[]> {
  if (role === "reporter") {
    return [];
  }

  return withSeededFallback(
    () => fetchPendingReports(options),
    () => [],
  );
}

export async function loadPartnerReadiness(
  options?: ClinicPulseApiClientOptions,
): Promise<PartnerReadinessApiResponse> {
  return withSeededFallback(
    () => fetchPartnerReadiness(options),
    () => ({
      apiKeys: [],
      webhookSubscriptions: [],
      webhookEvents: [],
      exportRuns: [],
      integrationChecks: [],
    }),
  );
}
