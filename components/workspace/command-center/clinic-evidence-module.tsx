"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BellRingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  DistrictClinicEvidenceFilters,
  DistrictClinicEvidenceMetric,
  DistrictClinicEvidencePacket,
  DistrictClinicEvidenceQueueChip,
  DistrictClinicEvidenceQueueFilter,
  DistrictClinicEvidenceRow,
  DistrictClinicEvidenceTone,
  DistrictClinicEvidenceViewModel,
} from "@/lib/workspace/district-clinic-evidence-view-model";
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
  { label: "Scenario control", value: "scenario_control" },
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

const readinessAccentClassName: Record<DistrictClinicEvidenceTone, string> = {
  clear: "border-l-emerald-400 dark:border-l-emerald-700",
  attention: "border-l-amber-400 dark:border-l-amber-700",
  blocked: "border-l-destructive",
  info: "border-l-sky-400 dark:border-l-sky-700",
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

function ToneBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: DistrictClinicEvidenceTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-start rounded-md border px-2 py-0.5 text-left text-xs font-medium",
        toneClassName[tone],
      )}
    >
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

function QueueChip({
  chip,
  onSelect,
}: {
  chip: DistrictClinicEvidenceQueueChip;
  onSelect: (queue: DistrictClinicEvidenceQueueFilter) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={chip.isActive}
      onClick={() => onSelect(chip.id)}
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        toneClassName[chip.tone],
        chip.isActive && "ring-2 ring-ring ring-offset-2",
      )}
    >
      <span>{chip.label}</span>
      <span className="font-mono">{chip.count}</span>
    </button>
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

