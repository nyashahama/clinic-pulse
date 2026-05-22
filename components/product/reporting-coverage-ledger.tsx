import Link from "next/link";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  FileTextIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AdminEvidenceLinkedRow } from "@/components/product/admin-evidence-linked-row";
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
  ReportingCoverageMetric,
  ReportingCoverageTone,
  ReportingCoverageViewModel,
} from "@/lib/product/reporting-coverage";
import { cn } from "@/lib/utils";

type ReportingCoverageLedgerProps = {
  viewModel: ReportingCoverageViewModel;
};

const toneRailClassName: Record<ReportingCoverageTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
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

const readinessPanelClassName: Record<ReportingCoverageTone, string> = {
  clear: "border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20",
  attention: "border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20",
  blocked: "border-destructive/35 bg-destructive/5 dark:border-destructive/50 dark:bg-destructive/15",
  info: "border-sky-300 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/20",
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

function metricIcon(metric: ReportingCoverageMetric) {
  const className = "size-4";

  if (metric.label.includes("Fresh")) {
    return <CheckCircle2Icon className={className} />;
  }

  if (metric.label.includes("Validation")) {
    return <TriangleAlertIcon className={className} />;
  }

  if (metric.label.includes("Pending")) {
    return <FileTextIcon className={className} />;
  }

  return <DatabaseIcon className={className} />;
}

function CoverageMetricCard({ metric }: { metric: ReportingCoverageMetric }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
      <div className={cn("h-1", toneRailClassName[metric.tone])} aria-hidden="true" />
      <div className="grid min-h-[6.5rem] gap-3 p-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {metric.label}
          </p>
          <span
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
              toneBadgeClassName[metric.tone],
            )}
            aria-hidden="true"
          >
            {metricIcon(metric)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[1.65rem] font-semibold leading-none text-foreground">
            {metric.value}
          </p>
          <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
            {metric.detail}
          </p>
        </div>
      </div>
    </article>
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

function EvidenceReceipt({
  receipt,
}: {
  receipt: ReportingCoverageEvidenceReceipt | null;
}) {
  if (!receipt) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
        <p className="text-sm font-medium text-foreground">No coverage receipt selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Coverage receipts appear when clinic status evidence exists in the ledger.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
      <div className="border-b border-border-subtle px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Evidence receipt
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
      </div>
    </section>
  );
}

function trustToneToAdminTone(tone: ReportingCoverageViewModel["ledger"]["rows"][number]["trust"]["tone"]): AdminTone {
  return tone;
}

export function ReportingCoverageLedger({ viewModel }: ReportingCoverageLedgerProps) {
  return (
    <div className="grid min-w-0 gap-4 pb-6" data-admin-module="reporting-coverage">
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
              <ToneBadge tone={viewModel.header.readiness.tone}>
                {viewModel.header.readiness.detail}
              </ToneBadge>
            </div>
          </div>
          <div
            className={cn(
              "grid min-w-0 content-between gap-4 border-t p-4 lg:border-l lg:border-t-0 sm:p-5",
              readinessPanelClassName[viewModel.header.readiness.tone],
            )}
          >
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {viewModel.header.readiness.label}
                </p>
                <ToneBadge tone={viewModel.header.readiness.tone}>
                  {viewModel.header.readiness.tone === "clear" ? "Clear" : "Needs review"}
                </ToneBadge>
              </div>
              <p className="mt-2 font-mono text-4xl font-semibold leading-none text-foreground">
                {viewModel.header.readiness.value}
              </p>
              <p className="mt-3 max-w-sm break-words text-xs leading-4 text-muted-foreground">
                {viewModel.header.syncWindow}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {viewModel.actions.map((action) => (
                <Link
                  className={cn(
                    buttonVariants({
                      size: "sm",
                      variant: action.priority === "primary" ? "default" : "outline",
                    }),
                    "justify-between gap-2",
                  )}
                  href={action.href}
                  key={action.href}
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    {action.priority === "primary" ? (
                      <RadioTowerIcon className="size-3.5" />
                    ) : (
                      <ShieldCheckIcon className="size-3.5" />
                    )}
                    <span className="truncate">{action.label}</span>
                  </span>
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Reporting coverage metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {viewModel.metrics.map((metric) => (
          <CoverageMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <CoverageComposition items={viewModel.composition} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
        <DistrictCoverageMatrix viewModel={viewModel.districtMatrix} />
        <EvidenceReceipt receipt={viewModel.evidenceReceipt} />
      </div>

      <section
        aria-label={viewModel.ledger.title}
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="break-words text-base font-semibold text-foreground">
            Clinic coverage ledger
          </h2>
          <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
            {viewModel.ledger.description}
          </p>
        </div>
        <Table className="table-fixed">
          <TableHeader className="bg-bg-muted/60">
            <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
              <TableHead className="h-11 whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Clinic
              </TableHead>
              <TableHead className="h-11 whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Status / freshness
              </TableHead>
              <TableHead className="h-11 whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Evidence receipt
              </TableHead>
              <TableHead className="h-11 whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Data trust
              </TableHead>
              <TableHead className="h-11 whitespace-normal break-words px-3 align-top text-xs font-semibold uppercase tracking-normal text-content-default">
                Ledger note
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-subtle [&_tr]:border-0">
            {viewModel.ledger.rows.map((row) => (
              <AdminEvidenceLinkedRow
                ariaLabel={`Open ${row.clinicName} clinic detail`}
                className="hover:bg-bg-muted/60"
                href={row.clinicHref}
                key={row.clinicId}
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
                  {row.evidenceNote}
                </TableCell>
              </AdminEvidenceLinkedRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
