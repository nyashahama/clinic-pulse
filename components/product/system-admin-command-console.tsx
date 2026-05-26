import Link from "next/link";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  PlugZapIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type {
  SystemAdminCommandMetric,
  SystemAdminCommandModel,
  SystemAdminCommandTone,
  SystemAdminEvidenceRow,
  SystemAdminLaneItem,
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
    icon: string;
  }
> = {
  clear: {
    rail: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
    surface: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    icon: "text-emerald-600 dark:text-emerald-300",
  },
  attention: {
    rail: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
    surface: "border-amber-200 bg-amber-50/65 dark:border-amber-900/60 dark:bg-amber-950/20",
    icon: "text-amber-600 dark:text-amber-300",
  },
  blocked: {
    rail: "bg-destructive",
    badge: "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
    surface: "border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/15",
    icon: "text-destructive",
  },
  info: {
    rail: "bg-sky-500",
    badge: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
    surface: "border-sky-200 bg-sky-50/60 dark:border-sky-900/60 dark:bg-sky-950/20",
    icon: "text-sky-600 dark:text-sky-300",
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

function metricIcon(metric: SystemAdminCommandMetric) {
  const className = "size-4";

  if (metric.id === "ingestion-pressure") {
    return <RadioTowerIcon className={className} />;
  }

  if (metric.id === "security-posture") {
    return <ShieldCheckIcon className={className} />;
  }

  if (metric.id === "audit-readiness") {
    return <SlidersHorizontalIcon className={className} />;
  }

  return <ActivityIcon className={className} />;
}

function EvidenceIcon({ row }: { row: SystemAdminEvidenceRow }) {
  const className = "size-4";

  if (row.id === "security-posture") {
    return <ShieldCheckIcon className={className} />;
  }

  if (row.id === "integration-checks") {
    return <PlugZapIcon className={className} />;
  }

  return <SlidersHorizontalIcon className={className} />;
}

function ToneBadge({ tone }: { tone: SystemAdminCommandTone }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        toneClasses[tone].badge,
      )}
    >
      {toneLabel(tone)}
    </span>
  );
}

function MetricCard({ metric }: { metric: SystemAdminCommandMetric }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
      <div className={cn("h-1", toneClasses[metric.tone].rail)} aria-hidden="true" />
      <div className="grid gap-3 p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 break-words font-mono text-3xl font-semibold leading-none text-foreground">
              {metric.value}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
              toneClasses[metric.tone].surface,
              toneClasses[metric.tone].icon,
            )}
            aria-hidden="true"
          >
            {metricIcon(metric)}
          </span>
        </div>
        <p className="min-h-10 break-words text-sm leading-5 text-muted-foreground">
          {metric.detail}
        </p>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <ToneBadge tone={metric.tone} />
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
            href={metric.href}
          >
            {metric.actionLabel}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function LaneItem({ item }: { item: SystemAdminLaneItem }) {
  return (
    <article
      className={cn(
        "grid min-w-0 gap-3 rounded-lg border p-3",
        toneClasses[item.tone].surface,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {item.label}
          </p>
          <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-foreground">
            {item.title}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-sm font-semibold text-foreground">
          {item.value}
        </span>
      </div>
      <p className="break-words text-sm leading-5 text-muted-foreground">{item.detail}</p>
      <div className="flex min-w-0 justify-end">
        <Link
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
          href={item.href}
        >
          Open
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function SystemAdminCommandConsole({ model }: SystemAdminCommandConsoleProps) {
  return (
    <div
      className="grid min-w-0 gap-4 pb-6"
      data-admin-module="system-admin-command"
      data-role-dashboard="system_admin"
    >
      <section className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start sm:p-5">
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {model.header.eyebrow}
            </p>
            <h1 className="mt-1 break-words text-2xl font-semibold leading-tight text-foreground">
              {model.header.title}
            </h1>
            <p className="mt-2 max-w-4xl break-words text-sm leading-5 text-muted-foreground">
              {model.header.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <CheckCircle2Icon className="size-3.5 text-emerald-600" />
              Live operations
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <RadioTowerIcon className="size-3.5 text-sky-600" />
              {model.header.syncLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <ActivityIcon className="size-3.5 text-amber-600" />
              {model.header.activeAlertLabel}
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Platform command metrics" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {model.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section
        aria-label="Operational command lanes"
        className="grid min-w-0 gap-4 xl:grid-cols-3"
      >
        {model.lanes.map((lane) => (
          <section
            key={lane.id}
            className="min-w-0 text-content-default"
          >
            <div className="mb-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <h2 className="break-words text-base font-semibold text-foreground">
                  {lane.label}
                </h2>
                <span className="rounded-md bg-bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {lane.items.length}
                </span>
              </div>
              <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                {lane.description}
              </p>
            </div>
            <div className="grid gap-2">
              {lane.items.length ? (
                lane.items.map((item) => <LaneItem key={item.id} item={item} />)
              ) : (
                <p className="rounded-lg border border-border-subtle bg-bg-muted p-3 text-sm text-muted-foreground">
                  No work is currently assigned to this lane.
                </p>
              )}
            </div>
          </section>
        ))}
      </section>

      <section
        aria-label="Audit and evidence console"
        className="grid min-w-0 gap-4 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]"
      >
        <div className="min-w-0 border-b border-border-subtle p-4 xl:border-b-0 xl:border-r">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Evidence console
              </p>
              <h2 className="mt-1 break-words text-lg font-semibold text-foreground">
                Audit and evidence console
              </h2>
              <p className="mt-1 max-w-3xl break-words text-sm leading-5 text-muted-foreground">
                Filter-like rows keep system evidence inspectable while links route to the
                dedicated source pages.
              </p>
            </div>
            <Link
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              href="/admin/audit-evidence"
            >
              Open audit evidence
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid gap-2">
            {model.evidenceRows.map((row) => (
              <Link
                key={row.id}
                className={cn(
                  "grid min-w-0 gap-3 rounded-lg border p-3 text-left transition hover:bg-bg-muted md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center",
                  toneClasses[row.tone].surface,
                )}
                href={row.href}
              >
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-lg border bg-bg-default",
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
                  <span className="mt-1 block break-words text-sm leading-5 text-muted-foreground">
                    {row.detail}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {row.actionLabel}
                  <ArrowRightIcon className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Reliability strip
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold text-foreground">
              Platform health signals
            </h2>
          </div>
          <div className="grid gap-2">
            {model.reliabilityRows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-muted p-3"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="break-words text-sm font-semibold text-foreground">
                    {row.label}
                  </p>
                  <ToneBadge tone={row.tone} />
                </div>
                <p className="font-mono text-sm font-semibold text-foreground">{row.status}</p>
                <p className="break-words text-xs leading-4 text-muted-foreground">
                  {row.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
