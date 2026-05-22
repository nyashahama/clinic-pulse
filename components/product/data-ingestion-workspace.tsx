"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClipboardListIcon,
  FileSearchIcon,
  ListChecksIcon,
  RadioTowerIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { AdminStatusBadge, type AdminTone } from "@/components/product/admin-module";
import { cn } from "@/lib/utils";

export type DataIngestionSummaryMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
};

export type DataIngestionLedgerItem = {
  id: string;
  clinicId: string;
  clinicLabel: string;
  reporterLabel: string;
  sourceLabel: string;
  evidence: string;
  submittedLabel: string;
  receivedLabel: string;
  issueLabel: string;
  issueTone: AdminTone;
  reviewLabel: string;
  reviewTone: AdminTone;
  trustLabel: string;
  trustTone: AdminTone;
  trustDescription: string;
  actionLabel: string;
  clinicHref: string;
  receiptTrail: string[];
  payloadChecks: string[];
};

export type DataIngestionDiagnostic = {
  id: string;
  label: string;
  value: string;
  evidence: string;
  tone: AdminTone;
  windowLabel: string;
};

export type DataIngestionBacklogItem = {
  id: string;
  clinicName: string;
  district: string;
  freshnessLabel: string;
  freshnessTone: AdminTone;
  trustLabel: string;
  trustTone: AdminTone;
  trustDescription: string;
  lastUpdateLabel: string;
  clinicHref: string;
};

type DataIngestionWorkspaceProps = {
  metrics: DataIngestionSummaryMetric[];
  items: DataIngestionLedgerItem[];
  diagnostics: DataIngestionDiagnostic[];
  backlogItems: DataIngestionBacklogItem[];
};

const toneRailClassName: Record<AdminTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

const tonePanelClassName: Record<AdminTone, string> = {
  clear: "border-emerald-200 bg-emerald-50/70 text-emerald-950",
  attention: "border-amber-200 bg-amber-50/70 text-amber-950",
  blocked: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-sky-200 bg-sky-50/70 text-sky-950",
};

function metricIcon(metricId: string) {
  const className = "size-4";

  if (metricId === "validation-failures") {
    return <ShieldAlertIcon className={className} />;
  }

  if (metricId === "pending-report-evidence") {
    return <ClipboardListIcon className={className} />;
  }

  if (metricId === "offline-queue") {
    return <RadioTowerIcon className={className} />;
  }

  return <CheckCircle2Icon className={className} />;
}

