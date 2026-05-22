"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClipboardCheckIcon,
  FileSearchIcon,
  ListChecksIcon,
  RadioTowerIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { AdminStatusBadge, type AdminTone } from "@/components/product/admin-module";
import { cn } from "@/lib/utils";

export type DataIngestionStage = {
  id: string;
  label: string;
  count: number;
  tone: AdminTone;
  description: string;
  blocker: string;
};

export type DataIngestionTriageItem = {
  id: string;
  stageId: string;
  stageLabel: string;
  stageTone: AdminTone;
  clinicId: string;
  clinicLabel: string;
  reporterLabel: string;
  sourceLabel: string;
  evidence: string;
  submittedLabel: string;
  receivedLabel: string;
  reviewLabel: string;
  reviewTone: AdminTone;
  trustLabel: string;
  trustTone: AdminTone;
  trustDescription: string;
  actionLabel: string;
  blockerLabel: string;
  clinicHref: string;
  receiptTrail: string[];
  payloadChecks: string[];
};

export type DataIngestionWorkspaceSummary = {
  readinessLabel: string;
  pendingLabel: string;
  offlineQueueLabel: string;
  validationFailureLabel: string;
  syncWindowLabel: string;
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
  summary: DataIngestionWorkspaceSummary;
  stages: DataIngestionStage[];
  items: DataIngestionTriageItem[];
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

function stageIcon(stageId: string) {
  const className = "size-4";

  if (stageId === "validated") {
    return <ShieldAlertIcon className={className} />;
  }

  if (stageId === "reviewed") {
    return <ClipboardCheckIcon className={className} />;
  }

  if (stageId === "promoted" || stageId === "reconciled") {
    return <CheckCircle2Icon className={className} />;
  }

  return <RadioTowerIcon className={className} />;
}

export function DataIngestionWorkspace({
  summary,
  stages,
  items,
  diagnostics,
  backlogItems,
}: DataIngestionWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );
  const itemsByStage = useMemo(
    () =>
      stages.map((stage) => ({
        stage,
        items: items.filter((item) => item.stageId === stage.id),
      })),
    [items, stages],
  );

  return (
    <section
      aria-label="Ingestion pipeline control tower"
      className="overflow-hidden rounded-xl border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="relative overflow-hidden border-b border-border-subtle bg-slate-950 px-5 py-5 text-white">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.32),transparent_45%),linear-gradient(135deg,transparent,rgba(245,158,11,0.16))]" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">
              Ingestion control tower
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Pipeline pressure map
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Follow each report from capture to reconciliation. Inspect evidence first, then open
              clinic context only when the source payload needs a local record check.
            </p>
          </div>
          <div className="grid min-w-[18rem] gap-2 rounded-xl border border-white/10 bg-white/10 p-3 text-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Readiness</span>
              <span className="font-mono font-semibold">{summary.readinessLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Pending evidence</span>
              <span className="font-mono font-semibold">{summary.pendingLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Offline queue</span>
              <span className="font-mono font-semibold">{summary.offlineQueueLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Validation failures</span>
              <span className="font-mono font-semibold">{summary.validationFailureLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Window</span>
              <span className="font-mono text-xs font-semibold">{summary.syncWindowLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-border-subtle bg-bg-muted/30 p-4 lg:grid-cols-5">
        {stages.map((stage, index) => (
          <article
            key={stage.id}
            className={cn(
              "relative min-w-0 overflow-hidden rounded-xl border bg-bg-default p-4 shadow-sm",
              tonePanelClassName[stage.tone],
            )}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-white/60">
                {stageIcon(stage.id)}
              </span>
              <span className="font-mono text-2xl font-semibold leading-none">{stage.count}</span>
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-normal">{stage.label}</p>
            <p className="mt-2 min-h-10 text-xs leading-5 opacity-80">{stage.description}</p>
            <p className="mt-3 rounded-lg border border-current/15 bg-white/45 px-2 py-1 text-xs font-medium">
              {stage.blocker}
            </p>
            {index < stages.length - 1 ? (
              <div
                className={cn(
                  "absolute -right-2 top-1/2 hidden h-0.5 w-4 lg:block",
                  toneRailClassName[stage.tone],
                )}
                aria-hidden="true"
              />
            ) : null}
          </article>
        ))}
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section aria-label="Pending report queue" className="flex min-w-0 flex-col gap-3 self-start">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Triage lanes
              </p>
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                Pending report evidence by pipeline stage
              </h3>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Each case belongs to one clinic and one blocked stage. Use Inspect evidence to drive
              the console without leaving the page.
            </p>
          </div>

          <div className="grid gap-3">
            {itemsByStage.map(({ stage, items: stageItems }) =>
              stageItems.length ? (
                <section key={stage.id} className="rounded-xl border border-border-subtle bg-bg-muted/20 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", toneRailClassName[stage.tone])} />
                      <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                    </div>
                    <AdminStatusBadge tone={stage.tone}>{stage.blocker}</AdminStatusBadge>
                  </div>
                  <div className="grid gap-2">
                    {stageItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;

                      return (
                        <article
                          key={item.id}
                          aria-label={`Ingestion case for ${item.clinicId}`}
                          className={cn(
                            "grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-3 transition md:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_auto]",
                            isSelected && "border-amber-300 bg-amber-50/55 shadow-sm",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-foreground">
                              {item.clinicLabel}
                            </p>
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
                              <AdminStatusBadge tone={item.stageTone}>{item.stageLabel}</AdminStatusBadge>
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
                    })}
                  </div>
                </section>
              ) : null,
            )}
          </div>
        </section>

        <aside
          aria-label="Ingestion evidence console"
          className="overflow-hidden rounded-xl border border-border-subtle bg-bg-default shadow-sm"
        >
          <div className="border-b border-border-subtle bg-bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Evidence console
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Receipt, trail, and payload checks
            </h3>
          </div>
          {selectedItem ? (
            <div className="grid gap-4 p-4">
              <div className="rounded-xl border border-border-subtle bg-slate-950 p-4 text-white">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <FileSearchIcon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-lg font-semibold">{selectedItem.clinicLabel}</p>
                    <p className="mt-1 break-words font-mono text-xs text-slate-300">
                      {selectedItem.clinicId}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-normal text-slate-300">Blocked stage</p>
                    <p className="mt-1 font-semibold">{selectedItem.stageLabel}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-normal text-slate-300">Next action</p>
                    <p className="mt-1 font-semibold">{selectedItem.actionLabel}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border-subtle bg-bg-muted/25 p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Review state
                  </p>
                  <div className="mt-2">
                    <AdminStatusBadge tone={selectedItem.reviewTone}>
                      {selectedItem.reviewLabel}
                    </AdminStatusBadge>
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
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[0.65rem] font-semibold text-white">
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
              No ingestion case is currently selected.
            </div>
          )}
        </aside>
      </div>

      <div className="grid gap-4 border-t border-border-subtle bg-bg-muted/25 p-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section
          aria-label="Ingestion signal diagnostics"
          className="overflow-hidden rounded-xl border border-border-subtle bg-bg-default shadow-sm"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Operational diagnostics
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Ingestion signal evidence
            </h3>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {diagnostics.map((diagnostic) => (
              <article
                key={diagnostic.id}
                className={cn(
                  "min-w-0 rounded-xl border p-3",
                  tonePanelClassName[diagnostic.tone],
                )}
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
              Clinic backlog
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Freshness and confirmation follow-up
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
                      <AdminStatusBadge tone={item.freshnessTone}>
                        {item.freshnessLabel}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone={item.trustTone}>{item.trustLabel}</AdminStatusBadge>
                    </div>
                    <p className="break-words text-xs leading-5 text-muted-foreground">
                      {item.trustDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last update {item.lastUpdateLabel}
                    </p>
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
