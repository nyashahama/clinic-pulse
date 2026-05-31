import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { WorkspaceLayoutShell } from "@/components/workspace/workspace-layout-shell";
import { AUTH_ROLES, logout } from "@/lib/auth/api";
import {
  applySessionCookieFromHeader,
  clearSessionCookie,
  getCurrentSession,
  getSessionCookieHeader,
  requireRole,
  toClientAuthSession,
} from "@/lib/auth/session";
import { WorkspaceStoreProvider } from "@/lib/workspace/workspace-store";
import { loadWorkspaceHydrationForRole } from "@/lib/workspace/server-hydration";
import { getLoginHref } from "@/lib/auth/redirects";

async function logoutAction() {
  "use server";

  const cookieHeader = await getSessionCookieHeader();
  const result = await logout({
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
            "x-clinicpulse-server-mutation": "1",
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

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  await connection();
  const requestHeaders = await headers();
  const returnPath = requestHeaders.get("x-clinicpulse-pathname");
  const cookieHeader = await getSessionCookieHeader();
  const currentSession = await getCurrentSession({ cookieHeader });
  if (!currentSession) {
    redirect(getLoginHref(returnPath));
  }
  if (currentSession.user.passwordResetRequired) {
    redirect("/change-password");
  }

  const session = requireRole(currentSession, AUTH_ROLES);
  const initialState = await loadWorkspaceHydrationForRole(session.role, {
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  });

  return (
    <WorkspaceStoreProvider initialState={initialState}>
      <WorkspaceLayoutShell session={toClientAuthSession(session)} logoutAction={logoutAction}>
        {children}
      </WorkspaceLayoutShell>
    </WorkspaceStoreProvider>
  );
}
