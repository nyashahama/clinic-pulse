"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BellRingIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  FilterIcon,
  HistoryIcon,
  MapPinIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/demo/status-badge";
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
  DistrictClinicEvidenceFilters,
  DistrictClinicEvidenceMetric,
  DistrictClinicEvidencePacket,
  DistrictClinicEvidenceRow,
  DistrictClinicEvidenceTone,
  DistrictClinicEvidenceViewModel,
} from "@/lib/demo/district-clinic-evidence-view-model";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
};

const kindOptions = [
  { label: "All evidence", value: "all" },
  { label: "Reports", value: "report" },
  { label: "Audit events", value: "audit" },
  { label: "Alerts", value: "alert" },
] satisfies FilterOption[];

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Non functional", value: "non_functional" },
  { label: "Degraded", value: "degraded" },
  { label: "Unknown", value: "unknown" },
  { label: "Operational", value: "operational" },
] satisfies FilterOption[];

const sourceOptions = [
  { label: "All sources", value: "all" },
  { label: "Field worker", value: "field_worker" },
  { label: "Clinic coordinator", value: "clinic_coordinator" },
  { label: "Demo control", value: "demo_control" },
  { label: "Seed", value: "seed" },
  { label: "Audit log", value: "audit_log" },
  { label: "Alert", value: "alert" },
] satisfies FilterOption[];

const toneClassName: Record<DistrictClinicEvidenceTone, string> = {
  clear:
    "border-emerald-200/80 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200/80 bg-amber-50/50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-destructive/25 bg-destructive/5 text-destructive dark:border-destructive/40 dark:bg-destructive/15",
  info: "border-sky-200/80 bg-sky-50/50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-100",
};

const railClassName: Record<DistrictClinicEvidenceTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function selectedLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function activeFilterCount(filters: DistrictClinicEvidenceFilters) {
  return Object.values(filters).filter((value) => value !== "all" && value !== "").length;
}

function MetricIcon({ metric }: { metric: DistrictClinicEvidenceMetric }) {
  const className = "size-4";

  if (metric.label === "Field reports") {
    return <FileTextIcon className={className} />;
  }

  if (metric.label === "Audit chain") {
    return <HistoryIcon className={className} />;
  }

  if (metric.tone === "blocked") {
    return <AlertTriangleIcon className={className} />;
  }

  return <ShieldCheckIcon className={className} />;
}

function RowIcon({ row }: { row: DistrictClinicEvidenceRow }) {
  const className = "size-3.5";

  if (row.kind === "report") {
    return <FileTextIcon className={className} />;
  }

  if (row.kind === "alert") {
    return <BellRingIcon className={className} />;
  }

  return <HistoryIcon className={className} />;
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
              "h-8 w-full min-w-0 justify-between gap-2 border-dashed bg-bg-default px-2.5 text-xs sm:w-auto sm:justify-start",
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
            "max-w-36 truncate rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 font-normal text-muted-foreground",
            isActive && "border-primary/25 bg-background text-primary",
          )}
        >
          {labelForValue}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
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

