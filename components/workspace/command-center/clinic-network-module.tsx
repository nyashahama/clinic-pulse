"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  Building2Icon,
  CheckCircle2Icon,
  FilterIcon,
  MapIcon,
  MapPinIcon,
  RadioTowerIcon,
  RouteIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  StethoscopeIcon,
} from "lucide-react";

import { FreshnessBadge } from "@/components/workspace/freshness-badge";
import { StatusBadge } from "@/components/workspace/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type {
  DistrictClinicNetworkClinic,
  DistrictClinicNetworkFilters,
  DistrictClinicNetworkMetric,
  DistrictClinicNetworkSelectedClinic,
  DistrictClinicNetworkTone,
  DistrictClinicNetworkViewModel,
} from "@/lib/workspace/district-clinic-network-view-model";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
};

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Non functional", value: "non_functional" },
  { label: "Degraded", value: "degraded" },
  { label: "Unknown", value: "unknown" },
  { label: "Operational", value: "operational" },
] satisfies FilterOption[];

const freshnessOptions = [
  { label: "All freshness", value: "all" },
  { label: "Fresh", value: "fresh" },
  { label: "Needs confirmation", value: "needs_confirmation" },
  { label: "Stale", value: "stale" },
  { label: "Unknown", value: "unknown" },
] satisfies FilterOption[];

const sourceOptions = [
  { label: "All sources", value: "all" },
  { label: "Field worker", value: "field_worker" },
  { label: "Clinic coordinator", value: "clinic_coordinator" },
  { label: "Scenario control", value: "scenario_control" },
  { label: "Seed", value: "seed" },
] satisfies FilterOption[];

const toneClassName: Record<DistrictClinicNetworkTone, string> = {
  clear:
    "border-emerald-200/80 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200/80 bg-amber-50/50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-destructive/25 bg-destructive/5 text-destructive dark:border-destructive/40 dark:bg-destructive/15",
  info: "border-sky-200/80 bg-sky-50/50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-100",
};

const railClassName: Record<DistrictClinicNetworkTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function selectedLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function activeFilterCount(filters: DistrictClinicNetworkFilters) {
  return Object.values(filters).filter((value) => value !== "all" && value !== "").length;
}

function MetricIcon({ metric }: { metric: DistrictClinicNetworkMetric }) {
  const className = "size-4";

  if (metric.label === "Network coverage") {
    return <Building2Icon className={className} />;
  }

  if (metric.label === "Routing ready") {
    return <ShieldCheckIcon className={className} />;
  }

  if (metric.tone === "blocked" || metric.tone === "attention") {
    return <ActivityIcon className={className} />;
  }

  return <CheckCircle2Icon className={className} />;
}

