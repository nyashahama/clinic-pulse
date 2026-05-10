"use client";

import type { ReactNode } from "react";

import { WorkspaceHeader } from "@/components/product/workspace-header";
import { WorkspaceSidebar } from "@/components/product/workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { ClientAuthSession } from "@/lib/auth/api";

export type WorkspaceShellProps = {
  children: ReactNode;
  detail?: ReactNode;
  headerStatusIndicator?: ReactNode;
  logoutAction: () => Promise<void>;
  renderCommandPalette?: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => ReactNode;
  session: ClientAuthSession;
};

export function WorkspaceShell({
  children,
  detail,
  headerStatusIndicator,
  logoutAction,
  renderCommandPalette,
  session,
}: WorkspaceShellProps) {
  return (
    <SidebarProvider className="[--header-height:4rem] bg-background text-foreground">
      <WorkspaceSidebar session={session} />
      <SidebarInset className="flex h-svh min-w-0 flex-col overflow-hidden bg-background">
        <WorkspaceHeader
          authSession={session}
          headerStatusIndicator={headerStatusIndicator}
          logoutAction={logoutAction}
          renderCommandPalette={renderCommandPalette}
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-screen-2xl flex-col px-3 py-4 lg:px-6">
              {children}
            </div>
          </main>

          {detail ? (
            <aside className="hidden w-[24rem] shrink-0 overflow-y-auto border-l border-border bg-card text-card-foreground xl:block">
              <div className="min-h-full px-4 py-4">{detail}</div>
            </aside>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
