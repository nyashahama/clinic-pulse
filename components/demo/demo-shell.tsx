"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { ClientAuthSession } from "@/lib/auth/api";

type DemoShellProps = {
  children: ReactNode;
  detail?: ReactNode;
  logoutAction: () => Promise<void>;
  session: ClientAuthSession;
};

export function DemoShell({ children, detail, logoutAction, session }: DemoShellProps) {
  return (
    <SidebarProvider className="[--header-height:4rem] bg-background text-foreground">
      <AppSidebar session={session} />
      <SidebarInset className="flex h-svh min-w-0 flex-col overflow-hidden bg-background">
        <SiteHeader authSession={session} logoutAction={logoutAction} />
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
