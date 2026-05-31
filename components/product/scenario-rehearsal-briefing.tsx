"use client";

import type { ComponentType } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  PlayCircleIcon,
  RadioTowerIcon,
  RotateCcwIcon,
  RouteIcon,
  ShieldCheckIcon,
  SyringeIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ScenarioControlCommandId,
  ScenarioControlTone,
  ScenarioControlsMetric,
  ScenarioControlsViewModel,
} from "@/lib/product/scenario-controls";
import { cn } from "@/lib/utils";

type ScenarioRehearsalBriefingProps = {
  title: string;
  viewModel: ScenarioControlsViewModel;
  onRunCommand: (commandId: ScenarioControlCommandId) => void;
};

const commandIcons: Record<
  ScenarioControlCommandId,
  ComponentType<{ className?: string }>
> = {
  reset: RotateCcwIcon,
  incident_replay: PlayCircleIcon,
  stockout: SyringeIcon,
  staffing_shortage: UsersRoundIcon,
  offline_sync: RadioTowerIcon,
  reroute: RouteIcon,
};

const tonePanelClassName: Record<ScenarioControlTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100",
};

const toneRailClassName: Record<ScenarioControlTone, string> = {
  clear: "border-l-emerald-400",
  attention: "border-l-amber-400",
  blocked: "border-l-rose-400",
  info: "border-l-sky-400",
};

function metricIcon(metric: ScenarioControlsMetric) {
  const className = "size-4";

  if (metric.id === "active_alerts") {
    return <ActivityIcon className={className} />;
  }

  if (metric.id === "offline_queue") {
    return <RadioTowerIcon className={className} />;
  }

  if (metric.id === "audit_events") {
    return <ClipboardCheckIcon className={className} />;
  }

  return <CheckCircle2Icon className={className} />;
}

export function ScenarioRehearsalBriefing({
  title,
  viewModel,
  onRunCommand,
}: ScenarioRehearsalBriefingProps) {
  const selectedCommand = viewModel.selectedCommand;
  const SelectedIcon = commandIcons[selectedCommand.id];
  const firstEvidenceStage = selectedCommand.evidenceStages[0];

  return (
    <section
      aria-label="Scenario rehearsal cockpit"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="grid min-w-0 content-start gap-5 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Platform rehearsal
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Run controlled operating rehearsals, preview the evidence chain, and reset the
              workspace before handing the state back to district, audit, and partner workflows.
            </p>
          </div>

          <div
            className={cn(
              "min-w-0 rounded-lg border border-l-4 bg-bg-muted/30 p-3",
              toneRailClassName[selectedCommand.tone],
            )}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Playback command
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-foreground">
                  {selectedCommand.label}
                </p>
                <p className="mt-1 max-w-3xl break-words text-sm leading-5 text-muted-foreground">
                  {selectedCommand.impactDescription}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                  tonePanelClassName[selectedCommand.tone],
                )}
                aria-hidden="true"
              >
                <SelectedIcon className="size-4" />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={selectedCommand.tone === "blocked" ? "destructive" : "default"}
                onClick={() => onRunCommand(selectedCommand.id)}
              >
                <SelectedIcon className="size-4" aria-hidden="true" />
                {selectedCommand.actionLabel}
              </Button>
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border-subtle bg-bg-default px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheckIcon className="size-3.5 shrink-0 text-teal-700" aria-hidden="true" />
                <span className="min-w-0 break-words">{viewModel.statusMessage}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Rehearsal playback console
              </p>
              <p className="mt-1 max-w-2xl break-words text-sm leading-5 text-muted-foreground">
                Playback starts from the selected scenario command while active alerts, offline
                receipts, and audit output stay visible before a run begins.
              </p>
            </div>
            <PlayCircleIcon className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {viewModel.summaryMetrics.map((metric) => (
              <div
                key={metric.id}
                className={cn(
                  "min-w-0 rounded-lg border px-3 py-2",
                  tonePanelClassName[metric.tone],
                )}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-xs font-medium uppercase tracking-normal text-current/70">
                      {metric.label}
                    </p>
                    <p className="mt-1 break-words font-mono text-xl font-semibold leading-tight text-current">
                      {metric.value}
                    </p>
                  </div>
                  <span className="shrink-0 text-current/70" aria-hidden="true">
                    {metricIcon(metric)}
                  </span>
                </div>
                <p className="mt-1 break-words text-xs leading-4 text-current/75">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-0 border-t border-border-subtle lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.62fr)]">
        <div className="min-w-0 p-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Run state diff
            </p>
            <ArrowRightIcon className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
            {selectedCommand.evidenceStages.map((stage, index) => (
              <div
                key={stage.id}
                className={cn(
                  "min-w-0 rounded-lg border border-l-4 bg-bg-muted/25 px-3 py-2",
                  toneRailClassName[stage.tone],
                )}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-default font-mono text-[0.68rem] font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground">
                      {stage.label}
                    </p>
                    <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">
                      {stage.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border-subtle bg-bg-muted/30 p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Preflight checklist
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-foreground">
            {firstEvidenceStage?.label ?? "Evidence chain is ready"}
          </p>
          <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
            Browser-local state keeps rehearsal commands reversible while the audit stream shows
            the same evidence trail users review in operations pages.
          </p>
        </div>
      </div>
    </section>
  );
}
