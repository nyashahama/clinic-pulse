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
import { DemoStoreProvider } from "@/lib/demo/demo-store";
import { loadDemoHydrationForRole } from "@/lib/demo/server-hydration";

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
  const cookieHeader = await getSessionCookieHeader();
  const currentSession = await getCurrentSession({ cookieHeader });
  if (!currentSession) {
    redirect("/login");
  }

  const session = requireRole(currentSession, AUTH_ROLES);
  const initialState = await loadDemoHydrationForRole(session.role, {
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  });

  return (
    <DemoStoreProvider initialState={initialState}>
      <DemoShell session={toClientAuthSession(session)} logoutAction={logoutAction}>
        {children}
      </DemoShell>
    </DemoStoreProvider>
  );
}
