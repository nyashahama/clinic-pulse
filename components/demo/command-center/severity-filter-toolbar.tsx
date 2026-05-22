"use client";

import type { ReactNode } from "react";
import { FilterIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminTone } from "@/components/product/admin-module";
import type { DistrictSeverityQueueFilters } from "@/lib/demo/district-severity-queue-view-model";
import { cn } from "@/lib/utils";

type SeverityFilterToolbarProps = {
  backendSignal: string;
  backendSignalTone: AdminTone;
  filters: DistrictSeverityQueueFilters;
  services: string[];
  visibleClinicCount: number;
  onClearFilters: () => void;
  onFilterChange: <Key extends keyof DistrictSeverityQueueFilters>(
    key: Key,
    value: DistrictSeverityQueueFilters[Key],
  ) => void;
};

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

const alertOptions = [
  { label: "All signals", value: "all" },
  { label: "Active alerts", value: "active" },
] satisfies FilterOption[];

const offlineOptions = [
  { label: "All queue states", value: "all" },
  { label: "Queued reports", value: "queued" },
] satisfies FilterOption[];

const signalClassName: Record<AdminTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

function selectedLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function activeFilterCount(filters: DistrictSeverityQueueFilters) {
  return Object.values(filters).filter((value) => value !== "all").length;
}

function ToolbarSignal({
  children,
  tone,
}: {
  children: ReactNode;
  tone: AdminTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full items-center rounded-md border px-2 text-xs font-medium",
        signalClassName[tone],
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
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
            "max-w-28 truncate rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 font-normal text-muted-foreground",
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

export function SeverityFilterToolbar({
  backendSignal,
  backendSignalTone,
  filters,
  onClearFilters,
  onFilterChange,
  services,
  visibleClinicCount,
}: SeverityFilterToolbarProps) {
  const serviceOptions = [
    { label: "All services", value: "all" },
    ...services.map((service) => ({ label: service, value: service })),
  ];
  const activeCount = activeFilterCount(filters);

  return (
    <section
      aria-label="Severity queue filters"
      className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm"
      data-district-severity-toolbar
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0">Queue filters</span>
            {activeCount ? (
              <span className="rounded-md border border-primary/25 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary">
                {activeCount} active
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <ToolbarSignal tone={visibleClinicCount ? "attention" : "info"}>
            {visibleClinicCount} clinics visible
          </ToolbarSignal>
          <ToolbarSignal tone={backendSignalTone}>{backendSignal}</ToolbarSignal>
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

        <div className="flex min-w-0 flex-wrap gap-2">
          <FacetedFilter
            label="Status"
            options={statusOptions}
            value={filters.status}
            onValueChange={(value) =>
              onFilterChange("status", value as DistrictSeverityQueueFilters["status"])
            }
          />
          <FacetedFilter
            label="Freshness"
            options={freshnessOptions}
            value={filters.freshness}
            onValueChange={(value) =>
              onFilterChange("freshness", value as DistrictSeverityQueueFilters["freshness"])
            }
          />
          <FacetedFilter
            label="Alert state"
            options={alertOptions}
            value={filters.alertState}
            onValueChange={(value) =>
              onFilterChange("alertState", value as DistrictSeverityQueueFilters["alertState"])
            }
          />
          <FacetedFilter
            label="Offline queue"
            options={offlineOptions}
            value={filters.offlineState}
            onValueChange={(value) =>
              onFilterChange("offlineState", value as DistrictSeverityQueueFilters["offlineState"])
            }
          />
          <FacetedFilter
            label="Service line"
            options={serviceOptions}
            value={filters.service}
            onValueChange={(value) => onFilterChange("service", value)}
          />
        </div>
      </div>
    </section>
  );
}
