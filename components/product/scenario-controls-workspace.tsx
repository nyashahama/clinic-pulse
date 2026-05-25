"use client";

import type { ComponentType } from "react";
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  RouteIcon,
  ShieldCheckIcon,
  SyringeIcon,
  UsersRoundIcon,
} from "lucide-react";

import { AdminStatusBadge } from "@/components/product/admin-module";
import { Button } from "@/components/ui/button";
import type {
  ScenarioControlCommandId,
  ScenarioControlTone,
  ScenarioControlsViewModel,
} from "@/lib/product/scenario-controls";
import { cn } from "@/lib/utils";

type ScenarioControlsWorkspaceProps = {
  viewModel: ScenarioControlsViewModel;
  onSelectCommand: (commandId: ScenarioControlCommandId) => void;
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
  offline_sync: RefreshCwIcon,
  reroute: RouteIcon,
};

const toneClassName: Record<ScenarioControlTone, string> = {
  clear: "border-emerald-200 bg-emerald-50/55 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-rose-200 bg-rose-50/65 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100",
  info: "border-sky-200 bg-sky-50/55 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100",
};

function formatEventLabel(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ScenarioControlsWorkspace({
  viewModel,
  onSelectCommand,
  onRunCommand,
}: ScenarioControlsWorkspaceProps) {
  const selectedCommand = viewModel.selectedCommand;
  const SelectedIcon = commandIcons[selectedCommand.id];

  return (
    <section
      aria-label="Scenario controls workspace"
      className="grid min-w-0 gap-4 text-content-default"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {viewModel.summaryMetrics.map((metric) => (
          <div
            key={metric.id}
            className={cn("min-w-0 rounded-lg border px-4 py-3 shadow-sm", toneClassName[metric.tone])}
          >
            <p className="break-words text-xs font-medium text-current/70">
              {metric.label}
            </p>
            <p className="mt-1 break-words font-mono text-2xl font-semibold leading-tight">
              {metric.value}
            </p>
            <p className="mt-2 break-words text-xs leading-4 text-current/75">
              {metric.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(280px,0.38fr)_minmax(0,0.62fr)]">
        <section
          aria-label="Scenario runbook"
          className="order-2 min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm xl:order-1 xl:row-span-3"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Scenario runbook
            </p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Choose the operating path before executing a scenario action.
            </p>
          </div>

          <div className="divide-y divide-border-subtle">
            {viewModel.commandGroups.map((group) => (
              <div key={group.id} className="min-w-0">
                <div className="bg-bg-muted/35 px-4 py-2">
                  <p className="text-sm font-medium text-foreground">{group.title}</p>
                  <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <div className="divide-y divide-border-subtle">
                  {group.commands.map((command) => {
                    const Icon = commandIcons[command.id];
                    const isSelected = command.id === selectedCommand.id;

                    return (
                      <button
                        key={command.id}
                        type="button"
                        aria-pressed={isSelected}
                        className={cn(
                          "grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 px-4 py-3 text-left transition hover:bg-bg-muted/55 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                          isSelected ? "bg-bg-muted/70" : "bg-bg-default",
                        )}
                        onClick={() => onSelectCommand(command.id)}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-8 items-center justify-center rounded-lg border",
                            toneClassName[command.tone],
                          )}
                          aria-hidden="true"
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex min-w-0 items-center justify-between gap-2">
                            <span className="break-words text-sm font-medium text-foreground">
                              {command.label}
                            </span>
                            {isSelected ? (
                              <CheckCircle2Icon
                                className="size-4 shrink-0 text-emerald-700"
                                aria-hidden="true"
                              />
                            ) : null}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                            {command.shortDescription}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label="Scenario command panel"
          className="order-1 overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm xl:order-2 xl:col-start-2"
        >
            <div className="grid gap-4 border-b border-border-subtle px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      toneClassName[selectedCommand.tone],
                    )}
                    aria-hidden="true"
                  >
                    <SelectedIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                      Command ready
                    </p>
                    <h2 className="break-words text-lg font-semibold leading-tight text-foreground">
                      {selectedCommand.label}
                    </h2>
                  </div>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-5 text-muted-foreground">
                  {selectedCommand.impactDescription}
                </p>
              </div>

              <Button
                size="sm"
                variant={selectedCommand.tone === "blocked" ? "destructive" : "default"}
                onClick={() => onRunCommand(selectedCommand.id)}
              >
                <SelectedIcon className="size-4" aria-hidden="true" />
                {selectedCommand.actionLabel}
              </Button>
            </div>

            <div className="grid gap-0 divide-y divide-border-subtle lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              <div className="min-w-0 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Target
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {selectedCommand.targetLabel}
                </p>
              </div>
              <div className="min-w-0 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Impact
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {selectedCommand.impactLabel}
                </p>
              </div>
              <div className="min-w-0 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Last action
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {viewModel.statusMessage}
                </p>
              </div>
            </div>

            <div className="border-t border-border-subtle px-4 py-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Evidence flow
                </p>
                <span className="text-xs text-muted-foreground">
                  {selectedCommand.evidenceStages.length} steps
                </span>
              </div>
              <ol
                aria-label="Selected scenario evidence flow"
                className="mt-3 grid gap-2 md:grid-cols-2"
              >
                {selectedCommand.evidenceStages.map((stage, index) => (
                  <li
                    key={stage.id}
                    className={cn(
                      "relative min-w-0 rounded-lg border px-3 py-2",
                      toneClassName[stage.tone],
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current/25 bg-bg-default/70 font-mono text-[0.68rem] font-semibold leading-none">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium leading-5 text-current">
                          {stage.label}
                        </p>
                        <p className="mt-1 text-xs leading-4 text-current/75">
                          {stage.detail}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
        </section>

        <section
          aria-label="Scenario safety checks"
          className="order-3 overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm xl:col-start-2"
        >
            <div className="grid gap-0 divide-y divide-border-subtle md:grid-cols-3 md:divide-x md:divide-y-0">
              {viewModel.safetyNotes.map((note) => (
                <div key={note.label} className="min-w-0 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon
                      className="size-4 shrink-0 text-teal-700"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-foreground">{note.label}</p>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {note.detail}
                  </p>
                </div>
              ))}
            </div>
        </section>

        <section
          aria-label="Scenario evidence timeline"
          className="order-4 overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm xl:col-start-2"
        >
            <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Scenario evidence timeline
                </p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Latest audit events generated by scenario state.
                </p>
              </div>
              <ActivityIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </div>

            {viewModel.evidenceRows.length ? (
              <ol className="divide-y divide-border-subtle">
                {viewModel.evidenceRows.map((row) => (
                  <li key={row.id} className="grid gap-2 px-4 py-3 lg:grid-cols-[minmax(9rem,0.35fr)_minmax(0,1fr)]">
                    <div className="min-w-0">
                      <AdminStatusBadge tone={row.eventType.includes("webhook") ? "clear" : "info"}>
                        {formatEventLabel(row.eventType)}
                      </AdminStatusBadge>
                      <p className="mt-2 break-words text-sm font-medium text-foreground">
                        {row.clinicName}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm leading-5 text-foreground">
                        {row.summary}
                      </p>
                      <p className="mt-1 text-xs leading-4 text-muted-foreground">
                        {row.actorName} at {formatDateTime(row.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="px-4 py-8 text-center">
                <ClipboardCheckIcon
                  className="mx-auto size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No scenario evidence yet
                </p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Run a scenario command to populate the audit timeline.
                </p>
              </div>
            )}
        </section>
      </div>
    </section>
  );
}
