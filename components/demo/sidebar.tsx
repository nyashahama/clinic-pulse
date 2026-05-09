"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";

import type { ClientAuthSession } from "@/lib/auth/api";
import { cn } from "@/lib/utils";
import { getRoleWorkspace } from "./role-workspace";

type SidebarProps = {
  onNavigate?: () => void;
  session: ClientAuthSession;
};

function getHrefPath(href: string) {
  return href.split(/[?#]/)[0] || href;
}

export function Sidebar({ onNavigate, session }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspace = getRoleWorkspace(session.role);
  const scope = session.organisationName ?? session.district ?? workspace.label;

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="border-b border-neutral-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm text-neutral-900">ClinicPulse</p>
            <p className="truncate text-xs text-neutral-500">
              {scope}
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {workspace.roleLabel}
          </p>
          <p className="mt-0.5 text-sm font-medium text-neutral-900">
            {workspace.label}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {workspace.sidebarGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {group.label}
            </p>
            <div className="mt-2 space-y-1">
              {group.items.map(({ badge, href, icon: Icon, label }) => {
                const hrefPath = getHrefPath(href);
                const hrefQuery = href.includes("?") ? href.split("?")[1] : "";
                const pathActive =
                  pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
                const active = hrefQuery
                  ? pathname === hrefPath && searchParams.toString() === hrefQuery
                  : pathActive;

                return (
                  <Link
                    key={`${group.label}-${href}-${label}`}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                    {badge ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          active
                            ? "bg-white/15 text-white"
                            : "bg-neutral-100 text-neutral-500",
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-neutral-200 px-4 py-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
          <p className="text-xs font-medium text-neutral-900">
            {workspace.footer.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            {workspace.footer.description}
          </p>
        </div>
      </div>
    </aside>
  );
}
