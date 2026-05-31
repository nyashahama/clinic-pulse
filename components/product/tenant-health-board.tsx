"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  MapIcon,
  PlugZapIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import type {
  TenantHealthAction,
  TenantHealthDistrictRow,
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

const toneCardClassName: Record<TenantHealthTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50/55 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-destructive/35 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50/55 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100",
};

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

function statusLabelForTone(tone: TenantHealthTone) {
  return tone === "clear" ? "Clear" : "Open";
}

function ActionIcon({ action }: { action: TenantHealthAction }) {
  const iconClassName = "size-4";

  if (action.icon === "shield") {
    return <ShieldCheckIcon className={iconClassName} />;
  }

  if (action.icon === "plug") {
    return <PlugZapIcon className={iconClassName} />;
  }

  return <ActivityIcon className={iconClassName} />;
}

function actionHandoffDetail(action: TenantHealthAction) {
  if (action.href === "/admin/reporting-coverage") {
    return "Review fresh-report coverage, receipt gaps, and district exceptions.";
  }

  if (action.href === "/admin/security") {
    return "Inspect privileged access, credential drift, and webhook risk evidence.";
  }

  if (action.href === "/admin/partner-readiness") {
    return "Check partner keys, webhook delivery, and external launch readiness.";
  }

  return "Open the linked readiness workspace for the next operational handoff.";
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

type SelectedEstateItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: TenantHealthTone;
  href: string;
  actionLabel: string;
  metadataLabel: string;
};

function toSelectedSignal(signal: TenantHealthSignal): SelectedEstateItem {
  return {
    id: `signal-${signal.id}`,
    label: signal.label,
    value: signal.value,
    detail: signal.detail,
    tone: signal.tone,
    href: signal.href,
    actionLabel: signal.actionLabel,
    metadataLabel: "Estate signal",
  };
}

function toSelectedDistrict(row: TenantHealthDistrictRow): SelectedEstateItem {
  return {
    id: `district-${row.id}`,
    label: row.district,
    value: `${row.readinessPercent}% fresh`,
    detail: row.detail,
    tone: row.tone,
    href: "/admin/reporting-coverage",
    actionLabel: "Review district coverage",
    metadataLabel: `${row.clinics} clinics / ${row.pendingReports} pending reports`,
  };
}

