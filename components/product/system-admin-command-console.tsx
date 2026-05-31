"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  DatabaseZapIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type {
  SystemAdminCommandModel,
  SystemAdminCommandTone,
  SystemAdminEvidenceRow,
  SystemAdminHealthMonitor,
  SystemAdminOperationCase,
  SystemAdminReliabilityTimelineItem,
} from "@/lib/product/system-admin-command";
import { cn } from "@/lib/utils";

type SystemAdminCommandConsoleProps = {
  model: SystemAdminCommandModel;
};

const toneClasses: Record<
  SystemAdminCommandTone,
  {
    rail: string;
    badge: string;
    surface: string;
    activeSurface: string;
    icon: string;
    progress: string;
  }
> = {
  clear: {
    rail: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
    surface: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    activeSurface: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    icon: "text-emerald-600 dark:text-emerald-300",
    progress: "bg-emerald-400",
  },
  attention: {
    rail: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
    surface: "border-amber-200 bg-amber-50/65 dark:border-amber-900/60 dark:bg-amber-950/20",
    activeSurface: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20",
    icon: "text-amber-600 dark:text-amber-300",
    progress: "bg-amber-400",
  },
  blocked: {
    rail: "bg-destructive",
    badge: "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
    surface: "border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/15",
    activeSurface: "border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/15",
    icon: "text-destructive",
    progress: "bg-destructive",
  },
  info: {
    rail: "bg-sky-500",
    badge: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
    surface: "border-sky-200 bg-sky-50/60 dark:border-sky-900/60 dark:bg-sky-950/20",
    activeSurface: "border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/20",
    icon: "text-sky-600 dark:text-sky-300",
    progress: "bg-sky-400",
  },
};

function toneLabel(tone: SystemAdminCommandTone) {
  if (tone === "attention") {
    return "Review";
  }

  if (tone === "blocked") {
    return "Blocked";
  }

  if (tone === "info") {
    return "Watch";
  }

  return "Clear";
}

function ToneBadge({ tone, label = toneLabel(tone) }: { tone: SystemAdminCommandTone; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        toneClasses[tone].badge,
      )}
    >
      {label}
    </span>
  );
}

function CaseIcon({ id }: { id: string }) {
  const className = "size-4";

  if (id === "ingestion-review") {
    return <DatabaseZapIcon className={className} />;
  }

  if (id === "security-access") {
    return <ShieldCheckIcon className={className} />;
  }

  if (id === "audit-evidence") {
    return <ActivityIcon className={className} />;
  }

  if (id === "tenant-health") {
    return <RadioTowerIcon className={className} />;
  }

  return <SlidersHorizontalIcon className={className} />;
}

function EvidenceIcon({ row }: { row: SystemAdminEvidenceRow }) {
  return <CaseIcon id={row.id === "security-posture" ? "security-access" : row.id} />;
}

