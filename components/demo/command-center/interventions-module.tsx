"use client";

import Link from "next/link";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FilterIcon,
  HistoryIcon,
  MapPinIcon,
  RadioTowerIcon,
  RotateCcwIcon,
  RouteIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UserRoundCheckIcon,
} from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
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
  DistrictInterventionPlan,
  DistrictInterventionSelectedPlan,
  DistrictInterventionsFilters,
  DistrictInterventionsLens,
  DistrictInterventionsMetric,
  DistrictInterventionsStageLane,
  DistrictInterventionsTone,
  DistrictInterventionsViewModel,
} from "@/lib/demo/district-interventions-view-model";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
};
type InterventionPlanTabId = DistrictInterventionSelectedPlan["tabs"][number]["id"];

const stageOptions = [
  { label: "All stages", value: "all" },
  { label: "Routing", value: "routing" },
  { label: "Verification", value: "verification" },
  { label: "Proof due", value: "proof_due" },
  { label: "Monitoring", value: "monitoring" },
] satisfies FilterOption[];

const priorityOptions = [
  { label: "All priorities", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "Watch", value: "watch" },
  { label: "Attention", value: "attention" },
  { label: "Stable", value: "stable" },
] satisfies FilterOption[];

const toneClassName: Record<DistrictInterventionsTone, string> = {
  clear:
    "border-emerald-200/80 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200/80 bg-amber-50/50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-destructive/25 bg-destructive/5 text-destructive dark:border-destructive/40 dark:bg-destructive/15",
  info: "border-sky-200/80 bg-sky-50/50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-100",
};

const railClassName: Record<DistrictInterventionsTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function selectedLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function activeFilterCount(filters: DistrictInterventionsFilters) {
  return Object.values(filters).filter((value) => value !== "all" && value !== "").length;
}

function MetricIcon({ metric }: { metric: DistrictInterventionsMetric }) {
  const className = "size-4";

  if (metric.id === "routing_moves") {
    return <RouteIcon className={className} />;
  }

  if (metric.id === "evidence_due") {
    return <ClipboardCheckIcon className={className} />;
  }

  if (metric.id === "owner_load") {
    return <UserRoundCheckIcon className={className} />;
  }

  return <ActivityIcon className={className} />;
}

function ToneBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: DistrictInterventionsTone;
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