export function TenantHealthBoard({ viewModel }: TenantHealthBoardProps) {
  const leadSignal = viewModel.signalLedger.items.find(
    (item) => item.tone === "blocked" || item.tone === "attention",
  ) ?? viewModel.signalLedger.items[0];
  const secondaryActions = viewModel.actions.filter(
    (action) => action.priority === "secondary",
  );
  const selectedItems = useMemo(() => {
    const items: SelectedEstateItem[] = [];

    for (const signal of viewModel.signalLedger.items) {
      items.push(toSelectedSignal(signal));
    }

    for (const row of viewModel.districtStack.rows) {
      items.push(toSelectedDistrict(row));
    }

    return items;
  }, [viewModel.districtStack.rows, viewModel.signalLedger.items]);
  const defaultSelectedId = leadSignal ? `signal-${leadSignal.id}` : selectedItems[0]?.id;
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const selectedItem =
    selectedItems.find((item) => item.id === selectedId) ?? selectedItems[0] ?? null;
  const selectedReviewed = selectedItem ? reviewedIds.includes(selectedItem.id) : false;

  function markSelectedReviewed() {
    if (!selectedItem || selectedReviewed) {
      return;
    }

    setReviewedIds((current) => [...current, selectedItem.id]);
  }

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-admin-module="tenant-health">
      <section
        aria-label="Tenant estate readiness map"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="grid min-w-0 gap-5 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {viewModel.header.eyebrow}
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                Tenant estate health map
              </h1>
              <p className="mt-3 max-w-4xl break-words text-sm leading-6 text-muted-foreground">
                {viewModel.header.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ToneBadge tone="info">{viewModel.header.scope}</ToneBadge>
                <ToneBadge tone={viewModel.header.score.tone}>
                  {viewModel.header.score.detail}
                </ToneBadge>
              </div>
            </div>

            {selectedItem ? (
              <section
                aria-label="Tenant health active issue"
                className={cn(
                  "sticky top-3 z-10 grid min-w-0 gap-3 rounded-lg border p-3 shadow-sm md:static md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:shadow-none",
                  toneCardClassName[selectedItem.tone],
                )}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-normal text-current/70">
                    Active issue
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold leading-tight">
                    {selectedItem.label}
                  </p>
                  <p className="mt-1 break-words text-xs leading-4 text-current/75">
                    {selectedItem.detail}
                  </p>
                </div>
                <Link
                  className="inline-flex w-fit items-center gap-1 rounded-md bg-bg-default/80 px-3 py-1.5 text-xs font-semibold text-current shadow-sm transition hover:bg-bg-default"
                  href={selectedItem.href}
                >
                  {selectedItem.actionLabel}
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </section>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
              <div
                className={cn(
                  "min-w-0 rounded-lg border p-4",
                  toneCardClassName[viewModel.header.score.tone],
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-normal text-current/70">
                  {viewModel.header.score.label}
                </p>
                <p className="mt-2 font-mono text-5xl font-semibold leading-none text-current">
                  {viewModel.header.score.value}
                </p>
                <p className="mt-3 break-words text-sm leading-5 text-current/75">
                  {selectedItem
                    ? `Selected signal: ${selectedItem.label}`
                    : leadSignal
                      ? `Lead signal: ${leadSignal.label}`
                      : "No lead signal selected"}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {viewModel.metrics.map((metric) => (
                  <Link
                    className={cn(
                      "group min-w-0 rounded-lg border px-3 py-2 transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                      toneCardClassName[metric.tone],
                    )}
                    href={
                      metric.label === "Tenant readiness"
                        ? "/admin/reporting-coverage"
                        : metric.label === "Access review load"
                          ? "/admin/access-review"
                          : metric.label === "Open health signals"
                            ? "/admin/data-ingestion"
                            : "/admin/tenant-health"
                    }
                    key={metric.label}
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
                      <ArrowRightIcon
                        className="size-4 shrink-0 transition group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-1 break-words text-xs leading-4 text-current/75">
                      {metric.detail}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {selectedItem ? (
              <section
                aria-label="Selected estate signal"
                className="grid min-w-0 gap-3 rounded-lg border border-border-subtle bg-bg-muted/25 p-3"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      Selected estate signal
                    </p>
                    <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                      {selectedItem.label}
                    </h2>
                    <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                      {selectedItem.detail}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {selectedReviewed ? (
                      <ToneBadge tone="clear">Reviewed for this session</ToneBadge>
                    ) : null}
                    <button
                      className="inline-flex items-center justify-center rounded-md border border-border-subtle bg-bg-default px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={markSelectedReviewed}
                      type="button"
                    >
                      Mark estate signal reviewed
                    </button>
                  </div>
                </div>

                <div className={cn("rounded-lg border p-3", toneCardClassName[selectedItem.tone])}>
                  <p className="text-xs font-semibold uppercase tracking-normal text-current/70">
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

                <section className="rounded-lg border border-border-subtle bg-bg-default p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {viewModel.commandBrief.timeline.title}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {viewModel.commandBrief.timeline.items.map((item) => (
                      <div
                        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md bg-bg-muted/35 p-2"
                        key={`${item.label}-${item.title}`}
                      >
                        <span
                          className={cn(
                            "mt-1 size-2.5 rounded-full",
                            item.tone === "stable"
                              ? toneRailClassName.clear
                              : item.tone === "critical"
                                ? toneRailClassName.blocked
                                : item.tone === "info"
                                  ? toneRailClassName.info
                                  : toneRailClassName.attention,
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block break-words text-sm font-semibold text-foreground">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block break-words text-xs leading-4 text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </section>
            ) : null}
          </div>

          <aside
            aria-label="Estate signal switchboard"
            className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Estate signal switchboard
                </p>
                <h2 className="mt-1 break-words text-base font-semibold text-foreground">
                  {viewModel.signalLedger.title}
                </h2>
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  {viewModel.signalLedger.description}
                </p>
              </div>
              <SlidersHorizontalIcon className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-2">
              {viewModel.signalLedger.items.map((item) => {
                const selected = selectedItem?.id === `signal-${item.id}`;

                return (
                  <button
                    aria-label={`Select estate signal ${item.label}`}
                    aria-pressed={selected}
                    className={cn(
                      "group relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-lg border border-border-subtle bg-bg-default p-3 text-left transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected && "ring-2 ring-ring/45",
                    )}
                    key={item.id}
                    onClick={() => setSelectedId(`signal-${item.id}`)}
                    type="button"
                  >
                    <span
                      className={cn("absolute inset-y-0 left-0 w-1", toneRailClassName[item.tone])}
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
                        <span className="break-words text-sm font-semibold text-foreground">
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
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
        <section
          aria-label="District readiness heatmap"
          className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <div className="border-b border-border-subtle p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-2">
              <MapIcon className="size-4 shrink-0 text-muted-foreground" />
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
              <button
                aria-label={`Select district readiness ${row.district}`}
                aria-pressed={selectedItem?.id === `district-${row.id}`}
                className={cn(
                  "grid min-w-0 gap-3 p-4 text-left transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:grid-cols-[minmax(12rem,1fr)_minmax(14rem,1.2fr)_auto] md:items-center",
                  selectedItem?.id === `district-${row.id}` && "bg-bg-muted/70",
                )}
                key={row.id}
                onClick={() => setSelectedId(`district-${row.id}`)}
                type="button"
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
              </button>
            ))}
          </div>
        </section>

        <section
          aria-label="Readiness handoff queue"
          className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <div className="border-b border-border-subtle p-4 sm:p-5">
            <h2 className="break-words text-base font-semibold leading-tight text-foreground">
              Readiness handoff queue
            </h2>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
              Escalate from estate health into the workspaces that own each unresolved readiness
              signal.
            </p>
          </div>
          <div className="grid gap-3 p-3">
            {secondaryActions.map((action) => (
              <Link
                className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-lg border border-border-subtle bg-bg-muted/35 p-3 transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={action.href}
                key={action.href}
              >
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-default text-teal-700"
                  aria-hidden="true"
                >
                  <ActionIcon action={action} />
                </span>
                <span className="min-w-0">
                  <span className="break-words text-sm font-semibold text-foreground">
                    {action.label}
                  </span>
                  <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                    {actionHandoffDetail(action)}
                  </span>
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  <span className="hidden sm:inline">Open</span>
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
