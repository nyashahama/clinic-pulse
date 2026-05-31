"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  GitBranchIcon,
  InboxIcon,
  RadioTowerIcon,
  RouteIcon,
} from "lucide-react";

import type { AdminTone } from "@/components/product/admin-module";
import type { DataIngestionSummaryMetric } from "@/components/product/data-ingestion-workspace";
import { cn } from "@/lib/utils";

export type DataIngestionPipelineStage = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
  href: string;
  actionLabel: string;
};

export type DataIngestionPipelineRun = {
  id: string;
  signal: string;
  value: string;
  evidence: string;
  tone: AdminTone;
  windowLabel: string;
};

export type DataIngestionPipelineAction = {
  label: string;
  href: string;
  priority: "primary" | "secondary";
};

export type DataIngestionStageTriageItem = {
  id: string;
  stageId: string;
  title: string;
  detail: string;
  evidenceLabel: string;
  actionLabel: string;
  href: string;
  tone: AdminTone;
};

type DataIngestionPipelineMonitorProps = {
  title: string;
  statusLabel: string;
  statusTone: AdminTone;
  rowCountLabel: string;
  blockerLabel: string;
  blockerTone: AdminTone;
  metrics: DataIngestionSummaryMetric[];
  pipelineStages: DataIngestionPipelineStage[];
  triageItems: DataIngestionStageTriageItem[];
  runs: DataIngestionPipelineRun[];
  actions: DataIngestionPipelineAction[];
};

const toneBadgeClassName: Record<AdminTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

const toneSurfaceClassName: Record<AdminTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50/55 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-destructive/35 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50/55 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100",
};

const toneRailClassName: Record<AdminTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

function ingestionMetricHref(id: string) {
  if (id === "coverage-readiness") {
    return "/admin/reporting-coverage";
  }

  if (id === "pending-report-evidence" || id === "offline-queue" || id === "validation-failures") {
    return "#data-ingestion-workspace";
  }

  return "/admin/data-ingestion";
}

function ingestionMetricActionLabel(id: string) {
  if (id === "coverage-readiness") {
    return "Review coverage";
  }

  if (id === "pending-report-evidence") {
    return "Open ledger";
  }

  if (id === "offline-queue") {
    return "Review queue";
  }

  if (id === "validation-failures") {
    return "Review failures";
  }

  return "Open ingestion";
}

function IngestionMetricIcon({ id }: { id: string }) {
  const className = "size-4";

  if (id === "coverage-readiness") {
    return <CheckCircle2Icon className={className} />;
  }

  if (id === "pending-report-evidence") {
    return <InboxIcon className={className} />;
  }

  if (id === "offline-queue") {
    return <RadioTowerIcon className={className} />;
  }

  if (id === "validation-failures") {
    return <AlertTriangleIcon className={className} />;
  }

  return <ActivityIcon className={className} />;
}

function ToneBadge({ children, tone }: { children: string; tone: AdminTone }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-start rounded-md border px-2 py-0.5 text-left text-xs font-medium",
        toneBadgeClassName[tone],
      )}
    >
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

type SelectedPipelineItem = {
  id: string;
  stageId: string;
  kind: "stage" | "run";
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
  href: string;
  actionLabel: string;
  metadataLabel: string;
};

function toSelectedStage(stage: DataIngestionPipelineStage): SelectedPipelineItem {
  return {
    id: `stage-${stage.id}`,
    stageId: stage.id,
    kind: "stage",
    label: stage.label,
    value: stage.value,
    detail: stage.detail,
    tone: stage.tone,
    href: stage.href,
    actionLabel: stage.actionLabel,
    metadataLabel: "Pipeline stage",
  };
}

function stageIdForRun(runId: string) {
  if (runId === "validation-failures" || runId === "conflicts") {
    return "validation-gate";
  }

  if (runId === "freshness") {
    return "coverage-promotion";
  }

  if (runId === "offline-queue") {
    return "offline-queue";
  }

  return "field-report-intake";
}

function toSelectedRun(run: DataIngestionPipelineRun): SelectedPipelineItem {
  return {
    id: `run-${run.id}`,
    stageId: stageIdForRun(run.id),
    kind: "run",
    label: run.signal,
    value: run.value,
    detail: run.evidence,
    tone: run.tone,
    href: "#data-ingestion-workspace",
    actionLabel: "Open ledger",
    metadataLabel: `Window opened ${run.windowLabel}`,
  };
}