export function ClinicEvidenceCommandHeader({
  header,
}: {
  header: DistrictClinicEvidenceViewModel["header"];
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-l-2 border-border-subtle bg-bg-default px-3 py-2 text-content-default shadow-sm sm:px-4 sm:py-3",
        readinessAccentClassName[header.readiness.tone],
      )}
    >
      <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="hidden text-xs font-semibold uppercase tracking-normal text-muted-foreground sm:block">
              {header.eyebrow}
            </p>
            <ToneBadge tone="info">{header.scope}</ToneBadge>
          </div>
          <h1 className="mt-1 break-words text-base font-semibold leading-tight text-foreground sm:text-2xl">
            {header.title}
          </h1>
          <p className="mt-1 hidden max-w-3xl break-words text-sm leading-5 text-muted-foreground sm:block">
            {header.description}
          </p>
        </div>
        <div className="grid min-w-0 gap-2 lg:min-w-[25rem] lg:justify-items-end">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-2 lg:max-w-[25rem]">
            <p className="font-mono text-2xl font-semibold leading-none text-foreground sm:text-3xl">
              {header.readiness.value}
            </p>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {header.readiness.label}
              </p>
              <p className="mt-0.5 hidden max-w-sm break-words text-xs leading-4 text-muted-foreground sm:mt-1 sm:block">
                {header.readiness.detail}
              </p>
            </div>
          </div>
          <div className="grid w-full min-w-0 grid-cols-2 gap-2 lg:max-w-[25rem]">
            <Link
              aria-label={header.primaryAction.label}
              className={cn(buttonVariants({ size: "sm" }), "min-w-0 justify-between gap-2")}
              href={header.primaryAction.href}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <ActivityIcon className="size-3.5" />
                <span className="truncate sm:hidden">Severity queue</span>
                <span className="hidden truncate sm:inline">{header.primaryAction.label}</span>
              </span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
            <Link
              aria-label={header.secondaryAction.label}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "min-w-0 justify-between gap-2",
              )}
              href={header.secondaryAction.href}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPinIcon className="size-3.5" />
                <span className="truncate sm:hidden">Clinic network</span>
                <span className="hidden truncate sm:inline">{header.secondaryAction.label}</span>
              </span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
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
  embedded = false,
  filters,
  onClearFilters,
  onFilterChange,
  visibleEvidenceCount,
}: {
  clinicOptions: DistrictClinicEvidenceViewModel["filterOptions"]["clinics"];
  embedded?: boolean;
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
      className={cn(
        "p-3 text-content-default",
        embedded
          ? "border-t border-border-subtle bg-bg-muted/25"
          : "rounded-lg border border-border-subtle bg-bg-default shadow-sm",
      )}
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

        <div className="grid min-w-0 gap-2">
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

export function ClinicEvidenceReviewQueue({
  children,
  onQueueChange,
  queue,
}: {
  children: ReactNode;
  onQueueChange: (queue: DistrictClinicEvidenceQueueFilter) => void;
  queue: DistrictClinicEvidenceViewModel["queue"];
}) {
  return (
    <section
      aria-label={queue.title}
      className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Evidence workspace
            </p>
            <h2 className="mt-1 break-words text-base font-semibold text-foreground">
              {queue.title}
            </h2>
            <p className="mt-1 max-w-2xl break-words text-sm leading-5 text-muted-foreground">
              {queue.description}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            {queue.chips.slice(0, 2).map((chip) => (
              <QueueChip chip={chip} key={chip.id} onSelect={onQueueChange} />
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2" aria-label="Evidence queue mix">
          {queue.chips.slice(2).map((chip) => (
            <QueueChip chip={chip} key={chip.id} onSelect={onQueueChange} />
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ClinicEvidenceLedger({
  embedded = false,
  rows,
  selectedEvidenceId,
  onSelectEvidence,
}: {
  embedded?: boolean;
  rows: DistrictClinicEvidenceViewModel["rows"];
  selectedEvidenceId: string | null;
  onSelectEvidence: (evidenceId: string) => void;
}) {
  return (
    <section
      aria-label="Clinic evidence ledger"
      className={cn(
        "overflow-hidden bg-bg-default text-content-default",
        embedded
          ? "border-t border-border-subtle"
          : "rounded-lg border border-border-subtle shadow-sm",
      )}
    >
      <div className="hidden grid-cols-[minmax(14rem,1fr)_minmax(8rem,0.44fr)_minmax(8rem,0.42fr)] border-b border-border-subtle bg-bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-content-default sm:grid">
        <span>Evidence</span>
        <span>Owner / age</span>
        <span className="text-right">Next action</span>
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
              "relative grid w-full min-w-0 gap-3 border-b border-border-subtle px-3 py-3 text-left last:border-b-0 hover:bg-bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:grid-cols-[minmax(14rem,1fr)_minmax(8rem,0.44fr)_minmax(8rem,0.42fr)]",
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
            <span className="grid min-w-0 gap-1 self-start">
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <StatusBadge className="shrink-0" status={row.status} />
                <span
                  className={cn(
                    "inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-[11px] font-semibold tracking-normal",
                    toneClassName[row.tone],
                  )}
                >
                  {row.operatorSignal}
                </span>
              </span>
              <span className="break-words text-xs text-muted-foreground">
                {row.ownerLabel} · {row.recordedLabel}
              </span>
            </span>
            <span className="grid justify-items-start gap-1 sm:justify-items-end">
              <span className="text-xs font-medium text-foreground">
                {row.actionLabel}
              </span>
              <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-border-subtle bg-bg-muted px-2 text-[11px] font-semibold capitalize tracking-normal text-muted-foreground">
                {formatLabel(row.kind)}
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

type PacketProperty = {
  detail?: ReactNode;
  label: ReactNode;
  tone?: DistrictClinicEvidenceTone;
  value: ReactNode;
};

function PacketPropertyTable({
  compact = false,
  items,
}: {
  compact?: boolean;
  items: PacketProperty[];
}) {
  return (
    <dl className="divide-y divide-border-subtle border-y border-border-subtle">
      {items.map((item, index) => (
        <div
          className={cn(
            "grid min-w-0 gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-3",
            compact ? "py-1.5 sm:py-2" : "py-2",
          )}
          key={index}
        >
          <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0">
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              {item.tone ? (
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", railClassName[item.tone])}
                />
              ) : null}
              <span className="min-w-0 break-words text-sm font-medium leading-5 text-foreground">
                {item.value}
              </span>
            </span>
            {item.detail ? (
              <span
                className={cn(
                  "mt-0.5 break-words text-xs leading-4 text-muted-foreground",
                  compact ? "hidden sm:block" : "block",
                )}
              >
                {item.detail}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PacketTraceList({
  trace,
}: {
  trace: DistrictClinicEvidencePacket["trace"];
}) {
  return (
    <ol className="divide-y divide-border-subtle border-y border-border-subtle">
      {trace.map((step, index) => (
        <li
          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2.5 py-2"
          key={step.id}
        >
          <span
            className={cn(
              "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border bg-bg-default font-mono text-[11px] font-semibold",
              toneClassName[step.tone],
            )}
          >
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {step.label}
              </span>
              <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                {step.title}
              </span>
            </span>
            <span className="mt-0.5 block break-words text-xs leading-4 text-muted-foreground">
              {step.detail}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

type PacketTab = "decision" | "trace" | "context" | "timeline";

const packetTabs: Array<{ id: PacketTab; label: string }> = [
  { id: "decision", label: "Decision" },
  { id: "trace", label: "Trace" },
  { id: "context", label: "Context" },
  { id: "timeline", label: "Timeline" },
];

const decisionActionShortLabel: Record<
  DistrictClinicEvidencePacket["decisionActions"][number]["id"],
  string
> = {
  assign_owner: "Owner",
  confirm_signal: "Stage",
  protect_route: "Route",
};

export function ClinicEvidenceSelectedPacket({
  onSelectEvidence,
  selectedPacket,
  timeline,
}: {
  onSelectEvidence: (evidenceId: string) => void;
  selectedPacket: DistrictClinicEvidencePacket | null;
  timeline: DistrictClinicEvidenceViewModel["timeline"];
}) {
  const [activeTabState, setActiveTabState] = useState<{
    evidenceId: string;
    tab: PacketTab;
  } | null>(null);
  const [stagedDecisionState, setStagedDecisionState] = useState<{
    actionId: string;
    evidenceId: string;
  } | null>(null);

  if (!selectedPacket) {
    return (
      <section
        className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
        data-district-clinic-evidence-selected-packet
      >
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

  const activeTab =
    activeTabState?.evidenceId === selectedPacket.evidenceId
      ? activeTabState.tab
      : "decision";
  const stagedDecisionId =
    stagedDecisionState?.evidenceId === selectedPacket.evidenceId
      ? stagedDecisionState.actionId
      : null;

  return (
    <section
      className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm"
      data-district-clinic-evidence-selected-packet
    >
      <div className="flex min-w-0 items-start justify-between gap-2.5">
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
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border-subtle bg-bg-muted px-2 text-xs font-medium capitalize text-muted-foreground">
          <ClipboardCheckIcon className="size-3.5" />
          {formatLabel(selectedPacket.kind)}
        </span>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5">
        <StatusBadge status={selectedPacket.status} />
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
            toneClassName[selectedPacket.tone],
          )}
        >
          {formatLabel(selectedPacket.source)}
        </span>
        <span className="ml-auto inline-flex h-7 items-center rounded-md border border-border-subtle bg-bg-muted px-2 font-mono text-xs text-muted-foreground">
          {selectedPacket.navigation.position}/{selectedPacket.navigation.total}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Button
          className="h-8 justify-start gap-1.5 px-2 text-xs"
          disabled={!selectedPacket.navigation.previousEvidenceId}
          onClick={() => {
            if (selectedPacket.navigation.previousEvidenceId) {
              onSelectEvidence(selectedPacket.navigation.previousEvidenceId);
            }
          }}
          size="sm"
          variant="outline"
        >
          <ChevronLeftIcon className="size-3.5" />
          Previous
        </Button>
        <span className="text-xs font-medium text-muted-foreground">Packet</span>
        <Button
          className="h-8 justify-end gap-1.5 px-2 text-xs"
          disabled={!selectedPacket.navigation.nextEvidenceId}
          onClick={() => {
            if (selectedPacket.navigation.nextEvidenceId) {
              onSelectEvidence(selectedPacket.navigation.nextEvidenceId);
            }
          }}
          size="sm"
          variant="outline"
        >
          Next
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>

      <div
        className="mt-3 grid grid-cols-4 gap-1 rounded-md border border-border-subtle bg-bg-muted p-1"
        role="tablist"
        aria-label="Evidence packet sections"
      >
        {packetTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`clinic-evidence-${tab.id}-panel`}
            id={`clinic-evidence-${tab.id}-tab`}
            onClick={() =>
              setActiveTabState({
                evidenceId: selectedPacket.evidenceId,
                tab: tab.id,
              })
            }
            className={cn(
              "min-w-0 rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-bg-default hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === tab.id && "bg-bg-default text-foreground shadow-sm",
            )}
          >
            <span className="block truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3">
        <div
          id="clinic-evidence-decision-panel"
          role="tabpanel"
          aria-labelledby="clinic-evidence-decision-tab"
          hidden={activeTab !== "decision"}
          className="grid gap-3"
        >
          <div
            className={cn(
              "rounded-md border border-border-subtle border-l-2 bg-bg-muted/60 p-2.5",
              selectedPacket.actionTone === "blocked" && "border-l-destructive",
              selectedPacket.actionTone === "attention" &&
                "border-l-amber-400 dark:border-l-amber-700",
              selectedPacket.actionTone === "clear" &&
                "border-l-emerald-400 dark:border-l-emerald-700",
              selectedPacket.actionTone === "info" &&
                "border-l-sky-400 dark:border-l-sky-700",
            )}
          >
            <div className="flex min-w-0 gap-2.5">
              <span
                className={cn(
                  "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border",
                  toneClassName[selectedPacket.actionTone],
                )}
              >
                <ActivityIcon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Next evidence action
                </p>
                <p className="mt-0.5 break-words text-sm font-medium leading-5 text-foreground">
                  {selectedPacket.recommendedAction}
                </p>
              </div>
            </div>
          </div>
          <PacketSection title="Decision actions">
            <div
              className="grid grid-cols-3 gap-2"
              data-district-clinic-evidence-decision-actions
            >
              {selectedPacket.decisionActions.map((action) => {
                const isPrimary = action.id === "confirm_signal";
                const content = (
                  <>
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <ShieldCheckIcon className="size-3.5" />
                      <span className="truncate">{decisionActionShortLabel[action.id]}</span>
                    </span>
                    {action.href ? (
                      <ArrowRightIcon className="hidden size-3.5 sm:block" />
                    ) : null}
                  </>
                );

                return (
                  <div
                    className={cn(
                      "grid min-w-0 gap-1 rounded-md border p-1.5 sm:p-2",
                      toneClassName[action.tone],
                    )}
                    key={action.id}
                  >
                    {action.href ? (
                      <Link
                        aria-label={action.label}
                        className={cn(
                          buttonVariants({
                            size: "sm",
                            variant: isPrimary ? "default" : "outline",
                          }),
                          "min-w-0 justify-between",
                        )}
                        href={action.href}
                      >
                        {content}
                      </Link>
                    ) : (
                      <Button
                        aria-label={action.label}
                        className="min-w-0 justify-between"
                        onClick={() =>
                          setStagedDecisionState({
                            actionId: action.id,
                            evidenceId: selectedPacket.evidenceId,
                          })
                        }
                        size="sm"
                        variant={isPrimary ? "default" : "outline"}
                      >
                        {content}
                      </Button>
                    )}
                    <p className="hidden break-words text-xs leading-4 text-current/75 sm:block">
                      {action.detail}
                    </p>
                  </div>
                );
              })}
            </div>
            {stagedDecisionId ? (
              <p
                className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
                data-district-clinic-evidence-decision-state
              >
                Decision staged for this packet.
              </p>
            ) : null}
          </PacketSection>
          <PacketSection title="Decision summary">
            <div data-district-clinic-evidence-decision-summary>
              <PacketPropertyTable compact items={selectedPacket.decisionSummary} />
            </div>
          </PacketSection>
        </div>
        <div
          id="clinic-evidence-trace-panel"
          role="tabpanel"
          aria-labelledby="clinic-evidence-trace-tab"
          hidden={activeTab !== "trace"}
        >
          <PacketSection title="Evidence trace">
            <PacketTraceList trace={selectedPacket.trace} />
          </PacketSection>
        </div>
        <div
          id="clinic-evidence-context-panel"
          role="tabpanel"
          aria-labelledby="clinic-evidence-context-tab"
          hidden={activeTab !== "context"}
        >
          <PacketSection title="Evidence context">
            <PacketPropertyTable
              items={[
                {
                  detail: selectedPacket.detail,
                  label: "Summary",
                  tone: selectedPacket.tone,
                  value: selectedPacket.title,
                },
                {
                  detail: selectedPacket.verificationNeed,
                  label: "Verification",
                  tone: selectedPacket.status === "operational" ? "clear" : selectedPacket.tone,
                  value:
                    selectedPacket.status === "operational"
                      ? "Audit-ready"
                      : "Clinic owner confirmation",
                },
                ...selectedPacket.provenance,
              ]}
            />
          </PacketSection>
        </div>
        <div
          id="clinic-evidence-timeline-panel"
          role="tabpanel"
          aria-labelledby="clinic-evidence-timeline-tab"
          hidden={activeTab !== "timeline"}
        >
          <PacketSection title="Clinic evidence timeline">
            <p className="mb-2 text-xs leading-4 text-muted-foreground">
              {selectedPacket.timelineSummary}
            </p>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {timeline.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 py-2"
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border bg-bg-default",
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
