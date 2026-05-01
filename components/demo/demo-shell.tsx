"use client";

import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/demo/sidebar";
import { Topbar } from "@/components/demo/topbar";
import { cn } from "@/lib/utils";

type DemoShellProps = {
  children: ReactNode;
  detail?: ReactNode;
};

export function DemoShell({ children, detail }: DemoShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh bg-neutral-50 text-neutral-900">
      <div className="hidden w-72 shrink-0 border-r border-neutral-200 lg:block">
        <Sidebar />
      </div>

      <button
        type="button"
        className={cn(
          "fixed inset-0 z-40 bg-neutral-950/40 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close navigation"
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-2rem)] border-r border-neutral-200 bg-white transition-transform lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-screen-2xl flex-col px-3 py-4 lg:px-6">
              {children}
            </div>
          </main>

          {detail ? (
            <aside className="hidden w-[24rem] shrink-0 overflow-y-auto border-l border-neutral-200 bg-white xl:block">
              <div className="min-h-full px-4 py-4">{detail}</div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
