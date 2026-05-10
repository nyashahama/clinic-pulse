import type { LucideIcon } from "lucide-react";
import {
  DatabaseZap,
  Filter,
  Radio,
  Route,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  BrowserFrame,
  MetricTile,
  ProductRow,
  StatusPill,
} from "@/components/landing/product-preview-primitives";
import { RoutePulseMap } from "@/components/landing/motion/route-pulse-map";
import {
  heroClinicRows,
  heroConsoleMetrics,
  heroConsoleNavItems,
  heroIncident,
} from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

const statusTone = {
  critical: "critical",
  warning: "warning",
  healthy: "healthy",
} satisfies Record<
  (typeof heroClinicRows)[number]["tone"],
  "critical" | "warning" | "healthy"
>;

export function HeroDistrictConsole({ className }: { className?: string }) {
  return (
    <div
      data-hero-console="true"
      className={cn("relative min-w-0 max-w-full", className)}
    >
      <BrowserFrame title="clinicpulse.demo/district-console">
        <div className="grid min-h-0 min-w-0 grid-cols-1 bg-white dark:bg-card sm:min-h-[560px] lg:grid-cols-[9rem_minmax(0,1fr)] 2xl:grid-cols-[10rem_minmax(0,1fr)]">
          <aside className="hidden border-r border-neutral-200 bg-neutral-50/80 p-3 dark:border-border dark:bg-sidebar lg:block">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-sidebar-foreground/60">
              Workspace
            </p>
            <div className="mt-3 grid gap-1.5">
              {heroConsoleNavItems.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-lg px-2.5 py-2 text-xs font-semibold",
                    index === 0
                      ? "bg-neutral-950 text-white dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                      : "text-neutral-600 dark:text-sidebar-foreground",
                  )}
                >
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      "mt-1 block font-mono text-[10px]",
                      index === 0 ? "text-white/55" : "text-neutral-400 dark:text-sidebar-foreground/55",
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          <main className="min-w-0 p-2.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-border">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-muted-foreground">
                  Tshwane North Demo
                </p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-950 dark:text-card-foreground">
                  District command center
                </h2>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-muted-foreground">
                <span className="hidden items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-border dark:bg-muted sm:inline-flex">
                  <Search className="size-3.5" />
                  Search clinics
                </span>
                <span className="hidden items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-border dark:bg-muted sm:inline-flex">
                  <Filter className="size-3.5" />
                  Status filters
                </span>
                <StatusPill tone="healthy">live sync</StatusPill>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {heroConsoleMetrics.map((metric) => (
                <MetricTile key={metric.label} {...metric} />
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/25">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-300">
                    Active incident
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-neutral-950 dark:text-card-foreground">
                    {heroIncident.clinic}
                  </p>
                </div>
                <StatusPill tone="critical">{heroIncident.status}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <InfoLine
                  icon={Radio}
                  label="Source"
                  value={heroIncident.source}
                />
                <InfoLine
                  icon={DatabaseZap}
                  label="Service"
                  value={heroIncident.service}
                />
                <InfoLine
                  icon={Route}
                  label="Reroute"
                  value={heroIncident.recommendedRoute}
                />
                <InfoLine
                  icon={ShieldCheck}
                  label="Audit"
                  value={heroIncident.auditId}
                />
              </div>
            </div>

            <div className="mt-3 grid min-w-0 gap-3">
              <div className="relative min-h-40 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-border dark:bg-muted sm:min-h-56">
                <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(255,255,255,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.72)_1px,transparent_1px)] [background-size:28px_28px] dark:[background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
                <RoutePulseMap />
                <MapPinDot className="left-[24%] top-[28%]" tone="healthy" />
                <MapPinDot className="left-[48%] top-[32%]" tone="healthy" />
                <MapPinDot className="left-[61%] top-[24%]" tone="warning" />
                <MapPinDot
                  active
                  className="left-[36%] top-[58%]"
                  tone="critical"
                />
                <MapPinDot className="left-[70%] top-[60%]" tone="healthy" />
                <div className="absolute bottom-3 left-3 rounded-xl border border-neutral-800/10 bg-neutral-950 px-3 py-2 text-white shadow-xl">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                    Selected clinic
                  </p>
                  <p className="mt-1 text-sm font-semibold">Mamelodi East</p>
                </div>
              </div>

              <div className="grid gap-2">
                {heroClinicRows.map((row, index) => (
                  <ProductRow
                    key={row.clinic}
                    active={index === 0}
                    activeTone={statusTone[row.tone]}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-neutral-950 dark:text-card-foreground">
                          {row.clinic}
                        </p>
                        <p className="mt-1 hidden text-neutral-500 dark:text-muted-foreground sm:line-clamp-2">
                          {row.reason}
                        </p>
                      </div>
                      <StatusPill tone={statusTone[row.tone]}>
                        {row.status}
                      </StatusPill>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-neutral-500 dark:text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Route className="size-3" />
                        {row.action}
                      </span>
                      <span>{row.freshness}</span>
                    </div>
                  </ProductRow>
                ))}
              </div>
            </div>
          </main>

        </div>
      </BrowserFrame>
    </div>
  );
}

function MapPinDot({
  active,
  className,
  tone,
}: {
  active?: boolean;
  className: string;
  tone: "critical" | "warning" | "healthy";
}) {
  const color = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    healthy: "bg-emerald-500",
  }[tone];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute size-4 rounded-full border-2 border-white shadow-lg",
        active && "ring-4 ring-red-500/15",
        color,
        className,
      )}
    />
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-white/80 bg-white/70 px-2 py-1.5 dark:border-border dark:bg-card/80 sm:px-2.5 sm:py-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-neutral-500 dark:text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400 dark:text-muted-foreground sm:text-[10px]">
          {label}
        </p>
        <p className="mt-0.5 break-words text-xs font-semibold text-neutral-800 dark:text-card-foreground sm:text-sm">
          {value}
        </p>
      </div>
    </div>
  );
}
