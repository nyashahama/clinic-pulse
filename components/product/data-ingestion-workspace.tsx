"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon, FileTextIcon } from "lucide-react";

import {
  AdminEmptyState,
  AdminStatusBadge,
  type AdminTone,
} from "@/components/product/admin-module";
import { cn } from "@/lib/utils";

export type DataIngestionQueueRow = {
  id: string;
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
  clinicHref: string;
};

type DataIngestionWorkspaceProps = {
  rows: DataIngestionQueueRow[];
};

export function DataIngestionWorkspace({ rows }: DataIngestionWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? null);
  const selectedReceipt = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <section
        aria-label="Pending report queue"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Intake queue
              </p>
              <h2 className="mt-1 break-words text-base font-semibold text-foreground">
                Pending report queue
              </h2>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Pending report evidence is selectable here. View the one-clinic receipt
              first, then open clinic context explicitly when needed.
            </p>
          </div>
        </div>

        {rows.length ? (
          <div className="grid gap-3 p-4">
            {rows.map((row) => {
              const isSelected = selectedReceipt?.id === row.id;

              return (
                <article
                  key={row.id}
                  aria-label={`Pending report evidence for ${row.clinicId}`}
                  className={cn(
                    "grid gap-4 rounded-lg border border-border-subtle bg-bg-muted/25 p-4 transition",
                    "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(12rem,0.55fr)]",
                    isSelected && "border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20",
                  )}
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-foreground">{row.clinicLabel}</p>
                    <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                      {row.clinicId}
                    </p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="font-medium text-foreground">{row.reporterLabel}</p>
                      <p className="text-xs text-muted-foreground">{row.sourceLabel}</p>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-3">
                    <p className="break-words text-sm text-foreground">{row.evidence}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <AdminStatusBadge tone={row.reviewTone}>{row.reviewLabel}</AdminStatusBadge>
                      <AdminStatusBadge tone={row.trustTone}>{row.trustLabel}</AdminStatusBadge>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Submitted {row.submittedLabel}; received {row.receivedLabel}
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-col items-start justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{row.actionLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`View evidence receipt for ${row.clinicId}`}
                        className={cn(
                          "inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold transition",
                          isSelected
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : "border border-border-subtle bg-bg-default text-foreground hover:bg-bg-muted",
                        )}
                        onClick={() => setSelectedId(row.id)}
                      >
                        View receipt
                      </button>
                      <Link
                        href={row.clinicHref}
                        aria-label={`Open clinic context for ${row.clinicId}`}
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
        ) : (
          <div className="p-4">
            <AdminEmptyState
              title="No pending report evidence"
              description="Field reports have no pending review pressure in the current scenario state."
            />
          </div>
        )}
      </section>

      <aside
        aria-label="Ingestion receipt"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Evidence receipt
          </p>
          <h2 className="mt-1 break-words text-base font-semibold text-foreground">
            Ingestion receipt
          </h2>
        </div>
        {selectedReceipt ? (
          <div className="grid gap-4 p-4">
            <div className="rounded-lg border border-border-subtle bg-bg-muted/40 p-4">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-default text-muted-foreground"
                  aria-hidden="true"
                >
                  <FileTextIcon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="break-words font-semibold text-foreground">
                    {selectedReceipt.clinicLabel}
                  </p>
                  <p className="mt-1 break-words font-mono text-xs text-muted-foreground">
                    {selectedReceipt.clinicId}
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid gap-3 text-sm">
              <div className="rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
                <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Review state
                </dt>
                <dd className="mt-2">
                  <AdminStatusBadge tone={selectedReceipt.reviewTone}>
                    {selectedReceipt.reviewLabel}
                  </AdminStatusBadge>
                </dd>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
                <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Data trust
                </dt>
                <dd className="mt-2 space-y-2">
                  <AdminStatusBadge tone={selectedReceipt.trustTone}>
                    {selectedReceipt.trustLabel}
                  </AdminStatusBadge>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {selectedReceipt.trustDescription}
                  </p>
                </dd>
              </div>
            </dl>

            <div className="rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Receipt trail
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>{selectedReceipt.evidence}</li>
                <li>Submitted {selectedReceipt.submittedLabel}</li>
                <li>Received {selectedReceipt.receivedLabel}</li>
              </ul>
            </div>

            <Link
              href={selectedReceipt.clinicHref}
              aria-label={`Open clinic context for ${selectedReceipt.clinicId}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Open clinic context
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="p-4">
            <AdminEmptyState
              title="No ingestion receipt selected"
              description="New offline, validation, or late-arriving reports will appear here when they need review."
            />
          </div>
        )}
      </aside>
    </section>
  );
}
