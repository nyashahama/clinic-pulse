"use client";

import Link from "next/link";
import { type ComponentType, type KeyboardEvent, useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  ClipboardCheckIcon,
  FileCheck2Icon,
  RadioTowerIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";

import { AdminStatusBadge } from "@/components/product/admin-module";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  filterAuditEvidenceRows,
  getDefaultAuditEvidenceRowId,
  type AuditEvidenceLaneFilter,
  type AuditEvidenceMetric,
  type AuditEvidencePacket,
  type AuditEvidenceRow,
  type AuditEvidenceStateFilter,
  type AuditEvidenceTone,
  type AuditEvidenceViewModel,
} from "@/lib/product/audit-evidence";
import { cn } from "@/lib/utils";

type AuditEvidenceWorkspaceProps = {
  viewModel: AuditEvidenceViewModel;
};

const laneOptions: Array<{
  id: AuditEvidenceLaneFilter;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "all", label: "All evidence", icon: ShieldCheckIcon },
  { id: "access", label: "Access", icon: UserCheckIcon },
  { id: "report", label: "Reports", icon: ClipboardCheckIcon },
  { id: "sync", label: "Sync", icon: RefreshCwIcon },
  { id: "export", label: "Exports", icon: FileCheck2Icon },
  { id: "webhook", label: "Webhooks", icon: RadioTowerIcon },
  { id: "operating", label: "Operating", icon: ActivityIcon },
];

const stateOptions: Array<{ id: AuditEvidenceStateFilter; label: string }> = [
  { id: "all", label: "All states" },
  { id: "needs-review", label: "Needs review" },
  { id: "blocked", label: "Blocked" },
  { id: "attention", label: "Attention" },
  { id: "clear", label: "Clear" },
  { id: "info", label: "Info" },
];

const laneAccentClassName: Record<AuditEvidenceLaneFilter, string> = {
  all: "text-teal-700",
  access: "text-amber-700",
  report: "text-sky-700",
  sync: "text-emerald-700",
  export: "text-indigo-700",
  webhook: "text-rose-700",
  operating: "text-zinc-700",
};

const metricToneClassName: Record<AuditEvidenceTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50/55 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50/65 text-amber-950 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-100",
  blocked:
    "border-rose-200 bg-rose-50/65 text-rose-950 dark:border-red-400/35 dark:bg-red-500/10 dark:text-red-100",
  info:
    "border-sky-200 bg-sky-50/55 text-sky-950 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100",
};

