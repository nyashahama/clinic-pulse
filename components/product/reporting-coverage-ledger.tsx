"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  FileTextIcon,
  ListFilterIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AdminStatusBadge, type AdminTone } from "@/components/product/admin-module";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import type {
  ReportingCoverageCompositionItem,
  ReportingCoverageEvidenceReceipt,
  ReportingCoverageTone,
  ReportingCoverageViewModel,
} from "@/lib/product/reporting-coverage";
import { cn } from "@/lib/utils";

type ReportingCoverageLedgerProps = {
  viewModel: ReportingCoverageViewModel;
};

type CoverageLedgerFilter = "all" | "attention" | "pending_review" | "fresh";

const toneRailClassName: Record<ReportingCoverageTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

const toneBorderClassName: Record<ReportingCoverageTone, string> = {
  clear: "border-l-emerald-500",
  attention: "border-l-amber-500",
  blocked: "border-l-destructive",
  info: "border-l-sky-500",
};

const toneBadgeClassName: Record<ReportingCoverageTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

function ToneBadge({
  children,
  tone,
}: {
  children: string;
  tone: ReportingCoverageTone;
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

function compositionIcon(item: ReportingCoverageCompositionItem) {
  if (item.id === "fresh") {
    return <CheckCircle2Icon className="size-3.5" />;
  }

  if (item.id === "pending_review") {
    return <FileTextIcon className="size-3.5" />;
  }

  return <ActivityIcon className="size-3.5" />;
}

function CoverageComposition({
  items,
}: {
  items: ReportingCoverageViewModel["composition"];
}) {
  return (
    <section
      aria-label="Reporting coverage composition"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Coverage composition
            </p>
            <h2 className="mt-1 break-words text-base font-semibold text-foreground">
              Freshness and review mix
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Counts can overlap when fresh evidence is still waiting for review.
          </p>
        </div>
      </div>
      <div className="grid gap-3 p-4">
        <div
          className="flex h-3 min-w-0 overflow-hidden rounded-full bg-bg-muted"
          aria-hidden="true"
        >
          {items.map((item) => (
            <span
              key={item.id}
              className={cn(toneRailClassName[item.tone], item.count === 0 && "opacity-20")}
              style={{ width: `${Math.max(item.percent, item.count > 0 ? 8 : 3)}%` }}
            />
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/35 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-md border",
                    toneBadgeClassName[item.tone],
                  )}
                  aria-hidden="true"
                >
                  {compositionIcon(item)}
                </span>
                <p className="min-w-0 truncate text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold leading-none text-foreground">
                {item.count}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.percent}% of clinics</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function readinessTaskIcon(id: ReportingCoverageViewModel["taskQueue"][number]["id"]) {
  const className = "size-4";

  if (id === "review-field-evidence") {
    return <FileTextIcon className={className} />;
  }

  if (id === "clear-sync-blockers") {
    return <RadioTowerIcon className={className} />;
  }

  if (id === "preserve-evidence-trail") {
    return <ShieldCheckIcon className={className} />;
  }

  return <TriangleAlertIcon className={className} />;
}

function CoverageExceptionBoard({
  viewModel,
}: {
  viewModel: ReportingCoverageViewModel;
}) {
  const review = viewModel.readinessReview;
  const componentRows = viewModel.metrics.map((metric) => ({
    id: metric.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: metric.label,
    detail: metric.detail,
    status:
      metric.tone === "clear"
        ? "Operational"
        : metric.tone === "blocked"
          ? "Blocked"
          : "Needs review",
    tone: metric.tone,
    value: metric.value,
  }));

  return (
    <section
      aria-label="Coverage exception board"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <div className="grid min-w-0 gap-5 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              System admin coverage health
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              Coverage exception board
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Treat reporting coverage like a component-status board: isolate the unhealthy
              parts of the estate, verify the receipt trail, and only then move evidence into
              audit and partner workflows.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ToneBadge tone="info">{viewModel.header.scope}</ToneBadge>
              <ToneBadge tone={viewModel.header.readiness.tone}>
                {viewModel.header.syncWindow}
              </ToneBadge>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]">
            <div
              className={cn(
                "min-w-0 rounded-lg border border-l-4 bg-bg-muted/35 p-3",
                toneBorderClassName[review.readinessPercent === 100 ? "clear" : "attention"],
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Active exception
              </p>
              <p className="mt-2 break-words text-lg font-semibold leading-tight text-foreground">
                {review.activeClinicName}
              </p>
              <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                {review.activeBlocker}: {review.activeDetail}
              </p>
              <p className="mt-3 break-words text-xs leading-4 text-muted-foreground">
                {review.nextStep}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Overall coverage status
              </p>
              <p className="mt-2 font-mono text-4xl font-semibold leading-none text-foreground">
                {review.readinessPercent}%
              </p>
              <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                {viewModel.header.readiness.detail}
              </p>
            </div>
          </div>

          <div aria-label="Coverage component map" className="grid gap-2 md:grid-cols-2">
            {componentRows.map((component) => (
              <div
                key={component.id}
                className={cn(
                  "min-w-0 rounded-lg border px-3 py-2",
                  toneBadgeClassName[component.tone],
                )}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold uppercase tracking-normal text-current/70">
                      {component.label}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-current">
                      {component.status}
                    </p>
                  </div>
                  <span className="font-mono text-lg font-semibold leading-none">
                    {component.value}
                  </span>
                </div>
                <p className="mt-1 break-words text-xs leading-4 text-current/75">
                  {component.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside
          aria-label="Coverage exception queue"
          className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Coverage exception queue
          </p>
          <div className="mt-3 grid gap-2">
            {viewModel.taskQueue.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default transition hover:border-border hover:bg-bg-muted/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
                        toneBadgeClassName[item.tone],
                      )}
                      aria-hidden="true"
                    >
                      {readinessTaskIcon(item.id)}
                    </span>
                    <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                      {item.title}
                    </span>
                  </span>
                  <span className="rounded-md border border-border-subtle bg-bg-muted/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {item.count}
                  </span>
                </div>
                <p className="break-words text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            <Link
              className={cn(buttonVariants({ size: "sm" }), "justify-between")}
              href={review.primaryAction.href}
            >
              <span>{review.primaryAction.label}</span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "justify-between bg-bg-default",
              )}
              href={review.secondaryAction.href}
            >
              <span>{review.secondaryAction.label}</span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function DistrictCoverageMatrix({
  viewModel,
}: {
  viewModel: ReportingCoverageViewModel["districtMatrix"];
}) {
  return (
    <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <RadioTowerIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold text-foreground">
              {viewModel.title}
            </h2>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
              {viewModel.description}
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border-subtle">
        {viewModel.rows.map((row) => (
          <div key={row.district} className="grid gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-medium text-foreground">{row.district}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.clinics} clinics · {row.dominantSource}
                </p>
              </div>
              <ToneBadge tone={row.tone}>{`${row.readinessPercent}% ready`}</ToneBadge>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
                <span
                  className={cn("block h-full", toneRailClassName[row.tone])}
                  style={{ width: `${Math.max(row.readinessPercent, 4)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {row.fresh} fresh · {row.freshnessRisk} freshness risk · {row.pendingReviews} review
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceReceipt({ receipt }: { receipt: ReportingCoverageEvidenceReceipt | null }) {
  if (!receipt) {
    return (
      <section
        aria-label="Evidence receipt inspector"
        className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
      >
        <p className="text-sm font-medium text-foreground">No coverage receipt selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Coverage receipts appear when clinic status evidence exists in the ledger.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Evidence receipt inspector"
      className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Evidence receipt inspector
        </p>
        <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
          {receipt.clinicName}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {receipt.facilityCode} · {receipt.district}
        </p>
      </div>
      <div className="grid gap-4 p-4">
        <div className="rounded-lg border border-border-subtle bg-bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Recommended action
          </p>
          <p className="mt-2 text-sm leading-5 text-foreground">{receipt.recommendedAction}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
          <p className="text-xs font-semibold uppercase tracking-normal">
            Readiness impact
          </p>
          <p className="mt-2 text-sm leading-5">{receipt.readinessImpact}</p>
        </div>
        <div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ToneBadge tone="info">{receipt.posture}</ToneBadge>
            <ToneBadge tone={receipt.timeline.at(-1)?.tone ?? "info"}>
              {receipt.trustLabel}
            </ToneBadge>
          </div>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {receipt.trustDescription}
          </p>
        </div>
        <ol className="grid gap-3 border-l border-border-subtle pl-4">
          {receipt.timeline.map((item) => (
            <li key={item.label} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.35rem] top-1 size-2.5 rounded-full ring-4 ring-bg-default",
                  toneRailClassName[item.tone],
                )}
                aria-hidden="true"
              />
              <div className="grid gap-1">
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="break-words font-mono text-xs text-muted-foreground">
                    {item.value}
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          className={cn(buttonVariants({ size: "sm" }), "w-full justify-between")}
          href={receipt.clinicHref}
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <FileTextIcon className="size-3.5" />
            <span className="truncate">Open clinic detail</span>
          </span>
          <ArrowRightIcon className="size-3.5" />
        </Link>
        {receipt.reportHref ? (
          <Link
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "w-full justify-between",
            )}
            href={receipt.reportHref}
          >
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <FileTextIcon className="size-3.5" />
              <span className="truncate">Open report evidence</span>
            </span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

const LEDGER_ROW_INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
].join(",");

function shouldIgnoreLedgerRowSelection(target: EventTarget | null) {
  return (
    target instanceof HTMLElement && Boolean(target.closest(LEDGER_ROW_INTERACTIVE_SELECTOR))
  );
}

function CoverageLedgerWorkspace({
  evidenceReceipt,
  onSelectReceipt,
  selectedClinicId,
  viewModel,
}: {
  evidenceReceipt: ReportingCoverageEvidenceReceipt | null;
  onSelectReceipt: (clinicId: string) => void;
  selectedClinicId: string | null;
  viewModel: ReportingCoverageViewModel;
}) {
  const [activeFilter, setActiveFilter] = useState<CoverageLedgerFilter>("all");
  const attentionRows = viewModel.ledger.rows.filter((row) => row.trust.tone !== "clear").length;
  const pendingRows = viewModel.ledger.rows.filter(
    (row) => row.reviewState === "pending_review",
  ).length;
  const freshRows = viewModel.ledger.rows.filter((row) => row.freshness === "fresh").length;
  const filteredRows = useMemo(() => {
    switch (activeFilter) {
      case "attention":
        return viewModel.ledger.rows.filter((row) => row.trust.tone !== "clear");
      case "pending_review":
        return viewModel.ledger.rows.filter((row) => row.reviewState === "pending_review");
      case "fresh":
        return viewModel.ledger.rows.filter((row) => row.freshness === "fresh");
      default:
        return viewModel.ledger.rows;
    }
  }, [activeFilter, viewModel.ledger.rows]);
  const filterOptions: Array<{
    count: number;
    id: CoverageLedgerFilter;
    label: string;
    tone: ReportingCoverageTone;
  }> = [
    {
      count: viewModel.ledger.rows.length,
      id: "all",
      label: "All",
      tone: "info",
    },
    {
      count: attentionRows,
      id: "attention",
      label: "Needs attention",
      tone: attentionRows > 0 ? "attention" : "clear",
    },
    {
      count: pendingRows,
      id: "pending_review",
      label: "Pending review",
      tone: pendingRows > 0 ? "attention" : "clear",
    },
    {
      count: freshRows,
      id: "fresh",
      label: "Fresh",
      tone: "clear",
    },
  ];

  return (
    <section
      id="clinic-coverage-ledger"
      className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] xl:items-start"
    >
      <div
        aria-label={viewModel.ledger.title}
        className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid gap-3 border-b border-border-subtle px-4 py-3">
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Coverage workspace
              </p>
              <h2 className="mt-1 break-words text-base font-semibold text-foreground">
                Clinic coverage ledger
              </h2>
              <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                {viewModel.ledger.description}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                <ListFilterIcon className="size-3.5" />
                {viewModel.ledger.rows.length} rows
              </span>
              <ToneBadge tone={attentionRows > 0 ? "attention" : "clear"}>
                {`${attentionRows} need attention`}
              </ToneBadge>
              <ToneBadge tone={pendingRows > 0 ? "attention" : "clear"}>
                {`${pendingRows} pending review`}
              </ToneBadge>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2" aria-label="Coverage ledger filters">
            {filterOptions.map((option) => {
              const isActive = activeFilter === option.id;

              return (
                <button
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? toneBadgeClassName[option.tone]
                      : "border-border-subtle bg-bg-muted/35 text-muted-foreground hover:bg-bg-muted",
                  )}
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  type="button"
                >
                  <span>{option.label}</span>
                  <span className="font-mono">{option.count}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-4 text-muted-foreground">
            Select a row to inspect its evidence receipt. Clinic names open the full clinic detail.
          </p>
        </div>
        <Table className="table-fixed">
          <TableHeader className="bg-bg-muted/60">
            <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
              <TableHead className="h-11 w-[28%] whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Clinic
              </TableHead>
              <TableHead className="h-11 w-[16%] whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                State
              </TableHead>
              <TableHead className="h-11 w-[23%] whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Evidence
              </TableHead>
              <TableHead className="h-11 w-[23%] whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Data trust
              </TableHead>
              <TableHead className="h-11 w-[10%] whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Receipt
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-subtle [&_tr]:border-0">
            {filteredRows.map((row) => {
              const isSelected = row.clinicId === selectedClinicId;

              return (
                <TableRow
                  aria-label={`Inspect coverage receipt for ${row.clinicName}`}
                  className={cn(
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-bg-muted/60",
                    isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/25",
                  )}
                  key={row.clinicId}
                  onClick={(event) => {
                    if (shouldIgnoreLedgerRowSelection(event.target)) {
                      return;
                    }

                    onSelectReceipt(row.clinicId);
                  }}
                  onKeyDown={(event) => {
                    if (
                      shouldIgnoreLedgerRowSelection(event.target) ||
                      (event.key !== "Enter" && event.key !== " ")
                    ) {
                      return;
                    }

                    event.preventDefault();
                    onSelectReceipt(row.clinicId);
                  }}
                  tabIndex={0}
                >
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-content-default">
                    <Link
                      className="group/link inline-flex min-w-0 flex-col rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      href={row.clinicHref}
                    >
                      <span className="font-medium text-primary underline-offset-4 group-hover/link:underline group-focus-visible/link:underline">
                        {row.clinicName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {row.facilityCode} · {row.district}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-content-default">
                    <div className="grid justify-start gap-1.5">
                      <AdminStatusBadge tone={row.trust.tone === "clear" ? "clear" : "attention"}>
                        {row.status}
                      </AdminStatusBadge>
                      <span className="text-xs text-muted-foreground">{row.freshness}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-content-default">
                    <div className="space-y-1 text-sm">
                      <p>{row.lastReportedAt}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.sourceLabel} · {row.reporterName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-content-default">
                    <div className="space-y-1">
                      <AdminStatusBadge tone={trustToneToAdminTone(row.trust.tone)}>
                        {row.trust.label}
                      </AdminStatusBadge>
                      <p className="max-w-xs text-xs leading-4 text-muted-foreground">
                        {row.trust.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-content-default">
                    <div className="grid">
                      <button
                        aria-pressed={isSelected}
                        className={cn(
                          "inline-flex w-full items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border-subtle bg-bg-default text-content-default hover:bg-bg-muted",
                        )}
                        onClick={() => onSelectReceipt(row.clinicId)}
                        type="button"
                      >
                        <span className="sr-only">Inspect receipt</span>
                        <ArrowRightIcon className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                  colSpan={5}
                >
                  No clinics match this coverage filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <div className="xl:sticky xl:top-4">
        <EvidenceReceipt receipt={evidenceReceipt} />
      </div>
    </section>
  );
}

function trustToneToAdminTone(
  tone: ReportingCoverageViewModel["ledger"]["rows"][number]["trust"]["tone"],
): AdminTone {
  return tone;
}

export function ReportingCoverageLedger({ viewModel }: ReportingCoverageLedgerProps) {
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    viewModel.ledger.rows[0]?.clinicId ?? null,
  );
  const selectedEvidenceReceipt = useMemo(() => {
    if (!selectedClinicId) {
      return viewModel.evidenceReceipt;
    }

    return viewModel.evidenceReceiptsByClinicId[selectedClinicId] ?? viewModel.evidenceReceipt;
  }, [selectedClinicId, viewModel.evidenceReceipt, viewModel.evidenceReceiptsByClinicId]);

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-admin-module="reporting-coverage">
      <CoverageExceptionBoard viewModel={viewModel} />

      <CoverageLedgerWorkspace
        evidenceReceipt={selectedEvidenceReceipt}
        onSelectReceipt={setSelectedClinicId}
        selectedClinicId={selectedClinicId}
        viewModel={viewModel}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] xl:items-start">
        <CoverageComposition items={viewModel.composition} />
        <DistrictCoverageMatrix viewModel={viewModel.districtMatrix} />
      </div>
    </div>
  );
}
