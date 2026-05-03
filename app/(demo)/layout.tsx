import type { ReactNode } from "react";
import { connection } from "next/server";

import { DemoShell } from "@/components/demo/demo-shell";
import { fetchClinicAuditEvents, fetchClinicReports, fetchClinics } from "@/lib/demo/api-client";
import {
  type ApiDemoHydrationPayload,
  mapApiDemoHydrationToState,
} from "@/lib/demo/api-mappers";
import { allowsSeededDemoFallback } from "@/lib/demo/demo-hydration";
import { DemoStoreProvider } from "@/lib/demo/demo-store";
import { createInitialDemoState } from "@/lib/demo/scenarios";

async function loadDemoHydration() {
  const fallbackState = createInitialDemoState();

  try {
    const clinics = await fetchClinics();
    const clinicPayloads = await Promise.all(
      clinics.map(async (clinic) => {
        const [reports, auditEvents] = await Promise.all([
          fetchClinicReports(clinic.clinic.id),
          fetchClinicAuditEvents(clinic.clinic.id),
        ]);

        return [clinic.clinic.id, reports, auditEvents] as const;
      }),
    );
    const payload: ApiDemoHydrationPayload = {
      clinics,
      reportsByClinicId: Object.fromEntries(
        clinicPayloads.map(([clinicId, reports]) => [clinicId, reports]),
      ),
      auditEventsByClinicId: Object.fromEntries(
        clinicPayloads.map(([clinicId, , auditEvents]) => [clinicId, auditEvents]),
      ),
    };

    return mapApiDemoHydrationToState(payload, fallbackState);
  } catch (error) {
    // Demo routes call connection(), so builds do not need mock recovery.
    // Production runtime failures should surface unless operators opt in explicitly.
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

export default async function DemoLayout({ children }: { children: ReactNode }) {
  await connection();
  const initialState = await loadDemoHydration();

  return (
    <DemoStoreProvider initialState={initialState}>
      <DemoShell>{children}</DemoShell>
    </DemoStoreProvider>
  );
}
