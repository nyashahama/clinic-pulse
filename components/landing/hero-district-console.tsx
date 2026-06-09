import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  DatabaseZap,
  FileText,
  Filter,
  MapPin,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  BrowserFrame,
  ProductRow,
  StatusPill,
} from "@/components/landing/product-preview-primitives";
import {
  heroClinicRows,
  heroConsoleMetrics,
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

/* ─── Sidebar nav items ─── */
const SIDEBAR_SECTIONS = [
  {
    label: "Operations",
    items: [
      { icon: Building2, name: "District console", active: true, badge: null },
      { icon: FileText, name: "Field reports", active: false, badge: "3" },
      { icon: MapPin, name: "Public finder", active: false, badge: null },
      { icon: ShieldCheck, name: "Audit trail", active: false, badge: null },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: Activity, name: "Signal analytics", active: false, badge: null },
      { icon: Users, name: "Team activity", active: false, badge: null },
    ],
  },
];

/* ─── Clinic rows with more data ─── */
const CLINIC_ROWS = [
  {
    clinic: "Mabopane Station Clinic",
    status: "Non-functional",
    tone: "critical" as const,
    reason: "Generator failure paused dispensing and chronic care pickup",
    freshness: "2 min ago",
    action: "Reroute",
    staff: "—",
    patients: "83 skipped",
    lastReport: "07:12",
  },
  {
    clinic: "Soshanguve Block F Clinic",
    status: "Degraded",
    tone: "warning" as const,
    reason: "Staffing pressure during afternoon shift — limited services",
    freshness: "7 min ago",
    action: "Limit visits",
    staff: "2 of 5",
    patients: "31 redirected",
    lastReport: "08:01",
  },
  {
    clinic: "Akasia Hills Clinic",
    status: "Operational",
    tone: "healthy" as const,
    reason: "Pharmacy services accepting rerouted pickups",
    freshness: "Now",
    action: "Accepting",
    staff: "4 of 4",
    patients: "12 received",
    lastReport: "08:15",
  },
  {
    clinic: "Wonderpark Medical Centre",
    status: "Operational",
    tone: "healthy" as const,
    reason: "Full services operational — no pressures",
    freshness: "Now",
    action: "Stable",
    staff: "6 of 6",
    patients: "—",
    lastReport: "08:10",
  },
  {
    clinic: "Claudina Private Clinic",
    status: "Operational",
    tone: "healthy" as const,
    reason: "Private facility — accepting overflow patients",
    freshness: "1 min ago",
    action: "Accepting",
    staff: "8 of 8",
    patients: "5 received",
    lastReport: "08:14",
  },
];