function ActiveOperationalCase({ activeCase }: { activeCase: SystemAdminOperationCase }) {
  return (
    <section
      aria-label="Active operational case"
      className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-white shadow-sm"
    >
      <div className="grid min-w-0 gap-6 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Active operational case
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-xs font-semibold text-amber-100">
              <AlertTriangleIcon className="size-3.5" />
              {activeCase.stateLabel}
            </span>
          </div>
          <h1 className="mt-2 break-words text-2xl font-semibold leading-tight md:text-3xl">
            Platform Operations Cockpit
          </h1>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-zinc-300">
            {activeCase.summary}
          </p>

          <div className="mt-5 grid min-w-0 gap-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
                  {activeCase.progress.label}
                </p>
                <p className="mt-1 break-words font-mono text-2xl font-semibold">
                  {activeCase.progress.value}
                </p>
              </div>
              <p className="max-w-sm break-words text-xs leading-5 text-zinc-400 sm:text-right">
                {activeCase.progress.detail}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn("h-full rounded-full", toneClasses[activeCase.tone].progress)}
                style={{ width: `${activeCase.progress.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 content-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
              Lead action
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold">{activeCase.label}</h2>
            <p className="mt-2 break-words text-sm leading-5 text-zinc-300">
              {activeCase.nextStep}
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ size: "sm" }), "w-full gap-1.5")}
            href={activeCase.href}
          >
            {activeCase.primaryActionLabel}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlatformHealthMonitorGrid({ monitors }: { monitors: SystemAdminHealthMonitor[] }) {
  return (
    <section aria-label="Platform health monitors" className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {monitors.map((monitor) => (
        <article
          key={monitor.id}
          className={cn(
            "grid min-w-0 gap-3 rounded-lg border border-t-4 bg-bg-default p-4 text-content-default shadow-sm",
            toneClasses[monitor.tone].surface,
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {monitor.label}
              </p>
              <p className="mt-2 break-words font-mono text-2xl font-semibold text-foreground">
                {monitor.value}
              </p>
            </div>
            <ToneBadge tone={monitor.tone} label={monitor.statusLabel} />
          </div>
          <p className="break-words text-sm leading-5 text-muted-foreground">{monitor.detail}</p>
          <div className="flex min-w-0 items-center justify-between gap-3 border-t border-border-subtle pt-3">
            <span className="break-words text-xs font-medium text-muted-foreground">
              {monitor.checkLabel}
            </span>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
              href={monitor.href}
            >
              {monitor.actionLabel}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}

function OperationsQueue({
  cases,
  selectedCaseId,
  onSelect,
}: {
  cases: SystemAdminOperationCase[];
  selectedCaseId: string;
  onSelect: (caseId: string) => void;
}) {
  return (
    <section aria-label="Operations queue" className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Operator queue
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-foreground">
            Platform cases
          </h2>
        </div>
        <span className="rounded-md bg-bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {cases.length}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {cases.map((item) => {
          const selected = item.id === selectedCaseId;

          return (
            <button
              aria-label={`Select ${item.label} operational case`}
              className={cn(
                "grid min-w-0 gap-2 rounded-lg border p-3 text-left transition hover:bg-bg-muted",
                selected ? toneClasses[item.tone].activeSurface : "border-border-subtle bg-bg-default",
              )}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <span className="flex min-w-0 items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                    {item.summary}
                  </span>
                </span>
                <ToneBadge tone={item.tone} label={item.stateLabel} />
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">
                {item.value}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SelectedCaseDetail({ activeCase }: { activeCase: SystemAdminOperationCase }) {
  return (
    <section
      aria-label="Selected operational case"
      className="grid min-w-0 gap-4 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Selected case
          </p>
          <h2 className="mt-1 break-words text-xl font-semibold text-foreground">
            {activeCase.label}
          </h2>
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border bg-bg-muted",
            toneClasses[activeCase.tone].icon,
          )}
          aria-hidden="true"
        >
          <CaseIcon id={activeCase.id} />
        </span>
      </div>

      <div className={cn("rounded-lg border p-3", toneClasses[activeCase.tone].surface)}>
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Evidence state
        </p>
        <p className="mt-1 break-words text-base font-semibold text-foreground">
          {activeCase.evidenceLabel}
        </p>
        <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
          {activeCase.evidenceDetail}
        </p>
      </div>

      <div className="grid gap-3 text-sm leading-5">
        <div>
          <p className="font-semibold text-foreground">Impact</p>
          <p className="mt-1 break-words text-muted-foreground">{activeCase.impact}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Verification</p>
          <p className="mt-1 break-words text-muted-foreground">{activeCase.verification}</p>
        </div>
      </div>

      <Link
        className={cn(buttonVariants({ size: "sm" }), "w-full gap-1.5")}
        href={activeCase.href}
      >
        {activeCase.primaryActionLabel}
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </section>
  );
}

function ReliabilityTimeline({ items }: { items: SystemAdminReliabilityTimelineItem[] }) {
  return (
    <section
      aria-label="Platform reliability timeline"
      className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Reliability timeline
        </p>
        <h2 className="mt-1 break-words text-lg font-semibold text-foreground">
          Platform evidence sequence
        </h2>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3" key={item.label}>
            <span className={cn("mt-1 size-2.5 rounded-full", toneClasses[item.tone].rail)} />
            <span className="min-w-0">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="break-words text-sm font-semibold text-foreground">
                  {item.label}
                </span>
                <ToneBadge tone={item.tone} />
              </span>
              <span className="mt-1 block break-words text-sm font-medium text-foreground">
                {item.title}
              </span>
              <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                {item.description}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceConsole({ rows }: { rows: SystemAdminEvidenceRow[] }) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Evidence routes
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-foreground">
            Source modules
          </h2>
        </div>
        <Link
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
          href="/admin/audit-evidence"
        >
          Open audit evidence
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <Link
            className={cn(
              "grid min-w-0 gap-2 rounded-lg border p-3 transition hover:bg-bg-muted",
              toneClasses[row.tone].surface,
            )}
            href={row.href}
            key={row.id}
          >
            <span className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border bg-bg-default",
                  toneClasses[row.tone].icon,
                )}
                aria-hidden="true"
              >
                <EvidenceIcon row={row} />
              </span>
              <span className="min-w-0">
                <span className="block break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {row.label}
                </span>
                <span className="mt-1 block break-words text-sm font-semibold text-foreground">
                  {row.title}
                </span>
                <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                  {row.detail}
                </span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SystemAdminCommandConsole({ model }: SystemAdminCommandConsoleProps) {
  const [selectedCaseId, setSelectedCaseId] = useState(model.activeCase.id);
  const selectedCase =
    model.operationQueue.find((item) => item.id === selectedCaseId) ?? model.activeCase;

  return (
    <div
      className="grid min-w-0 gap-4 pb-6"
      data-admin-module="system-admin-command"
      data-role-dashboard="system_admin"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {model.header.eyebrow}
          </p>
          <p className="mt-1 max-w-4xl break-words text-sm leading-5 text-muted-foreground">
            {model.header.description}
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <ToneBadge tone={model.activeCase.tone} label={model.activeCase.stateLabel} />
          <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 text-xs font-semibold text-foreground">
            {model.header.syncLabel}
          </span>
          <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 text-xs font-semibold text-foreground">
            {model.header.activeAlertLabel}
          </span>
        </div>
      </div>

      <ActiveOperationalCase activeCase={model.activeCase} />
      <PlatformHealthMonitorGrid monitors={model.healthMonitors} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
        <OperationsQueue
          cases={model.operationQueue}
          onSelect={setSelectedCaseId}
          selectedCaseId={selectedCase.id}
        />
        <div className="grid min-w-0 content-start gap-4">
          <SelectedCaseDetail activeCase={selectedCase} />
          <ReliabilityTimeline items={model.reliabilityTimeline} />
        </div>
      </div>

      <EvidenceConsole rows={model.evidenceRows} />
    </div>
  );
}