function FacetedFilter({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  value: string;
}) {
  const labelForValue = selectedLabel(options, value);
  const isActive = value !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`${label} filter: ${labelForValue}`}
            className={cn(
              "h-8 justify-start gap-2 border-dashed bg-bg-default px-2.5 text-xs",
              isActive && "border-primary/40 bg-primary/5 text-primary",
            )}
            size="sm"
            variant="outline"
          />
        }
      >
        <FilterIcon className="size-3.5" />
        <span>{label}</span>
        <span
          className={cn(
            "max-w-32 truncate rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 font-normal text-muted-foreground",
            isActive && "border-primary/25 bg-background text-primary",
          )}
        >
          {labelForValue}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label} filter</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} closeOnClick value={option.value}>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ClinicNetworkMetricStrip({
  metrics,
}: {
  metrics: DistrictClinicNetworkViewModel["metrics"];
}) {
  return (
    <section
      aria-label="Clinic network metrics"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      data-district-clinic-network-metrics
    >
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <div className={cn("h-1", railClassName[metric.tone])} aria-hidden="true" />
          <div className="grid min-h-[6.25rem] gap-3 p-4">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {metric.label}
              </p>
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
                  toneClassName[metric.tone],
                )}
                aria-hidden="true"
              >
                <MetricIcon metric={metric} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[1.65rem] font-semibold leading-none text-foreground">
                {metric.value}
              </p>
              <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
                {metric.detail}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export function ClinicNetworkFilterToolbar({
  filters,
  onClearFilters,
  onFilterChange,
  services,
  visibleClinicCount,
}: {
  filters: DistrictClinicNetworkFilters;
  onClearFilters: () => void;
  onFilterChange: <Key extends keyof DistrictClinicNetworkFilters>(
    key: Key,
    value: DistrictClinicNetworkFilters[Key],
  ) => void;
  services: string[];
  visibleClinicCount: number;
}) {
  const serviceOptions = [
    { label: "All services", value: "all" },
    ...services.map((service) => ({ label: service, value: service })),
  ];
  const activeCount = activeFilterCount(filters);

  return (
    <section
      aria-label="Clinic network filters"
      className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm"
      data-district-clinic-network-toolbar
    >
      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0">Network filters</span>
            {activeCount ? (
              <span className="rounded-md border border-primary/25 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary">
                {activeCount} active
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
            <span className="inline-flex h-7 max-w-full items-center rounded-md border border-sky-200 bg-sky-50 px-2 text-xs font-medium text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
              <span className="truncate">{visibleClinicCount} clinics visible</span>
            </span>
            <Button
              className="h-7 gap-1.5 px-2 text-xs"
              disabled={!activeCount}
              onClick={onClearFilters}
              size="sm"
              variant="outline"
            >
              <RotateCcwIcon className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid min-w-0 gap-2 xl:grid-cols-[minmax(14rem,1fr)_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search clinic network</span>
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search clinic network"
              className="pl-8"
              placeholder="Search clinic, code, service, or signal"
              type="search"
              value={filters.query}
              onChange={(event) => onFilterChange("query", event.target.value)}
            />
          </label>
          <div className="flex min-w-0 flex-wrap gap-2">
            <FacetedFilter
              label="Status"
              options={statusOptions}
              value={filters.status}
              onValueChange={(value) =>
                onFilterChange("status", value as DistrictClinicNetworkFilters["status"])
              }
            />
            <FacetedFilter
              label="Freshness"
              options={freshnessOptions}
              value={filters.freshness}
              onValueChange={(value) =>
                onFilterChange("freshness", value as DistrictClinicNetworkFilters["freshness"])
              }
            />
            <FacetedFilter
              label="Source"
              options={sourceOptions}
              value={filters.source}
              onValueChange={(value) =>
                onFilterChange("source", value as DistrictClinicNetworkFilters["source"])
              }
            />
            <FacetedFilter
              label="Service"
              options={serviceOptions}
              value={filters.service}
              onValueChange={(value) => onFilterChange("service", value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function clampPercent(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getMapCoordinates(clinics: DistrictClinicNetworkClinic[]) {
  if (clinics.length === 0) {
    return () => ({ x: 16, y: 18 });
  }

  const latitudes = clinics.map((clinic) => clinic.latitude);
  const longitudes = clinics.map((clinic) => clinic.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return (clinic: DistrictClinicNetworkClinic) => {
    const x = clampPercent(
      ((clinic.longitude - minLng) / Math.max(maxLng - minLng, 0.0001)) * 66 + 17,
      15,
      85,
    );
    const y = clampPercent(
      ((maxLat - clinic.latitude) / Math.max(maxLat - minLat, 0.0001)) * 62 + 18,
      16,
      82,
    );
    return { x, y };
  };
}

function getMapPosition(clinics: DistrictClinicNetworkClinic[]) {
  const getCoordinates = getMapCoordinates(clinics);

  return (clinic: DistrictClinicNetworkClinic) => {
    const coordinates = getCoordinates(clinic);
    const horizontalClassName =
      coordinates.x < 26
        ? "left-0 translate-x-0"
        : coordinates.x > 74
          ? "right-0 translate-x-0"
          : "left-1/2 -translate-x-1/2";
    const verticalClassName =
      coordinates.y > 68 ? "bottom-[calc(100%+0.65rem)]" : "top-[calc(100%+0.65rem)]";

    return {
      labelClassName: `${horizontalClassName} ${verticalClassName}`,
      style: { left: `${coordinates.x}%`, top: `${coordinates.y}%` },
    };
  };
}

function getPinClassName(clinic: DistrictClinicNetworkClinic) {
  if (clinic.status === "non_functional") {
    return "border-red-200 bg-red-500";
  }

  if (clinic.status === "degraded") {
    return "border-amber-200 bg-amber-500";
  }

  if (clinic.freshness !== "fresh") {
    return "border-sky-200 bg-sky-500";
  }

  return "border-emerald-200 bg-emerald-500";
}

const mapLegend = [
  { className: "bg-emerald-500", label: "Routing ready" },
  { className: "bg-amber-500", label: "Constrained" },
  { className: "bg-red-500", label: "Reroute" },
  { className: "bg-sky-500", label: "Verify" },
];

export function ClinicNetworkMapPanel({
  clinics,
  onSelectClinic,
  selectedClinic,
}: {
  clinics: DistrictClinicNetworkViewModel["clinics"];
  onSelectClinic: (clinicId: string) => void;
  selectedClinic: DistrictClinicNetworkViewModel["selectedClinic"];
}) {
  const placePin = getMapPosition(clinics);
  const getCoordinates = getMapCoordinates(clinics);
  const selectedClinicId = selectedClinic?.clinicId ?? null;
  const selectedMapClinic =
    clinics.find((clinic) => clinic.clinicId === selectedClinicId) ?? null;
  const selectedAlternativeIds = new Set(
    selectedClinic?.routingAlternatives.map((alternative) => alternative.clinicId) ?? [],
  );
  const selectedAlternativeClinics = clinics.filter((clinic) =>
    selectedAlternativeIds.has(clinic.clinicId),
  );
  const routingReadyCount = clinics.filter(
    (clinic) => clinic.status === "operational" && clinic.freshness === "fresh",
  ).length;

  return (
    <section
      aria-label="District clinic network map"
      className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      data-district-clinic-network-map-primary
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Network coverage
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">District map</h2>
          </div>
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-muted text-muted-foreground">
            <MapIcon className="size-4" />
          </span>
        </div>
      </div>

      <div className="relative min-h-[32rem] overflow-hidden bg-[linear-gradient(180deg,#f7faf9_0%,#eef6f4_100%)] dark:bg-none dark:bg-card">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute left-[8%] top-[14%] h-px w-[34%] rotate-[16deg] bg-teal-200/80 dark:bg-primary/30" />
          <div className="absolute left-[22%] top-[48%] h-px w-[52%] -rotate-[12deg] bg-teal-200/80 dark:bg-primary/30" />
          <div className="absolute left-[54%] top-[16%] h-[58%] w-px rotate-[12deg] bg-teal-200/80 dark:bg-primary/30" />
          <div className="absolute left-[12%] top-[72%] h-px w-[58%] rotate-[6deg] bg-sky-200/80 dark:bg-sky-500/25" />
          <div className="absolute inset-x-[12%] top-[30%] h-24 rounded-full border border-dashed border-teal-200/80 dark:border-primary/30" />
          <div className="absolute left-[58%] top-[52%] h-20 w-28 rounded-full border border-dashed border-sky-200/70 dark:border-sky-500/25" />
        </div>

        {selectedMapClinic ? (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {selectedAlternativeClinics.map((alternative) => {
              const start = getCoordinates(selectedMapClinic);
              const end = getCoordinates(alternative);

              return (
                <line
                  key={alternative.clinicId}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className="stroke-primary/40"
                  strokeDasharray="1.5 2"
                  strokeLinecap="round"
                  strokeWidth="0.45"
                />
              );
            })}
          </svg>
        ) : null}

        <div className="absolute left-3 top-3 z-10 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border border-border-subtle bg-bg-default/92 px-3 py-2 text-xs text-content-default shadow-sm backdrop-blur">
          <RadioTowerIcon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">
            {clinics.length} clinics plotted · {routingReadyCount} routing-ready
          </span>
        </div>

        {clinics.map((clinic) => {
          const isSelected = clinic.clinicId === selectedClinicId;
          const isRoutingAlternative = selectedAlternativeIds.has(clinic.clinicId);
          const placement = placePin(clinic);

          return (
            <button
              key={clinic.clinicId}
              type="button"
              aria-label={`Select ${clinic.clinicName} on the clinic network map. Status: ${formatLabel(clinic.status)}.`}
              onClick={() => onSelectClinic(clinic.clinicId)}
              className={cn(
                "group absolute -translate-x-1/2 -translate-y-1/2 text-left",
                isSelected ? "z-20" : "z-10",
              )}
              style={placement.style}
            >
              <span
                className={cn(
                  "absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-md transition-opacity",
                  isSelected && "opacity-100",
                  clinic.status === "non_functional"
                    ? "bg-red-400/40"
                    : clinic.status === "degraded"
                      ? "bg-amber-300/50"
                      : "bg-teal-300/40",
                )}
              />
              <span
                className={cn(
                  "relative flex size-4 items-center justify-center rounded-full border-2 shadow-sm transition-transform group-hover:scale-110",
                  getPinClassName(clinic),
                  isSelected ? "scale-110 ring-4 ring-white dark:ring-primary/40" : "",
                  isRoutingAlternative && "ring-4 ring-emerald-200/80 dark:ring-emerald-900/40",
                )}
              />
              <span
                className={cn(
                  "absolute hidden w-48 rounded-md border border-border-subtle bg-bg-default px-2.5 py-2 text-[11px] shadow-lg shadow-slate-900/10 backdrop-blur group-hover:block group-focus-visible:block",
                  placement.labelClassName,
                  isSelected && "block",
                )}
              >
                <span className="block truncate font-semibold text-foreground">
                  {clinic.clinicName}
                </span>
                <span className="mt-0.5 block text-muted-foreground">{clinic.coverageLabel}</span>
              </span>
            </button>
          );
        })}

        <div className="absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] min-w-0 flex-wrap gap-1.5 rounded-md border border-border-subtle bg-bg-default/92 p-2 text-xs text-content-default shadow-sm backdrop-blur">
          {selectedAlternativeClinics.length ? (
            <span className="inline-flex items-center gap-1.5 rounded border border-primary/20 bg-primary/5 px-1.5 text-primary">
              <RouteIcon className="size-3" />
              {selectedAlternativeClinics.length} active corridors
            </span>
          ) : null}
          {mapLegend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5 px-1">
              <span className={cn("size-2 rounded-full", item.className)} />
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClinicNetworkWorklist({
  clinics,
  emptyState,
  onSelectClinic,
  selectedClinicId,
}: {
  clinics: DistrictClinicNetworkViewModel["clinics"];
  emptyState: DistrictClinicNetworkViewModel["emptyState"];
  onSelectClinic: (clinicId: string) => void;
  selectedClinicId: string | null;
}) {
  return (
    <section
      aria-label="Clinic network worklist"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      data-district-clinic-network-worklist-panel
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Network clinics
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              Coverage table
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              Clinic-level signal state and spare routing capacity for teams that need the row
              detail behind the district map.
            </p>
          </div>
          <span className="inline-flex h-7 shrink-0 items-center rounded-md border border-border-subtle bg-bg-muted px-2 text-xs font-medium text-muted-foreground">
            {clinics.length} visible
          </span>
        </div>
      </div>
      <div className="hidden grid-cols-[minmax(12rem,1fr)_minmax(7rem,0.5fr)_minmax(7rem,0.5fr)] border-b border-border-subtle bg-bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-content-default sm:grid">
        <span>Clinic</span>
        <span>Signal</span>
        <span className="text-right">Capacity</span>
      </div>
      {clinics.length === 0 && emptyState ? (
        <div className="p-6 text-center">
          <p className="text-sm font-medium text-foreground">{emptyState.title}</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-5 text-muted-foreground">
            {emptyState.description}
          </p>
        </div>
      ) : (
        clinics.map((clinic) => {
          const isSelected = clinic.clinicId === selectedClinicId;

          return (
            <button
              key={clinic.clinicId}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${clinic.clinicName}, ${formatLabel(clinic.status)}, ${clinic.coverageLabel}`}
              data-district-clinic-network-row
              onClick={() => onSelectClinic(clinic.clinicId)}
              className={cn(
                "relative grid w-full min-w-0 gap-3 border-b border-border-subtle px-3 py-3 text-left last:border-b-0 hover:bg-bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:grid-cols-[minmax(12rem,1fr)_minmax(7rem,0.5fr)_minmax(7rem,0.5fr)]",
                isSelected && "bg-primary/5",
              )}
            >
              {isSelected ? (
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />
              ) : null}
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {clinic.clinicName}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {clinic.facilityCode} · {clinic.services.slice(0, 2).join(", ")}
                </span>
              </span>
              <span className="grid justify-start gap-1.5">
                <StatusBadge status={clinic.status} />
                <FreshnessBadge freshness={clinic.freshness} />
              </span>
              <span className="grid justify-items-start gap-1 sm:justify-items-end">
                <span className="text-xs font-medium text-foreground">
                  {clinic.coverageLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {clinic.alternativeCapacity} alternatives
                </span>
              </span>
            </button>
          );
        })
      )}
    </section>
  );
}

function ProfileSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="border-t border-border-subtle pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function ClinicNetworkSelectedProfile({
  selectedClinic,
}: {
  selectedClinic: DistrictClinicNetworkSelectedClinic | null;
}) {
  if (!selectedClinic) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Routing capacity
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">No clinic selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Select a clinic to review available alternatives, protected services, and verification
          need.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm">
      <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Routing capacity
          </p>
          <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
            {selectedClinic.clinicName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedClinic.facilityCode} · {selectedClinic.district}
          </p>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-md border border-border-subtle bg-bg-muted px-2 text-xs font-medium text-muted-foreground">
          <StethoscopeIcon className="size-3.5" />
          {selectedClinic.networkRole}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge status={selectedClinic.status} />
        <FreshnessBadge freshness={selectedClinic.freshness} />
        <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
          {formatLabel(selectedClinic.source)}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-2 rounded-md border border-primary/15 bg-primary/5 p-3 text-sm">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-normal text-primary">
              Capacity posture
            </span>
            <span className="rounded-md border border-primary/20 bg-bg-default px-2 py-0.5 text-xs font-medium text-primary">
              {selectedClinic.alternativeCapacity} alternatives
            </span>
          </div>
          <p className="leading-5 text-foreground">{selectedClinic.recommendedAction}</p>
        </div>
        <ProfileSection title="Verification need">
          <p className="text-sm leading-5 text-muted-foreground">
            {selectedClinic.verificationNeed}
          </p>
        </ProfileSection>
        <ProfileSection title="Routing alternatives">
          {selectedClinic.routingAlternatives.length ? (
            <div className="grid gap-2">
              {selectedClinic.routingAlternatives.map((alternative) => (
                <Link
                  key={alternative.clinicId}
                  className="group grid min-w-0 gap-2 rounded-md border border-border-subtle bg-bg-muted/60 p-2.5 text-left transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  href={alternative.clinicHref}
                >
                  <span className="flex min-w-0 items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {alternative.clinicName}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {alternative.facilityCode} · {alternative.distanceLabel}
                      </span>
                    </span>
                    <ArrowRightIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="flex min-w-0 flex-wrap gap-1.5">
                    <StatusBadge status={alternative.status} />
                    <FreshnessBadge freshness={alternative.freshness} />
                    <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {alternative.matchedService}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border-subtle p-3 text-sm leading-5 text-muted-foreground">
              No compatible alternative is currently routing-ready for the listed clinic services.
            </div>
          )}
        </ProfileSection>
        <ProfileSection title="Protected service">
          <p className="text-sm leading-5 text-foreground">
            Keep {selectedClinic.primaryService} coverage visible while district teams verify this
            node and its nearest alternatives.
          </p>
        </ProfileSection>
        <ProfileSection title="Clinic signal">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Primary service</dt>
              <dd className="mt-0.5 text-foreground">{selectedClinic.primaryService}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Alternative capacity</dt>
              <dd className="mt-0.5 text-foreground">
                {selectedClinic.alternativeCapacity} clinics
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Latest report</dt>
              <dd className="mt-0.5 text-foreground">
                {formatDateTime(selectedClinic.lastReportedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reporter</dt>
              <dd className="mt-0.5 text-foreground">{selectedClinic.reporterName}</dd>
            </div>
          </dl>
        </ProfileSection>
      </div>

      <div className="mt-4 border-t border-border-subtle pt-3">
        <Link
          className={cn(buttonVariants({ size: "sm" }), "w-full justify-between")}
          href={selectedClinic.clinicHref}
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPinIcon className="size-3.5" />
            Open clinic detail
          </span>
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