export function InterventionsCommandHeader({
  header,
}: {
  header: DistrictInterventionsViewModel["header"];
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default px-4 py-3 text-content-default shadow-sm sm:px-5">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="hidden text-xs font-medium uppercase tracking-normal text-muted-foreground sm:block">
            {header.eyebrow}
          </p>
          <h1 className="break-words text-xl font-semibold leading-tight text-foreground md:text-2xl">
            {header.title}
          </h1>
          <p className="mt-1 max-w-3xl break-words text-sm leading-5 text-muted-foreground">
            {header.description}
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end">
          <Link
            className={cn(buttonVariants({ size: "sm" }), "min-w-0 justify-between gap-2")}
            href={header.primaryAction.href}
          >
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <ActivityIcon className="size-3.5" />
              <span className="truncate sm:hidden">Queue</span>
              <span className="hidden truncate sm:inline">{header.primaryAction.label}</span>
            </span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
          <Link
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "min-w-0 justify-between gap-2",
            )}
            href={header.secondaryAction.href}
          >
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <ClipboardCheckIcon className="size-3.5" />
              <span className="truncate sm:hidden">Evidence</span>
              <span className="hidden truncate sm:inline">{header.secondaryAction.label}</span>
            </span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function InterventionsMetricStrip({
  metrics,
}: {
  metrics: DistrictInterventionsViewModel["metrics"];
}) {
  return (
    <section
      aria-label="Interventions metrics"
      className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4"
      data-district-interventions-metrics
    >
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <div className={cn("h-1", railClassName[metric.tone])} aria-hidden="true" />
          <div className="grid min-h-[5.35rem] gap-2 p-3 sm:min-h-[6rem] sm:gap-3 sm:p-4">
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
              <p className="font-mono text-[1.35rem] font-semibold leading-none text-foreground sm:text-[1.65rem]">
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

export function InterventionsFilterToolbar({
  filters,
  onClearFilters,
  onFilterChange,
  services,
  visiblePlanCount,
}: {
  filters: DistrictInterventionsFilters;
  onClearFilters: () => void;
  onFilterChange: <Key extends keyof DistrictInterventionsFilters>(
    key: Key,
    value: DistrictInterventionsFilters[Key],
  ) => void;
  services: string[];
  visiblePlanCount: number;
}) {
  const activeCount = activeFilterCount(filters);
  const serviceOptions = [
    { label: "All services", value: "all" },
    ...services.map((service) => ({ label: service, value: service })),
  ];

  return (
    <section
      aria-label="Intervention filters"
      className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm"
      data-district-interventions-toolbar
    >
      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0">Plan filters</span>
            {activeCount ? (
              <span className="rounded-md border border-primary/25 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary">
                {activeCount} active
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
            <span className="inline-flex h-7 max-w-full items-center rounded-md border border-sky-200 bg-sky-50 px-2 text-xs font-medium text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
              <span className="truncate">{visiblePlanCount} plans visible</span>
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
            <span className="sr-only">Search intervention plans</span>
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search intervention plans"
              className="pl-8"
              placeholder="Search clinic, owner, route, or service"
              type="search"
              value={filters.query}
              onChange={(event) => onFilterChange("query", event.target.value)}
            />
          </label>
          <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap">
            <FacetedFilter
              label="Stage"
              options={stageOptions}
              value={filters.lens}
              onValueChange={(value) =>
                onFilterChange("lens", value as DistrictInterventionsFilters["lens"])
              }
            />
            <FacetedFilter
              label="Priority"
              options={priorityOptions}
              value={filters.priority}
              onValueChange={(value) =>
                onFilterChange(
                  "priority",
                  value as DistrictInterventionsFilters["priority"],
                )
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

export function InterventionsStageLanes({
  lanes,
  onSelectLens,
  selectedLens,
}: {
  lanes: DistrictInterventionsStageLane[];
  onSelectLens: (lens: DistrictInterventionsLens) => void;
  selectedLens: DistrictInterventionsLens;
}) {
  return (
    <section
      aria-label="Intervention stage lanes"
      className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3"
    >
      {lanes.map((lane) => {
        const isActive = selectedLens === lane.id;

        return (
          <button
            key={lane.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectLens(lane.id)}
            className={cn(
              "min-w-0 rounded-lg border border-border-subtle bg-bg-default p-3 text-left text-content-default shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive && "border-primary/45 bg-primary/5",
            )}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-foreground">
                  {lane.label}
                </p>
                <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">
                  {lane.detail}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border px-2 font-mono text-xs font-semibold",
                  toneClassName[lane.tone],
                )}
              >
                {lane.count}
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}

export function InterventionsLedger({
  onSelectPlan,
  plans,
  selectedPlanId,
}: {
  onSelectPlan: (planId: string) => void;
  plans: DistrictInterventionPlan[];
  selectedPlanId: string | null;
}) {
  return (
    <section
      aria-label="Intervention plan ledger"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="hidden grid-cols-[minmax(15rem,1fr)_minmax(9rem,0.44fr)_minmax(10rem,0.5fr)] border-b border-border-subtle bg-bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-content-default sm:grid">
        <span>Plan</span>
        <span>Owner / proof</span>
        <span className="text-right">Route</span>
      </div>
      {plans.map((plan) => {
        const isSelected = plan.planId === selectedPlanId;

        return (
          <button
            key={plan.planId}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${plan.clinicName}, ${plan.stageLabel} intervention, ${plan.routePlan}`}
            data-district-interventions-row
            onClick={() => onSelectPlan(plan.planId)}
            className={cn(
              "relative grid w-full min-w-0 gap-3 border-b border-border-subtle px-3 py-3 text-left last:border-b-0 hover:bg-bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:grid-cols-[minmax(15rem,1fr)_minmax(9rem,0.44fr)_minmax(10rem,0.5fr)]",
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
                  toneClassName[plan.priority === "critical" ? "blocked" : plan.priority === "stable" ? "clear" : "attention"],
                )}
                aria-hidden="true"
              >
                <RouteIcon className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block break-words font-medium text-foreground">
                  {plan.clinicName}
                </span>
                <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                  {plan.facilityCode} · {plan.stageLabel} · score {plan.score}
                </span>
              </span>
            </span>
            <span className="grid min-w-0 gap-1 self-start">
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <ToneBadge tone={plan.proofTone}>{plan.proofStatus}</ToneBadge>
              </span>
              <span className="break-words text-xs text-muted-foreground">
                {plan.ownerLabel} · {formatDateTime(plan.updatedAt)}
              </span>
            </span>
            <span className="grid justify-items-start gap-1 sm:justify-items-end">
              <span className="break-words text-xs font-medium leading-4 text-foreground sm:text-right">
                {plan.routePlan}
              </span>
              <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-border-subtle bg-bg-muted px-2 text-[11px] font-semibold tracking-normal text-muted-foreground">
                {plan.services[0] ?? "Primary care"}
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

export function InterventionsSelectedPlan({
  onSelectPlan,
  selectedPlan,
}: {
  onSelectPlan: (planId: string) => void;
  selectedPlan: DistrictInterventionsViewModel["selectedPlan"];
}) {
  const [activeTabState, setActiveTabState] = useState<{
    planId: string | null;
    tab: InterventionPlanTabId;
  }>({ planId: null, tab: "decision" });
  const [stagedPlanId, setStagedPlanId] = useState<string | null>(null);

  if (!selectedPlan) {
    return (
      <section
        className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
        data-district-interventions-selected-plan
      >
        <p className="text-sm font-medium text-foreground">No intervention plan selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Select a visible intervention plan to review owner, route, proof, and timeline.
        </p>
      </section>
    );
  }

  const activeTab =
    activeTabState.planId === selectedPlan.planId ? activeTabState.tab : "decision";
  const planTone =
    selectedPlan.priority === "critical"
      ? "blocked"
      : selectedPlan.priority === "stable"
        ? "clear"
        : "attention";
  const tabIds = selectedPlan.tabs.map((tab) => tab.id);
  const selectTab = (tab: InterventionPlanTabId) => {
    setActiveTabState({ planId: selectedPlan.planId, tab });
  };
  const focusTab = (tab: InterventionPlanTabId) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`intervention-${selectedPlan.planId}-${tab}-tab`)?.focus();
    });
  };
  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tab: InterventionPlanTabId,
  ) => {
    const currentIndex = tabIds.indexOf(tab);
    const lastIndex = tabIds.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();

    const nextTab = tabIds[nextIndex];

    if (!nextTab) {
      return;
    }

    selectTab(nextTab);
    focusTab(nextTab);
  };

  return (
    <section
      aria-label="Selected intervention plan"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      data-district-interventions-selected-plan
    >
      <div className={cn("h-1", railClassName[planTone])} aria-hidden="true" />
      <div className="grid gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Selected intervention plan
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
              {selectedPlan.clinicName}
            </h2>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
              {selectedPlan.title}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <ToneBadge tone={planTone}>
              {selectedPlan.priority} {selectedPlan.score}
            </ToneBadge>
            <ToneBadge tone={selectedPlan.proofTone}>{selectedPlan.stageLabel}</ToneBadge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {selectedPlan.actions.map((action) =>
            action.href ? (
              <Link
                key={action.id}
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "min-w-0 justify-between gap-2",
                )}
                href={action.href}
              >
                <span className="truncate">{action.label}</span>
                <ArrowRightIcon className="size-3.5" />
              </Link>
            ) : (
              <Button
                key={action.id}
                className="min-w-0 justify-between gap-2"
                onClick={() => setStagedPlanId(selectedPlan.planId)}
                size="sm"
                type="button"
              >
                <span className="truncate">{action.label}</span>
                <CheckCircle2Icon className="size-3.5" />
              </Button>
            ),
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Button
            aria-label="Previous intervention plan"
            className="h-8 justify-start gap-1.5 px-2 text-xs"
            disabled={!selectedPlan.navigation.previousPlanId}
            onClick={() => {
              if (selectedPlan.navigation.previousPlanId) {
                onSelectPlan(selectedPlan.navigation.previousPlanId);
              }
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeftIcon className="size-3.5" />
            Previous
          </Button>
          <span className="inline-flex h-8 min-w-0 items-center justify-center rounded-md border border-border-subtle bg-bg-muted px-2 text-xs font-medium text-muted-foreground">
            Plan {selectedPlan.navigation.position} of {selectedPlan.navigation.total}
          </span>
          <Button
            aria-label="Next intervention plan"
            className="h-8 justify-end gap-1.5 px-2 text-xs"
            disabled={!selectedPlan.navigation.nextPlanId}
            onClick={() => {
              if (selectedPlan.navigation.nextPlanId) {
                onSelectPlan(selectedPlan.navigation.nextPlanId);
              }
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Next
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>

        {stagedPlanId === selectedPlan.planId ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100">
            Plan staged for this intervention.
          </p>
        ) : null}

        <div
          aria-label="Intervention plan sections"
          className="grid grid-cols-4 gap-1 rounded-lg border border-border-subtle bg-bg-muted/40 p-1"
          role="tablist"
        >
          {selectedPlan.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`intervention-${selectedPlan.planId}-${tab.id}`}
              id={`intervention-${selectedPlan.planId}-${tab.id}-tab`}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={cn(
                "min-h-8 rounded-md px-2 text-xs font-medium text-muted-foreground transition hover:bg-bg-default hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === tab.id && "bg-bg-default text-foreground shadow-sm",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`intervention-${selectedPlan.planId}-decision`}
          aria-labelledby={`intervention-${selectedPlan.planId}-decision-tab`}
          hidden={activeTab !== "decision"}
          className="grid gap-3"
        >
          {selectedPlan.decisionSummary.map((item) => (
            <div
              key={item.label}
              className={cn("rounded-lg border p-3", toneClassName[item.tone])}
            >
              <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
                {item.label}
              </p>
              <p className="mt-1 break-words text-sm font-semibold">{item.value}</p>
              <p className="mt-1 break-words text-xs leading-4 opacity-80">{item.detail}</p>
            </div>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`intervention-${selectedPlan.planId}-route`}
          aria-labelledby={`intervention-${selectedPlan.planId}-route-tab`}
          hidden={activeTab !== "route"}
          className="grid gap-3"
        >
          <div className="rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
            <p className="text-sm font-semibold text-foreground">{selectedPlan.routePlan}</p>
            <p className="mt-1 text-xs leading-4 text-muted-foreground">
              {selectedPlan.expectedOutcome}
            </p>
          </div>
          {selectedPlan.routeOptions.map((option) => (
            <Link
              key={option.clinicId}
              className="grid gap-1 rounded-lg border border-border-subtle p-3 text-sm hover:bg-bg-muted/50"
              href={option.clinicHref}
            >
              <span className="font-medium text-foreground">{option.clinicName}</span>
              <span className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <StatusBadge status={option.status} />
                <FreshnessBadge freshness={option.freshness} />
                <span>{option.service}</span>
              </span>
            </Link>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`intervention-${selectedPlan.planId}-proof`}
          aria-labelledby={`intervention-${selectedPlan.planId}-proof-tab`}
          hidden={activeTab !== "proof"}
          className="rounded-lg border border-border-subtle bg-bg-muted/35 p-3"
        >
          <p className="text-sm font-semibold text-foreground">{selectedPlan.proofStatus}</p>
          <p className="mt-1 text-xs leading-4 text-muted-foreground">
            {selectedPlan.verificationNeed}
          </p>
        </div>

        <div
          role="tabpanel"
          id={`intervention-${selectedPlan.planId}-timeline`}
          aria-labelledby={`intervention-${selectedPlan.planId}-timeline-tab`}
          hidden={activeTab !== "timeline"}
          className="grid gap-2"
        >
          {selectedPlan.timeline.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-lg border border-border-subtle p-3"
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex size-7 items-center justify-center rounded-md border",
                  toneClassName[item.tone],
                )}
                aria-hidden="true"
              >
                {item.label === "Audit" ? (
                  <HistoryIcon className="size-3.5" />
                ) : item.label === "Alert" ? (
                  <RadioTowerIcon className="size-3.5" />
                ) : (
                  <MapPinIcon className="size-3.5" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {item.label} · {formatDateTime(item.occurredAt)}
                </span>
                <span className="mt-1 block break-words text-sm font-medium text-foreground">
                  {item.title}
                </span>
                <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                  {item.detail}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
