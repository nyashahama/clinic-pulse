"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { AuthRole, ClientAuthSession } from "@/lib/auth/api";
import { cn } from "@/lib/utils";
import { getRoleWorkspace } from "./role-workspace";

type HeroMetric = {
  label: string;
  value: string;
  description: string;
  tone?: "default" | "good" | "warning" | "critical";
};

type HeroFocusItem = {
  label: string;
  title: string;
  description: string;
  href?: string;
};

type RoleWorkspaceHeroProps = {
  session: ClientAuthSession;
  workspaceRole?: AuthRole;
  metrics: HeroMetric[];
  focusItems: HeroFocusItem[];
  children?: ReactNode;
};

const metricToneClassNames: Record<NonNullable<HeroMetric["tone"]>, string> = {
  default: "border-slate-200 bg-white",
  good: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  critical: "border-rose-200 bg-rose-50",
};

export function RoleWorkspaceHero({
  children,
  focusItems,
  metrics,
  session,
  workspaceRole,
}: RoleWorkspaceHeroProps) {
  const workspace = getRoleWorkspace(workspaceRole ?? session.role);
  const PrimaryActionIcon = workspace.primaryAction.icon;
  const workspaceScope =
    session.organisationName ?? session.district ?? "ClinicPulse workspace";

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-950 text-white shadow-sm">
      <div className="relative grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(20,184,166,0.28),transparent_34%),radial-gradient(circle_at_86%_20%,rgba(56,189,248,0.18),transparent_28%)]" />

        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
            <span>{workspace.eyebrow}</span>
            <span className="h-1 w-1 rounded-full bg-emerald-200/70" />
            <span>{workspace.roleLabel}</span>
          </div>

          <h1 className="mt-3 max-w-4xl font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            {workspace.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            {workspace.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={workspace.primaryAction.href}
              className={buttonVariants({ size: "sm", variant: "default" })}
            >
              <PrimaryActionIcon className="size-3.5" />
              {workspace.primaryAction.label}
            </Link>
            {children}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-slate-950",
                  metricToneClassNames[metric.tone ?? "default"],
                )}
              >
                <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-100">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {session.displayName || session.email}
              </p>
              <p className="mt-1 truncate text-xs text-slate-300">{workspaceScope}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {focusItems.map((item) => (
              <div
                key={`${item.label}-${item.title}`}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/80">
                  {item.label}
                </p>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      {item.description}
                    </p>
                  </div>
                  {item.href ? (
                    <Link
                      href={item.href}
                      aria-label={item.title}
                      className="mt-0.5 rounded-full border border-white/10 p-1.5 text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      <ArrowRight className="size-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
