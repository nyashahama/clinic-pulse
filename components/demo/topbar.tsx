"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, RotateCcw, Search, UserRound } from "lucide-react";

import { CommandPalette } from "@/components/demo/command-palette";
import { LiveIndicator } from "@/components/demo/live-indicator";
import { Button } from "@/components/ui/button";
import type { AuthRole, ClientAuthSession } from "@/lib/auth/api";
import { useDemoStore } from "@/lib/demo/demo-store";

type TopbarProps = {
  authSession: ClientAuthSession;
  logoutAction: () => Promise<void>;
  onOpenSidebar?: () => void;
};

const ROLE_LABELS: Record<AuthRole, string> = {
  system_admin: "System admin",
  org_admin: "Org admin",
  district_manager: "District manager",
  reporter: "Reporter",
};

export function Topbar({ authSession, logoutAction, onOpenSidebar }: TopbarProps) {
  const router = useRouter();
  const { resetDemo } = useDemoStore();
  const [query, setQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  const isTextField = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const nodeName = target.nodeName;
    return (
      nodeName === "INPUT" ||
      nodeName === "TEXTAREA" ||
      target.isContentEditable ||
      nodeName === "SELECT"
    );
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextField(event.target)) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }

      if (modifier && event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetDemo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetDemo]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur">
        <div className="flex min-h-16 items-center gap-3 px-3 py-3 lg:px-6">
          <Button
            variant="outline"
            size="icon-sm"
            className="lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const trimmedQuery = query.trim();
              if (!trimmedQuery) {
                return;
              }

              router.push(`/finder?query=${encodeURIComponent(trimmedQuery)}`);
            }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3"
          >
            <Search className="size-4 shrink-0 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clinics, services, or facility codes"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            />
          </form>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommandOpen(true)}
            className="inline-flex"
          >
            <Search className="size-4" />
            <span className="hidden md:inline">Command</span>
            <span className="hidden rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500 md:inline">
              ⌘K
            </span>
          </Button>

          <div className="hidden xl:block">
            <LiveIndicator />
          </div>

          <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 sm:flex">
            <UserRound className="size-4 shrink-0 text-neutral-500" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-neutral-900">
                {authSession.displayName || authSession.email}
              </p>
              <p className="truncate text-[11px] font-medium text-neutral-500">
                {ROLE_LABELS[authSession.role]}
              </p>
            </div>
          </div>

          <form action={logoutAction}>
            <Button
              variant="outline"
              size="icon-sm"
              type="submit"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </form>

          <Button
            variant="outline"
            size="sm"
            onClick={resetDemo}
            aria-label="Reset demo state"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Reset</span>
            <span className="hidden rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500 lg:inline">
              Ctrl/⌘+Shift+R
            </span>
          </Button>
        </div>

        <div className="border-t border-neutral-200 px-3 py-3 xl:hidden lg:px-6">
          <LiveIndicator />
        </div>
      </header>

      <CommandPalette key={commandOpen ? "open" : "closed"} open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
