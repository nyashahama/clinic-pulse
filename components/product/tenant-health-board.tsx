import Link from "next/link";
import {
  ActivityIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  PlugZapIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type {
  TenantHealthAction,
  TenantHealthMetric,
  TenantHealthSignal,
  TenantHealthTone,
  TenantHealthViewModel,
} from "@/lib/product/tenant-health";
import { cn } from "@/lib/utils";

type TenantHealthBoardProps = {
  viewModel: TenantHealthViewModel;
};

const toneRailClassName: Record<TenantHealthTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

const toneBadgeClassName: Record<TenantHealthTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

const tonePanelClassName: Record<TenantHealthTone, string> = {
  clear:
    "border-t-emerald-300 bg-bg-default lg:border-l-emerald-300 dark:border-t-emerald-900/70 dark:lg:border-l-emerald-900/70",
  attention:
    "border-t-amber-300 bg-bg-default lg:border-l-amber-300 dark:border-t-amber-900/70 dark:lg:border-l-amber-900/70",
  blocked:
    "border-t-destructive/45 bg-bg-default lg:border-l-destructive/45 dark:border-t-destructive/60 dark:lg:border-l-destructive/60",
  info: "border-t-sky-300 bg-bg-default lg:border-l-sky-300 dark:border-t-sky-900/70 dark:lg:border-l-sky-900/70",
};

function HealthActionIcon({ icon }: { icon: TenantHealthAction["icon"] }) {
  const iconClassName = "size-3.5";

  if (icon === "shield") {
    return <ShieldCheckIcon className={iconClassName} />;
  }

  if (icon === "plug") {
    return <PlugZapIcon className={iconClassName} />;
  }

  return <RadioTowerIcon className={iconClassName} />;
}

function SignalIcon({ signal }: { signal: TenantHealthSignal }) {
  const iconClassName = "size-4";

  if (signal.tone === "clear") {
    return <CheckCircle2Icon className={iconClassName} />;
  }

  if (signal.id === "privileged-access") {
    return <ShieldCheckIcon className={iconClassName} />;
  }

  if (signal.id === "partner-readiness") {
    return <PlugZapIcon className={iconClassName} />;
  }

  return <ActivityIcon className={iconClassName} />;
}

function TenantHealthActionLink({ action }: { action: TenantHealthAction }) {
  return (
    <Link
      className={cn(
        buttonVariants({
          size: "sm",
          variant: action.priority === "primary" ? "default" : "outline",
        }),
        "justify-between gap-2",
      )}
      href={action.href}
    >
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <HealthActionIcon icon={action.icon} />
        <span className="truncate">{action.label}</span>
      </span>
      <ArrowRightIcon className="size-3.5" />
    </Link>
  );
}

function HealthMetric({ metric }: { metric: TenantHealthMetric }) {
  return (
    <div className="min-w-0 border-b border-border-subtle p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {metric.label}
        </p>
        <span
          className={cn(
            "h-1.5 w-10 shrink-0 rounded-full",
            toneRailClassName[metric.tone],
          )}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 break-words font-mono text-2xl font-semibold leading-none text-foreground">
        {metric.value}
      </p>
      <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
        {metric.detail}
      </p>
    </div>
  );
}

function statusLabelForTone(tone: TenantHealthTone) {
  return tone === "clear" ? "Clear" : "Open";
}

function ToneBadge({
  children,
  tone,
}: {
  children: string;
  tone: TenantHealthTone;
}) {
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

export function TenantHealthBoard({ viewModel }: TenantHealthBoardProps) {
  const estateStatus =
    viewModel.header.score.tone === "clear" ? "Clear" : "Needs review";

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-admin-module="tenant-health">
      <section className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <div className="min-w-0 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {viewModel.header.eyebrow}
            </p>
            <h1 className="mt-1 break-words text-2xl font-semibold leading-tight text-foreground">
              {viewModel.header.title}
            </h1>
            <p className="mt-2 max-w-4xl break-words text-sm leading-5 text-muted-foreground">
              {viewModel.header.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ToneBadge tone="info">{viewModel.header.scope}</ToneBadge>
              <ToneBadge tone={viewModel.header.score.tone}>
                {viewModel.header.score.detail}
              </ToneBadge>
            </div>
          </div>
          <div
            className={cn(
              "grid min-w-0 content-between gap-4 border-t-4 border-border-subtle p-4 lg:border-l-4 lg:border-t-0 sm:p-5",
              tonePanelClassName[viewModel.header.score.tone],
            )}
          >
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {viewModel.header.score.label}
                </p>
                <ToneBadge tone={viewModel.header.score.tone}>{estateStatus}</ToneBadge>
              </div>
              <p className="mt-2 font-mono text-4xl font-semibold leading-none text-foreground">
                {viewModel.header.score.value}
              </p>
              <p className="mt-3 max-w-sm break-words text-xs leading-4 text-muted-foreground">
                {viewModel.header.score.detail}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {viewModel.actions.map((action) => (
                <TenantHealthActionLink action={action} key={action.label} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Tenant health metrics"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {viewModel.metrics.map((metric) => (
            <HealthMetric key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
        <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
          <div className="border-b border-border-subtle p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-2">
              <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                {viewModel.districtStack.title}
              </h2>
            </div>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
              {viewModel.districtStack.description}
            </p>
          </div>
          <div className="divide-y divide-border-subtle">
            {viewModel.districtStack.rows.map((row) => (
              <div
                className="grid min-w-0 gap-3 p-4 md:grid-cols-[minmax(12rem,1fr)_minmax(14rem,1.2fr)_auto] md:items-center"
                key={row.id}
              >
                <div className="min-w-0">
                  <p className="break-words font-medium text-foreground">{row.district}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.clinics} clinics / {row.pendingReports} pending reports
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {row.readinessPercent}% fresh
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {row.freshnessRisk} freshness risk
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className={cn("h-full rounded-full", toneRailClassName[row.tone])}
                      style={{ width: `${Math.max(4, row.readinessPercent)}%` }}
                    />
                  </div>
                  <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
                    {row.detail}
                  </p>
                </div>
                <div className="md:justify-self-end">
                  <ToneBadge tone={row.tone}>{row.statusLabel}</ToneBadge>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
          <div className="border-b border-border-subtle p-4 sm:p-5">
            <h2 className="break-words text-base font-semibold leading-tight text-foreground">
              {viewModel.signalLedger.title}
            </h2>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
              {viewModel.signalLedger.description}
            </p>
          </div>
          <div className="grid gap-3 p-3">
            {viewModel.signalLedger.items.map((item) => (
              <Link
                className="group relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-md border border-border-subtle bg-bg-default p-3 transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={item.href}
                key={item.id}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    toneRailClassName[item.tone],
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "ml-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border",
                    toneBadgeClassName[item.tone],
                  )}
                  aria-hidden="true"
                >
                  <SignalIcon signal={item} />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="break-words text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                      {item.value}
                    </span>
                    <ToneBadge tone={item.tone}>{statusLabelForTone(item.tone)}</ToneBadge>
                  </span>
                  <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  <span className="hidden sm:inline">{item.actionLabel}</span>
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:p-5">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Research basis
            </p>
            <h2 className="break-words text-lg font-semibold text-foreground">
              Tenant-health source references
            </h2>
          </div>
          <p className="max-w-2xl break-words text-sm text-muted-foreground">
            Estate health combines compatible dashboard structure with source-available reliability
            and back-office patterns.
          </p>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {viewModel.sourceReferences.map((reference) => (
            <a
              key={reference.source}
              className="group grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-muted p-3 transition hover:bg-bg-default"
              href={reference.href}
              rel="noreferrer"
              target="_blank"
            >
              <span className="flex min-w-0 items-center justify-between gap-2">
                <span className="break-words text-sm font-semibold text-foreground">
                  {reference.source}
                </span>
                <ArrowUpRightIcon
                  className="size-3.5 shrink-0 text-muted-foreground transition group-hover:text-foreground"
                  aria-hidden="true"
                />
              </span>
              <span className="break-words text-xs leading-4 text-muted-foreground">
                {reference.role}
              </span>
              <span className="inline-flex w-fit rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {reference.licenseUse.replace("-", " ")}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