export function DataIngestionWorkspace({
  metrics,
  items,
  diagnostics,
  backlogItems,
}: DataIngestionWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  return (
    <section aria-label="Ingestion evidence workspace" className="grid gap-4">
      <section className="overflow-hidden rounded-xl border border-border-subtle bg-bg-default text-content-default shadow-sm">
        <div className="grid gap-4 border-b border-border-subtle px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Ingestion workspace
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">
              Ingestion evidence ledger
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review field reports, validation blockers, offline intake, and stale clinic evidence
              from one ledger. Inspect evidence without leaving the page; open clinic context only
              when the source record needs investigation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border-subtle bg-bg-muted px-3 py-1">
              {items.length} ledger rows
            </span>
            <span className="rounded-full border border-border-subtle bg-bg-muted px-3 py-1">
              {backlogItems.length} clinic backlog
            </span>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border-subtle bg-bg-muted/30 p-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.id}
              className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-default shadow-sm"
            >
              <div className={cn("h-1", toneRailClassName[metric.tone])} aria-hidden="true" />
              <div className="grid gap-3 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {metric.label}
                  </p>
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      tonePanelClassName[metric.tone],
                    )}
                    aria-hidden="true"
                  >
                    {metricIcon(metric.id)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-2xl font-semibold leading-none text-foreground">
                    {metric.value}
                  </p>
                  <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
                    {metric.detail}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <section aria-label="Pending report queue" className="flex min-w-0 flex-col gap-3 self-start">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Primary ledger
                </p>
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                  Pending report evidence
                </h3>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">
                Rows are ingestion events. The clinic link is explicit so receipt review does not
                accidentally become navigation.
              </p>
            </div>

            <div className="grid gap-2">
              {items.length ? (
                items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <article
                      key={item.id}
                      aria-label={`Ingestion event for ${item.clinicId}`}
                      className={cn(
                        "grid gap-3 rounded-xl border border-border-subtle bg-bg-default p-3 transition md:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_auto]",
                        isSelected && "border-amber-300 bg-amber-50/55 shadow-sm",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-foreground">{item.clinicLabel}</p>
                        <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                          {item.clinicId}
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {item.reporterLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.sourceLabel}</p>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <p className="break-words text-sm text-foreground">{item.evidence}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <AdminStatusBadge tone={item.issueTone}>{item.issueLabel}</AdminStatusBadge>
                          <AdminStatusBadge tone={item.reviewTone}>{item.reviewLabel}</AdminStatusBadge>
                          <AdminStatusBadge tone={item.trustTone}>{item.trustLabel}</AdminStatusBadge>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          Submitted {item.submittedLabel}; received {item.receivedLabel}
                        </p>
                      </div>
                      <div className="flex min-w-[10rem] flex-col items-start justify-between gap-3">
                        <p className="text-sm text-muted-foreground">{item.actionLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={`Inspect evidence for ${item.clinicId}`}
                            className={cn(
                              "inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold transition",
                              isSelected
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : "border border-border-subtle bg-bg-default text-foreground hover:bg-bg-muted",
                            )}
                            onClick={() => setSelectedId(item.id)}
                          >
                            Inspect evidence
                          </button>
                          <Link
                            href={item.clinicHref}
                            aria-label={`Open clinic context for ${item.clinicId}`}
                            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-subtle bg-bg-default px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-muted"
                          >
                            Open clinic
                            <ArrowRightIcon className="size-3" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-xl border border-border-subtle bg-bg-muted/25 p-4 text-sm text-muted-foreground">
                  No pending report evidence needs review.
                </div>
              )}
            </div>
          </section>

          <aside
            aria-label="Ingestion evidence console"
            className="overflow-hidden rounded-xl border border-border-subtle bg-bg-default shadow-sm"
          >
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Evidence inspector
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
                Receipt and payload checks
              </h3>
            </div>
            {selectedItem ? (
              <div className="grid gap-4 p-4">
                <div className="rounded-xl border border-border-subtle bg-bg-muted/30 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-default text-muted-foreground">
                      <FileSearchIcon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-lg font-semibold text-foreground">
                        {selectedItem.clinicLabel}
                      </p>
                      <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                        {selectedItem.clinicId}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-border-subtle bg-bg-default p-3">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      Recommended action
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {selectedItem.actionLabel}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border-subtle bg-bg-muted/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      Ingestion issue
                    </p>
                    <div className="mt-2">
                      <AdminStatusBadge tone={selectedItem.issueTone}>{selectedItem.issueLabel}</AdminStatusBadge>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-bg-muted/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      Data trust
                    </p>
                    <div className="mt-2 space-y-2">
                      <AdminStatusBadge tone={selectedItem.trustTone}>{selectedItem.trustLabel}</AdminStatusBadge>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {selectedItem.trustDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <section className="rounded-xl border border-border-subtle bg-bg-muted/25 p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Receipt trail
                  </p>
                  <ol className="mt-3 grid gap-2 text-sm text-foreground">
                    {selectedItem.receiptTrail.map((entry, index) => (
                      <li key={entry} className="flex gap-3 rounded-lg bg-bg-default p-2">
                        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[0.65rem] font-semibold text-background">
                          {index + 1}
                        </span>
                        <span className="break-words">{entry}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-xl border border-border-subtle bg-bg-muted/25 p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Payload checks
                  </p>
                  <div className="mt-3 grid gap-2">
                    {selectedItem.payloadChecks.map((check) => (
                      <div key={check} className="flex items-start gap-2 rounded-lg bg-bg-default p-2 text-sm">
                        <CircleDotIcon className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                        <span className="break-words text-foreground">{check}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <Link
                  href={selectedItem.clinicHref}
                  aria-label={`Open clinic context for ${selectedItem.clinicId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                >
                  Open clinic context
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                No ingestion event is currently selected.
              </div>
            )}
          </aside>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section
          aria-label="Ingestion signal diagnostics"
          className="overflow-hidden rounded-xl border border-border-subtle bg-bg-default shadow-sm"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Supporting diagnostics
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Ingestion signal evidence
            </h3>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {diagnostics.map((diagnostic) => (
              <article
                key={diagnostic.id}
                className={cn("min-w-0 rounded-xl border p-3", tonePanelClassName[diagnostic.tone])}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">{diagnostic.label}</p>
                    <p className="mt-2 break-words text-xs leading-5 opacity-80">
                      {diagnostic.evidence}
                    </p>
                  </div>
                  <span className="font-mono text-2xl font-semibold leading-none">
                    {diagnostic.value}
                  </span>
                </div>
                <p className="mt-3 rounded-lg border border-current/15 bg-white/45 px-2 py-1 text-xs font-medium">
                  Window started {diagnostic.windowLabel}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-label="Clinic freshness backlog"
          className="overflow-hidden rounded-xl border border-border-subtle bg-bg-default shadow-sm"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Linked backlog
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Clinic freshness follow-up
            </h3>
          </div>
          <div className="grid gap-3 p-4">
            {backlogItems.length ? (
              backlogItems.map((item) => (
                <article
                  key={item.id}
                  aria-label={`Open ${item.clinicName} clinic ingestion detail`}
                  className="grid gap-3 rounded-xl border border-border-subtle bg-bg-muted/20 p-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-foreground">{item.clinicName}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">{item.district}</p>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <AdminStatusBadge tone={item.freshnessTone}>{item.freshnessLabel}</AdminStatusBadge>
                      <AdminStatusBadge tone={item.trustTone}>{item.trustLabel}</AdminStatusBadge>
                    </div>
                    <p className="break-words text-xs leading-5 text-muted-foreground">
                      {item.trustDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">Last update {item.lastUpdateLabel}</p>
                  </div>
                  <Link
                    href={item.clinicHref}
                    aria-label={`Open ${item.clinicName} clinic ingestion detail`}
                    className="inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-border-subtle bg-bg-default px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-bg-muted"
                  >
                    Open clinic
                    <ArrowRightIcon className="size-3" aria-hidden="true" />
                  </Link>
                </article>
              ))
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-muted/25 p-4 text-sm text-muted-foreground">
                <ListChecksIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>All clinic current-status records have usable freshness evidence.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