/* ─── SVG sparkline (inline, no deps) ─── */
function Sparkline({
  data,
  color = "#0D7A6B",
  width = 64,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

/* ─── Tshwane North SVG map ─── */
function TshwaneMap() {
  const clinics = [
    { x: 38, y: 52, tone: "critical" as const, name: "Mabopane", active: true },
    { x: 52, y: 34, tone: "warning" as const, name: "Soshanguve F", active: false },
    { x: 68, y: 28, tone: "healthy" as const, name: "Akasia Hills", active: false },
    { x: 74, y: 56, tone: "healthy" as const, name: "Wonderpark", active: false },
    { x: 58, y: 68, tone: "healthy" as const, name: "Claudina", active: false },
    { x: 30, y: 38, tone: "healthy" as const, name: "Garankuwa", active: false },
    { x: 46, y: 78, tone: "healthy" as const, name: "Mabopane South", active: false },
    { x: 82, y: 42, tone: "healthy" as const, name: "Churchill", active: false },
  ];

  const toneColor = {
    critical: "#EF4444",
    warning: "#F59E0B",
    healthy: "#10B981",
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-[#F0F4F3]">
      {/* Subtle grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* District boundary */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 20 15 Q 35 8, 55 12 Q 72 10, 85 18 Q 92 30, 88 48 Q 90 65, 80 75 Q 68 85, 50 82 Q 32 88, 22 78 Q 12 65, 15 48 Q 10 30, 20 15 Z"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="0.4"
          strokeDasharray="2 1.5"
          opacity="0.5"
        />
        {/* Route paths between clinics */}
        <path d="M 38 52 Q 45 43, 52 34" fill="none" stroke="#94A3B8" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
        <path d="M 52 34 Q 60 31, 68 28" fill="none" stroke="#94A3B8" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
        <path d="M 38 52 Q 48 60, 58 68" fill="none" stroke="#94A3B8" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
        <path d="M 68 28 Q 71 42, 74 56" fill="none" stroke="#94A3B8" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
      </svg>

      {/* Clinic pins */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {clinics.map((c) => (
          <g key={c.name}>
            {c.active && (
              <circle cx={c.x} cy={c.y} r="5" fill={toneColor[c.tone]} opacity="0.15">
                <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={c.x}
              cy={c.y}
              r={c.active ? "2.2" : "1.6"}
              fill={toneColor[c.tone]}
              stroke="white"
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>

      {/* Route animation for active incident */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 38 52 Q 45 43, 52 34 Q 60 31, 68 28"
          fill="none"
          stroke={toneColor.critical}
          strokeWidth="0.5"
          strokeDasharray="3 3"
          opacity="0.6"
        >
          <animate attributeName="stroke-dashoffset" values="0;-12" dur="1.5s" repeatCount="indefinite" />
        </path>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-md bg-white/90 px-2 py-1 text-[9px] font-medium shadow-sm backdrop-blur">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-red-500" /> Non-functional
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-500" /> Degraded
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Operational
        </span>
      </div>

      {/* Selected clinic tooltip */}
      <div className="absolute bottom-2 right-2 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-white shadow-lg">
        <p className="text-[8px] uppercase tracking-wider text-white/50">Selected clinic</p>
        <p className="text-[11px] font-semibold">Mabopane Station</p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function HeroDistrictConsole({ className }: { className?: string }) {
  return (
    <div
      data-hero-console="true"
      className={cn("relative min-w-0 max-w-full", className)}
    >
      <BrowserFrame title="clinicpulse.ops/district-console">
        <div className="grid min-h-0 min-w-0 grid-cols-1 bg-white dark:bg-card sm:min-h-[580px] lg:grid-cols-[10rem_minmax(0,1fr)] 2xl:grid-cols-[11rem_minmax(0,1fr)]">
          {/* ─── Sidebar ─── */}
          <aside className="hidden border-r border-neutral-200/60 bg-neutral-50/80 p-2.5 dark:border-border dark:bg-sidebar lg:block">
            <div className="mb-3 flex items-center gap-2 px-2 pt-1">
              <div className="flex size-6 items-center justify-center rounded-md bg-neutral-900 text-[10px] font-bold text-white">
                T
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-neutral-900 dark:text-card-foreground">
                  Tshwane North
                </p>
                <p className="text-[9px] text-neutral-500 dark:text-muted-foreground">
                  District workspace
                </p>
              </div>
            </div>

            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.label} className="mt-4">
                <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-muted-foreground">
                  {section.label}
                </p>
                <div className="grid gap-0.5">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                        item.active
                          ? "bg-neutral-900 text-white dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                          : "text-neutral-600 hover:bg-neutral-100 dark:text-sidebar-foreground dark:hover:bg-white/5",
                      )}
                    >
                      <item.icon className="size-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none",
                            item.active
                              ? "bg-white/20 text-white"
                              : "bg-neutral-200 text-neutral-600 dark:bg-muted dark:text-muted-foreground",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* ─── Main content ─── */}
          <main className="min-w-0 overflow-y-auto p-2.5 sm:p-3">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/60 pb-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-muted-foreground">
                  Tshwane North
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-neutral-950 dark:text-card-foreground">
                  District command center
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-muted-foreground">
                <span className="hidden items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-border dark:bg-muted sm:inline-flex">
                  <Search className="size-3" />
                  Search
                </span>
                <span className="hidden items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-border dark:bg-muted sm:inline-flex">
                  <Filter className="size-3" />
                  Filter
                </span>
                <StatusPill tone="healthy">live</StatusPill>
              </div>
            </div>

            {/* Metric tiles with sparklines */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {heroConsoleMetrics.map((metric, i) => {
                const sparkData = [
                  [12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 17, 18],
                  [3, 5, 4, 8, 6, 10, 9, 12, 11, 14, 15, 17],
                  [2.8, 3.1, 2.9, 3.4, 3.2, 3.0, 2.7, 2.9, 3.1, 3.3, 3.0, 2.8],
                ][i];
                return (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200/60 bg-white p-2 dark:border-border dark:bg-card sm:p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[8px] font-semibold uppercase leading-3 tracking-[0.1em] text-neutral-500 dark:text-muted-foreground sm:text-[9px]">
                        {metric.label}
                      </p>
                      <p className="mt-0.5 text-base font-bold tabular-nums text-neutral-950 dark:text-card-foreground sm:text-lg">
                        {metric.value}
                      </p>
                      <p className="mt-0.5 hidden text-[10px] text-neutral-500 dark:text-muted-foreground sm:block">
                        {metric.detail}
                      </p>
                    </div>
                    <Sparkline data={sparkData} width={52} height={20} />
                  </div>
                );
              })}
            </div>

            {/* Active incident card */}
            <div className="mt-2 rounded-lg border border-red-200/80 bg-red-50/50 p-2.5 dark:border-red-900/60 dark:bg-red-950/25">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-300">
                    Active incident
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-semibold text-neutral-950 dark:text-card-foreground">
                    {heroIncident.clinic}
                  </p>
                </div>
                <StatusPill tone="critical">{heroIncident.status}</StatusPill>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <InfoLine icon={Radio} label="Source" value={heroIncident.source} />
                <InfoLine icon={DatabaseZap} label="Service" value={heroIncident.service} />
                <InfoLine icon={Route} label="Reroute" value={heroIncident.recommendedRoute} />
                <InfoLine icon={ShieldCheck} label="Audit" value={heroIncident.auditId} />
              </div>
            </div>

            {/* Map */}
            <div className="mt-2 h-36 sm:h-44">
              <TshwaneMap />
            </div>

            {/* Clinic table with header */}
            <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200/60 dark:border-border">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-neutral-200/60 bg-neutral-50/80 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:border-border dark:bg-muted dark:text-muted-foreground sm:grid-cols-[1fr_auto_auto_auto_auto]">
                <span>Clinic</span>
                <span className="hidden sm:block">Status</span>
                <span className="hidden sm:block">Staff</span>
                <span className="hidden sm:block">Patients</span>
                <span className="hidden sm:block">Updated</span>
              </div>
              <div className="grid gap-px bg-neutral-100 dark:bg-border">
                {CLINIC_ROWS.map((row, index) => (
                  <ProductRow
                    key={row.clinic}
                    active={index === 0}
                    activeTone={statusTone[row.tone]}
                    className="group cursor-default rounded-none border-x-0 border-t-0 bg-white transition-colors hover:bg-neutral-50/80 dark:bg-card dark:hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-neutral-950 dark:text-card-foreground">
                          {row.clinic}
                        </p>
                        <p className="mt-0.5 hidden text-[10px] text-neutral-500 dark:text-muted-foreground sm:line-clamp-1">
                          {row.reason}
                        </p>
                      </div>
                      <StatusPill tone={statusTone[row.tone]}>
                        {row.status}
                      </StatusPill>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-neutral-600 dark:text-muted-foreground sm:grid-cols-4 sm:gap-x-4">
                      <span className="hidden sm:block">
                        <span className="text-neutral-400 dark:text-muted-foreground/60">Staff: </span>
                        {row.staff}
                      </span>
                      <span className="hidden sm:block">
                        <span className="text-neutral-400 dark:text-muted-foreground/60">Patients: </span>
                        {row.patients}
                      </span>
                      <span className="hidden items-center gap-1 text-primary sm:flex">
                        <Route className="size-2.5" />
                        {row.action}
                      </span>
                      <span className="hidden text-neutral-400 dark:text-muted-foreground/60 sm:block">
                        {row.lastReport}
                      </span>
                    </div>
                  </ProductRow>
                ))}
              </div>
            </div>

            {/* Status bar */}
            <div className="mt-2 flex items-center justify-between rounded-md border border-neutral-200/40 bg-neutral-50/60 px-2.5 py-1 text-[9px] text-neutral-500 dark:border-border dark:bg-muted dark:text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  Sync: 42 clinics
                </span>
                <span>3 queued reports</span>
              </div>
              <span>Bandwidth: OK</span>
            </div>
          </main>
        </div>
      </BrowserFrame>
    </div>
  );
}

/* ─── Helpers ─── */
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
    <div className="flex items-start gap-1.5 rounded-md border border-white/60 bg-white/60 px-2 py-1.5 dark:border-border dark:bg-card/60">
      <Icon className="mt-0.5 size-3 shrink-0 text-neutral-400 dark:text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-[11px] font-medium text-neutral-800 dark:text-card-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