export function AuditEvidenceWorkspace({ viewModel }: AuditEvidenceWorkspaceProps) {
  const [activeLane, setActiveLane] = useState<AuditEvidenceLaneFilter>("all");
  const [stateFilter, setStateFilter] = useState<AuditEvidenceStateFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    getDefaultAuditEvidenceRowId(viewModel.rows),
  );
  const visibleRows = useMemo(
    () => filterAuditEvidenceRows(viewModel.rows, { activeLane, stateFilter, query }),
    [activeLane, query, stateFilter, viewModel.rows],
  );
  const selectedRow = visibleRows.length
    ? visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0]
    : null;
  const hasActiveFilters =
    activeLane !== "all" || stateFilter !== "all" || query.trim().length > 0;

  const onSelectRow = (rowId: string) => {
    setSelectedId(rowId);
  };

  const onClearFilters = () => {
    setActiveLane("all");
    setStateFilter("all");
    setQuery("");
    setSelectedId(getDefaultAuditEvidenceRowId(viewModel.rows));
  };

  return (
    <section
      aria-label="Audit evidence workspace"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle bg-bg-default px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Audit evidence workspace
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
            Operating trail for audit events, partner exports, webhook delivery, and access changes.
          </p>
        </div>
        <AuditEvidenceSummary metrics={viewModel.metrics} />
      </div>

      <div
        aria-label="Audit evidence controls"
        className="grid gap-3 border-b border-border-subtle bg-bg-default p-3 lg:grid-cols-[minmax(260px,1fr)_minmax(14rem,auto)_auto] lg:items-center"
      >
        <label className="relative min-w-0">
          <span className="sr-only">Search audit evidence</span>
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search audit evidence"
            className="pl-8"
            placeholder="Search actors, events, entities, checksums..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          State
          <select
            aria-label="Filter audit evidence by state"
            className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={stateFilter}
            onChange={(event) =>
              setStateFilter(event.target.value as AuditEvidenceStateFilter)
            }
          >
            {stateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-border-subtle bg-bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <AdminStatusBadge tone="info">Read-only</AdminStatusBadge>{" "}
          <span>{visibleRows.length} visible evidence rows</span>
        </div>
      </div>

      <div
        aria-label="Audit evidence lanes"
        role="tablist"
        className="flex gap-0 overflow-x-auto border-b border-border-subtle bg-bg-muted/30 px-2 pt-2"
      >
        {laneOptions.map((lane) => {
          const count =
            lane.id === "all"
              ? viewModel.rows.length
              : viewModel.rows.filter((row) => row.lane === lane.id).length;
          const isActive = lane.id === activeLane;
          const LaneIcon = lane.icon;

          return (
            <button
              key={lane.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                "inline-flex min-h-10 min-w-fit items-center gap-2 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setActiveLane(lane.id)}
            >
              <LaneIcon
                className={cn(
                  "size-4",
                  isActive ? laneAccentClassName[lane.id] : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
              <span>{lane.label}</span>
              <span className="rounded-md bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid items-start xl:grid-cols-[minmax(0,1.32fr)_minmax(320px,0.68fr)]">
        <AuditEvidenceRows
          hasActiveFilters={hasActiveFilters}
          rows={visibleRows}
          selectedId={selectedRow?.id ?? null}
          onClearFilters={onClearFilters}
          onSelectRow={onSelectRow}
        />
        <AuditEvidenceDetails packets={viewModel.packets} row={selectedRow} />
      </div>
    </section>
  );
}

function AuditEvidenceSummary({ metrics }: { metrics: AuditEvidenceMetric[] }) {
  return (
    <dl
      aria-label="Audit evidence summary"
      className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-4"
    >
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={cn(
            "min-w-0 rounded-lg border px-3 py-2",
            metricToneClassName[metric.tone],
          )}
        >
          <dt className="text-xs font-medium leading-4 text-current/70">
            {metric.label}
          </dt>
          <dd className="mt-1 flex min-w-0 items-baseline gap-2">
            <span className="font-mono text-lg font-semibold leading-none text-current">
              {metric.value}
            </span>
            <span className="min-w-0 text-xs leading-4 text-current/70">
              {metric.detail}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AuditEvidenceRows({
  hasActiveFilters,
  rows,
  selectedId,
  onClearFilters,
  onSelectRow,
}: {
  hasActiveFilters: boolean;
  rows: AuditEvidenceRow[];
  selectedId: string | null;
  onClearFilters: () => void;
  onSelectRow: (rowId: string) => void;
}) {
  if (!rows.length) {
    return (
      <div
        aria-label="Audit evidence rows"
        className="grid min-h-72 place-items-center border-b border-border-subtle p-6 text-center xl:border-b-0 xl:border-r"
      >
        <div className="max-w-md">
          <p className="font-medium text-foreground">No matching evidence</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Adjust the current filters to return audit evidence rows.
          </p>
          {hasActiveFilters ? (
            <Button className="mt-4" size="sm" variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label="Audit evidence rows"
      className="min-w-0 border-b border-border-subtle xl:border-b-0 xl:border-r"
    >
      <div aria-label="Audit event evidence" className="hidden md:block">
        <Table className="table-fixed">
          <TableHeader className="bg-bg-muted/60">
            <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
              <TableHead className="w-[17%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Source
              </TableHead>
              <TableHead className="w-[23%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Subject
              </TableHead>
              <TableHead className="w-[14%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                State
              </TableHead>
              <TableHead className="w-[32%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Evidence
              </TableHead>
              <TableHead className="w-[14%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Observed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isSelected = row.id === selectedId;

              return (
                <TableRow
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  aria-label={row.ariaLabel}
                  aria-pressed={isSelected}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    "cursor-pointer border-border-subtle align-top focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected &&
                      "bg-sky-50/70 hover:bg-sky-50/80 dark:bg-sky-400/10 dark:hover:bg-sky-400/15",
                  )}
                  onClick={() => onSelectRow(row.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, () => onSelectRow(row.id))}
                >
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <p className="font-medium text-foreground">{row.sourceLabel}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {laneLabel(row.lane)}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {row.subtitle}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <AdminStatusBadge tone={row.stateTone}>{row.stateLabel}</AdminStatusBadge>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-sm leading-5">
                    {row.summary}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-xs text-muted-foreground">
                    {row.observedLabel}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-2 p-3 md:hidden">
        {rows.map((row) => {
          const isSelected = row.id === selectedId;

          return (
            <div
              key={row.id}
              className={cn(
                "grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-default p-3",
                isSelected &&
                  "border-sky-300 bg-sky-50/70 dark:border-sky-400/35 dark:bg-sky-400/10",
              )}
            >
              <button
                type="button"
                aria-label={row.ariaLabel}
                aria-pressed={isSelected}
                className="grid min-w-0 gap-2 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
                onClick={() => onSelectRow(row.id)}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-foreground">
                      {row.title}
                    </p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {row.subtitle}
                    </p>
                  </div>
                  <AdminStatusBadge tone={row.stateTone}>{row.stateLabel}</AdminStatusBadge>
                </div>
                <p className="break-words text-xs leading-5 text-muted-foreground">
                  {row.summary}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.sourceLabel} / {row.observedLabel}
                </p>
              </button>
              <Link
                href={row.sourceHref}
                aria-label={`Open source evidence for ${row.title}`}
                className="inline-flex min-h-8 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-bg-default px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-bg-muted/70"
              >
                Open source
                <ArrowUpRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditEvidenceDetails({
  packets,
  row,
}: {
  packets: AuditEvidencePacket[];
  row: AuditEvidenceRow | null;
}) {
  return (
    <aside
      aria-label="Selected audit evidence"
      className="order-first grid gap-3 bg-bg-muted/30 p-3 xl:order-none"
    >
      <section
        aria-label="Linked evidence packets"
        className="grid gap-2 rounded-lg border border-border-subtle bg-bg-default p-3 shadow-sm"
      >
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Evidence packets
        </p>
        <div className="grid gap-2">
          {packets.map((packet) => (
            <div
              key={packet.id}
              className={cn(
                "min-w-0 rounded-lg border px-3 py-2",
                metricToneClassName[packet.tone],
              )}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <p className="break-words text-sm font-medium text-current">
                  {packet.label}
                </p>
                <span className="font-mono text-sm font-semibold text-current">
                  {packet.value}
                </span>
              </div>
              <p className="mt-1 break-words text-xs leading-4 text-current/70">
                {packet.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {row ? (
        <section className="hidden overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm xl:block">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Selected evidence
            </p>
            <div className="mt-2 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold leading-tight text-foreground">
                  {row.title}
                </h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {row.subtitle}
                </p>
              </div>
              <AdminStatusBadge tone={row.stateTone}>{row.stateLabel}</AdminStatusBadge>
            </div>
          </div>

          <div className="grid gap-3 p-4">
            <EvidenceFact label="Source record">{row.sourceLabel}</EvidenceFact>
            <EvidenceFact label="Evidence basis">{row.evidenceBasis}</EvidenceFact>
            <EvidenceFact label="Review state">{row.reviewState}</EvidenceFact>
            <EvidenceFact label="Next step">{row.nextStep}</EvidenceFact>

            <div className="rounded-lg border border-border-subtle bg-bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Raw facts
              </p>
              <dl className="mt-2 grid gap-2 text-sm">
                {row.rawFacts.map((fact) => (
                  <div
                    key={`${row.id}-${fact.label}`}
                    className="grid gap-1 rounded-md bg-bg-default p-2 sm:grid-cols-[7rem_minmax(0,1fr)]"
                  >
                    <dt className="text-xs font-medium text-muted-foreground">
                      {fact.label}
                    </dt>
                    <dd className="min-w-0 break-words text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link
              href={row.sourceHref}
              aria-label={`Open source evidence for ${row.title}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Open source evidence
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 text-sm text-muted-foreground">
          No evidence row is selected.
        </div>
      )}
    </aside>
  );
}

function EvidenceFact({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-default p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-5 text-foreground">{children}</p>
    </div>
  );
}

function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, selectRow: () => void) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  selectRow();
}

function laneLabel(lane: AuditEvidenceRow["lane"]) {
  const labels: Record<AuditEvidenceRow["lane"], string> = {
    access: "Access",
    report: "Reports",
    sync: "Sync",
    export: "Exports",
    webhook: "Webhooks",
    operating: "Operating",
  };

  return labels[lane];
}
