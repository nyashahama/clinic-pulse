"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Compass,
  Globe,
  Map,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "District Console", href: "/demo", icon: Building2 },
  { label: "Clinic Finder", href: "/finder", icon: Compass },
  { label: "Field Report", href: "/field", icon: Map },
  { label: "Admin", href: "/admin", icon: Shield },
  { label: "Landing", href: "/", icon: Globe },
  { label: "Book Demo", href: "/book-demo", icon: BookOpen },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

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
              Tshwane North Demo District
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_LINKS.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon className="size-4" />
                <span className="truncate">{label}</span>
              </span>
              {href === "/" || href === "/book-demo" ? (
                <ArrowUpRight className="size-4 opacity-70" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 px-4 py-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
            <p className="text-xs font-medium text-neutral-900">Demo Controls</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Use <span className="font-mono text-[11px] text-neutral-700">Ctrl/⌘ K</span>{" "}
            for quick actions and <span className="font-mono text-[11px] text-neutral-700">Ctrl/⌘+Shift+R</span>{" "}
            to reset demo state.
          </p>
        </div>
      </div>
    </aside>
  );
}