export function ClinicEvidenceMetricStrip({
  metrics,
}: {
  metrics: DistrictClinicEvidenceViewModel["metrics"];
}) {
  return (
    <section
      aria-label="Clinic evidence metrics"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      data-district-clinic-evidence-metrics
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

export function ClinicEvidenceFilterToolbar({
  clinicOptions,
  filters,
  onClearFilters,
  onFilterChange,
  visibleEvidenceCount,
}: {
  clinicOptions: DistrictClinicEvidenceViewModel["filterOptions"]["clinics"];
  filters: DistrictClinicEvidenceFilters;
  onClearFilters: () => void;
  onFilterChange: <Key extends keyof DistrictClinicEvidenceFilters>(
    key: Key,
    value: DistrictClinicEvidenceFilters[Key],
  ) => void;
  visibleEvidenceCount: number;
}) {
  const activeCount = activeFilterCount(filters);
  const clinicFilterOptions = [
    { label: "All clinics", value: "all" },
    ...clinicOptions,
  ];

  return (
    <section
      aria-label="Clinic evidence filters"
      className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm"
      data-district-clinic-evidence-toolbar
    >
      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0">Evidence filters</span>
            {activeCount ? (
              <span className="rounded-md border border-primary/25 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary">
                {activeCount} active
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
            <span className="inline-flex h-7 max-w-full items-center rounded-md border border-sky-200 bg-sky-50 px-2 text-xs font-medium text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
              <span className="truncate">{visibleEvidenceCount} records visible</span>
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
            <span className="sr-only">Search clinic evidence</span>
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search clinic evidence"
              className="pl-8"
              placeholder="Search clinic, report, actor, or evidence"
              type="search"
              value={filters.query}
              onChange={(event) => onFilterChange("query", event.target.value)}
            />
          </label>
          <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap">
            <FacetedFilter
              label="Evidence type"
              options={kindOptions}
              value={filters.kind}
              onValueChange={(value) =>
                onFilterChange("kind", value as DistrictClinicEvidenceFilters["kind"])
              }
            />
            <FacetedFilter
              label="Status"
              options={statusOptions}
              value={filters.status}
              onValueChange={(value) =>
                onFilterChange("status", value as DistrictClinicEvidenceFilters["status"])
              }
            />
            <FacetedFilter
              label="Source"
              options={sourceOptions}
              value={filters.source}
              onValueChange={(value) =>
                onFilterChange("source", value as DistrictClinicEvidenceFilters["source"])
              }
            />
            <FacetedFilter
              label="Clinic"
              options={clinicFilterOptions}
              value={filters.clinic}
              onValueChange={(value) => onFilterChange("clinic", value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClinicEvidenceLedger({
  rows,
  selectedEvidenceId,
  onSelectEvidence,
}: {
  rows: DistrictClinicEvidenceViewModel["rows"];
  selectedEvidenceId: string | null;
  onSelectEvidence: (evidenceId: string) => void;
}) {
  return (
    <section
      aria-label="Clinic evidence ledger"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="hidden grid-cols-[minmax(14rem,1fr)_minmax(7rem,0.42fr)_minmax(8rem,0.5fr)] border-b border-border-subtle bg-bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-content-default sm:grid">
        <span>Evidence</span>
        <span>Signal</span>
        <span className="text-right">Recorded</span>
      </div>
      {rows.map((row) => {
        const isSelected = row.evidenceId === selectedEvidenceId;

        return (
          <button
            key={row.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${row.clinicName}, ${row.kind} evidence, ${row.title}`}
            data-district-clinic-evidence-row
            onClick={() => onSelectEvidence(row.evidenceId)}
            className={cn(
              "relative grid w-full min-w-0 gap-3 border-b border-border-subtle px-3 py-3 text-left last:border-b-0 hover:bg-bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:grid-cols-[minmax(14rem,1fr)_minmax(7rem,0.42fr)_minmax(8rem,0.5fr)]",
              isSelected && "bg-primary/5",
            )}
          >
            {isSelected ? (
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />
            ) : null}
            <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2.5">
              <span
                className={cn(
                  "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
                  toneClassName[row.tone],
                )}
                aria-hidden="true"
              >
                <RowIcon row={row} />
              </span>
              <span className="min-w-0">
                <span className="block break-words font-medium text-foreground">
                  {row.title}
                </span>
                <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                  {row.clinicName} · {row.facilityCode}
                </span>
              </span>
            </span>
            <span className="flex min-w-0 flex-wrap items-center gap-1.5 self-start">
              <StatusBadge className="shrink-0" status={row.status} />
              <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-border-subtle bg-bg-muted px-2 text-[11px] font-semibold capitalize tracking-normal text-muted-foreground">
                {formatLabel(row.kind)}
              </span>
            </span>
            <span className="grid justify-items-start gap-1 sm:justify-items-end">
              <span className="text-xs font-medium capitalize text-foreground">
                {formatLabel(row.source)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(row.occurredAt)}
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

function PacketSection({
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

export function ClinicEvidenceSelectedPacket({
  selectedPacket,
  timeline,
}: {
  selectedPacket: DistrictClinicEvidencePacket | null;
  timeline: DistrictClinicEvidenceViewModel["timeline"];
}) {
  if (!selectedPacket) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Selected evidence packet
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">No evidence selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Select a ledger row to inspect provenance, clinic context, and linked records.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm">
      <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Selected evidence packet
          </p>
          <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
            {selectedPacket.clinicName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedPacket.evidenceId} · {formatDateTime(selectedPacket.occurredAt)}
          </p>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-md border border-border-subtle bg-bg-muted px-2 text-xs font-medium capitalize text-muted-foreground">
          <ClipboardCheckIcon className="size-3.5" />
          {formatLabel(selectedPacket.kind)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge status={selectedPacket.status} />
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
            toneClassName[selectedPacket.tone],
          )}
        >
          {formatLabel(selectedPacket.source)}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-border-subtle border-l-2 border-l-primary bg-bg-muted/60 p-3">
        <div className="flex min-w-0 gap-2.5">
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/5 text-primary">
            <ActivityIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Evidence summary
            </p>
            <p className="mt-0.5 break-words text-sm font-medium leading-5 text-foreground">
              {selectedPacket.title}
            </p>
            <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">
              {selectedPacket.detail}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <PacketSection title="Recommended action">
          <p className="text-sm leading-5 text-foreground">
            {selectedPacket.recommendedAction}
          </p>
        </PacketSection>
        <PacketSection title="Verification need">
          <p className="text-sm leading-5 text-muted-foreground">
            {selectedPacket.verificationNeed}
          </p>
        </PacketSection>
        <PacketSection title="Provenance">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {selectedPacket.provenance.map((field) => (
              <div key={field.label}>
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="mt-0.5 break-words text-foreground">{field.value}</dd>
              </div>
            ))}
          </dl>
        </PacketSection>
        <PacketSection title="Clinic evidence timeline">
          <div className="grid gap-2">
            {timeline.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-md border border-border-subtle bg-bg-muted/55 p-2"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border",
                    toneClassName[item.tone],
                  )}
                >
                  <RowIcon row={item} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs capitalize text-muted-foreground">
                    {formatLabel(item.kind)} · {formatDateTime(item.occurredAt)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </PacketSection>
      </div>

      <div className="mt-4 grid gap-2 border-t border-border-subtle pt-3 sm:grid-cols-2">
        <Link
          className={cn(
            buttonVariants({
              size: "sm",
              variant: selectedPacket.reportHref ? "outline" : "default",
            }),
            "justify-between",
          )}
          href={selectedPacket.clinicHref}
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPinIcon className="size-3.5" />
            Open clinic detail
          </span>
          <ArrowRightIcon className="size-3.5" />
        </Link>
        {selectedPacket.reportHref ? (
          <Link
            className={cn(
              buttonVariants({ size: "sm" }),
              "justify-between",
            )}
            href={selectedPacket.reportHref}
          >
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <FileTextIcon className="size-3.5" />
              Open report evidence
            </span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