export function DataIngestionPipelineMonitor({
  title,
  statusLabel,
  statusTone,
  rowCountLabel,
  blockerLabel,
  blockerTone,
  metrics,
  pipelineStages,
  triageItems,
  runs,
  actions,
}: DataIngestionPipelineMonitorProps) {
  const selectedItems = useMemo(
    () => [...pipelineStages.map(toSelectedStage), ...runs.map(toSelectedRun)],
    [pipelineStages, runs],
  );
  const defaultSelectedId =
    selectedItems.find((item) => item.tone === "blocked" || item.tone === "attention")?.id ??
    selectedItems[0]?.id ??
    null;
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  const [reviewedStageIds, setReviewedStageIds] = useState<string[]>([]);
  const selectedItem =
    selectedItems.find((item) => item.id === selectedId) ?? selectedItems[0] ?? null;
  const activeStage =
    pipelineStages.find((stage) => stage.id === selectedItem?.stageId) ?? pipelineStages[0] ?? null;
  const activeTriageItems = activeStage
    ? triageItems.filter((item) => item.stageId === activeStage.id)
    : [];
  const activeStageReviewed = activeStage
    ? reviewedStageIds.includes(activeStage.id)
    : false;

  function markActiveStageReviewed() {
    if (!activeStage || activeStageReviewed) {
      return;
    }

    setReviewedStageIds((current) => [...current, activeStage.id]);
  }

  return (
    <>
      <section
        aria-label="Ingestion pipeline monitor"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="grid min-w-0 content-start gap-5 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Platform ingestion
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-3 max-w-4xl break-words text-sm leading-6 text-muted-foreground">
                Follow field reports, offline sync, validation, and coverage promotion as a
                pipeline before trusting downstream tenant health.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ToneBadge tone={statusTone}>{statusLabel}</ToneBadge>
                <ToneBadge tone="info">{rowCountLabel}</ToneBadge>
                <ToneBadge tone={blockerTone}>{blockerLabel}</ToneBadge>
              </div>
            </div>

            {activeStage ? (
              <div
                aria-label="Active ingestion issue"
                className={cn(
                  "sticky top-3 z-10 grid min-w-0 gap-3 rounded-lg border p-3 shadow-sm md:static md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:shadow-none",
                  toneSurfaceClassName[activeStage.tone],
                )}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-normal text-current/70">
                    Active issue
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold leading-tight">
                    {activeStage.label}
                  </p>
                  <p className="mt-1 break-words text-xs leading-4 text-current/75">
                    {activeTriageItems.length
                      ? `${activeTriageItems.length} affected records pinned for review`
                      : "No ledger rows are queued for this lane"}
                  </p>
                </div>
                <Link
                  className="inline-flex w-fit items-center gap-1 rounded-md bg-bg-default/80 px-3 py-1.5 text-xs font-semibold text-current shadow-sm transition hover:bg-bg-default"
                  href={activeStage.href}
                >
                  {activeStage.actionLabel}
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
            ) : null}

            <section aria-label="Source pipeline map" className="grid min-w-0 gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <GitBranchIcon className="size-4 shrink-0 text-muted-foreground" />
                <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                  Source pipeline map
                </h2>
              </div>
              <div className="grid gap-2 lg:grid-cols-4">
                {pipelineStages.map((stage, index) => {
                  const selected = selectedItem?.id === `stage-${stage.id}`;

                  return (
                    <button
                      aria-label={`Inspect pipeline stage ${stage.label}`}
                      aria-pressed={selected}
                      className={cn(
                        "group relative min-w-0 rounded-lg border p-3 text-left transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                        toneSurfaceClassName[stage.tone],
                        selected && "ring-2 ring-ring/45",
                      )}
                      key={stage.id}
                      onClick={() => setSelectedId(`stage-${stage.id}`)}
                      type="button"
                    >
                      <span
                        className={cn("absolute inset-x-0 top-0 h-1", toneRailClassName[stage.tone])}
                        aria-hidden="true"
                      />
                      <div className="flex min-w-0 items-start justify-between gap-3 pt-1">
                        <div className="min-w-0">
                          <p className="break-words text-xs font-semibold uppercase tracking-normal text-current/70">
                            {index + 1}. {stage.label}
                          </p>
                          <p className="mt-2 break-words text-2xl font-semibold leading-tight">
                            {stage.value}
                          </p>
                        </div>
                        <RouteIcon className="size-4 shrink-0 text-current/70" aria-hidden="true" />
                      </div>
                      <p className="mt-2 break-words text-xs leading-4 text-current/75">
                        {stage.detail}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              aria-label="Stage triage queue"
              className="grid min-w-0 gap-3 rounded-lg border border-border-subtle bg-bg-muted/25 p-3"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Stage triage queue
                  </p>
                  <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
                    {activeStage?.label ?? "No active stage"}
                  </h2>
                  <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">
                    {activeTriageItems.length
                      ? `${activeTriageItems.length} records are linked to the selected pipeline lane.`
                      : "This lane has no ledger rows queued right now."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {activeStageReviewed ? (
                    <ToneBadge tone="clear">Reviewed for this session</ToneBadge>
                  ) : null}
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-border-subtle bg-bg-default px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={!activeStage}
                    onClick={markActiveStageReviewed}
                    type="button"
                  >
                    Mark stage reviewed
                  </button>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {activeTriageItems.length ? (
                  activeTriageItems.slice(0, 3).map((item) => (
                    <article
                      className={cn("min-w-0 rounded-lg border p-3", toneSurfaceClassName[item.tone])}
                      key={item.id}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 break-words text-xs font-medium text-current/70">
                            {item.evidenceLabel}
                          </p>
                        </div>
                        <span
                          className={cn("mt-1 size-2.5 shrink-0 rounded-full", toneRailClassName[item.tone])}
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-2 break-words text-xs leading-4 text-current/75">
                        {item.detail}
                      </p>
                      <Link
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-current/80 transition hover:text-current"
                        href={item.href}
                      >
                        {item.actionLabel}
                        <ArrowRightIcon className="size-3.5" />
                      </Link>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border-subtle bg-bg-default/70 p-3 text-sm text-muted-foreground">
                    No stage-specific records need action.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside
            aria-label="Ingestion failure-origin inspector"
            className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Ingestion failure-origin inspector
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                  {selectedItem?.label ?? "No active signal"}
                </h2>
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  {selectedItem?.detail ??
                    "Ingestion diagnostics appear here when a source lane needs review."}
                </p>
              </div>
              <AlertTriangleIcon className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
            </div>

            {selectedItem ? (
              <div className={cn("mt-4 rounded-lg border p-3", toneSurfaceClassName[selectedItem.tone])}>
                <p className="break-words text-xs font-semibold uppercase tracking-normal text-current/70">
                  {selectedItem.metadataLabel}
                </p>
                <p className="mt-2 break-words font-mono text-2xl font-semibold leading-none">
                  {selectedItem.value}
                </p>
                <Link
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-current/80 transition hover:text-current"
                  href={selectedItem.href}
                >
                  {selectedItem.actionLabel}
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
            ) : null}

            <div className="mt-4 grid gap-2">
              {metrics.map((metric) => (
                <Link
                  className={cn(
                    "group min-w-0 rounded-lg border p-3 transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                    toneSurfaceClassName[metric.tone],
                  )}
                  href={ingestionMetricHref(metric.id)}
                  key={metric.id}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-semibold uppercase tracking-normal text-current/70">
                        {metric.label}
                      </p>
                      <p className="mt-1 break-words text-xl font-semibold leading-tight">
                        {metric.value}
                      </p>
                    </div>
                    <span className="shrink-0 text-current/70" aria-hidden="true">
                      <IngestionMetricIcon id={metric.id} />
                    </span>
                  </div>
                  <p className="mt-2 break-words text-xs leading-4 text-current/75">
                    {metric.detail}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-current/75 transition group-hover:text-current">
                    {ingestionMetricActionLabel(metric.id)}
                    <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section
        aria-label="Pipeline run history"
        className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="border-b border-border-subtle p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardListIcon className="size-4 shrink-0 text-muted-foreground" />
            <h2 className="break-words text-base font-semibold leading-tight text-foreground">
              Pipeline run history
            </h2>
          </div>
          <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
            Each run lane records the current failure origin, source evidence, and next promotion
            checkpoint.
          </p>
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
          {runs.map((run, index) => {
            const selected = selectedItem?.id === `run-${run.id}`;

            return (
              <button
                aria-label={`Inspect run step ${run.signal}`}
                aria-pressed={selected}
                className={cn(
                  "relative min-w-0 rounded-lg border border-border-subtle bg-bg-muted/30 p-3 text-left transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                  selected && "ring-2 ring-ring/45",
                )}
                key={run.id}
                onClick={() => setSelectedId(`run-${run.id}`)}
                type="button"
              >
                <span
                  className={cn("absolute inset-x-0 top-0 h-1", toneRailClassName[run.tone])}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 items-start justify-between gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      Run step {index + 1}
                    </p>
                    <h3 className="mt-1 break-words text-sm font-semibold text-foreground">
                      {run.signal}
                    </h3>
                  </div>
                  <ToneBadge tone={run.tone}>{run.value}</ToneBadge>
                </div>
                <p className="mt-3 break-words text-xs leading-4 text-muted-foreground">
                  {run.evidence}
                </p>
                <p className="mt-3 break-words text-xs font-medium text-muted-foreground">
                  Window opened {run.windowLabel}
                </p>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border-subtle p-3">
          {actions.map((action) => (
            <Link
              className={cn(
                "inline-flex min-w-0 items-center justify-between gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                action.priority === "primary"
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "border border-border-subtle bg-bg-muted/45 text-content-default hover:bg-bg-muted",
              )}
              href={action.href}
              key={`${action.href}-${action.label}`}
            >
              <span className="truncate">{action.label}</span>
              <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
