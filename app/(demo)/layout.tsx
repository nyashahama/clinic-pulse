import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { DemoShell } from "@/components/demo/demo-shell";
import { AUTH_ROLES, logout } from "@/lib/auth/api";
import {
  applySessionCookieFromHeader,
  clearSessionCookie,
  getCurrentSession,
  getSessionCookieHeader,
  requireRole,
  toClientAuthSession,
} from "@/lib/auth/session";
import { fetchClinics } from "@/lib/demo/api-client";
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
    const payload: ApiDemoHydrationPayload = {
      clinics,
      reportsByClinicId: {},
      auditEventsByClinicId: {},
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

async function logoutAction() {
  "use server";

  const cookieHeader = await getSessionCookieHeader();
  const result = await logout({
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  });

  if (result.setCookie) {
    await applySessionCookieFromHeader(result.setCookie);
  } else {
    await clearSessionCookie();
  }

  redirect("/login");
}

export default async function DemoLayout({ children }: { children: ReactNode }) {
  await connection();
  const currentSession = await getCurrentSession();
  if (!currentSession) {
    redirect("/login");
  }

  const session = requireRole(currentSession, AUTH_ROLES);
  const initialState = await loadDemoHydration();

  return (
    <DemoStoreProvider initialState={initialState}>
      <DemoShell session={toClientAuthSession(session)} logoutAction={logoutAction}>
        {children}
      </DemoShell>
    </DemoStoreProvider>
  );
}
