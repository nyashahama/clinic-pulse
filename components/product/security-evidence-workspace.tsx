"use client";

import Link from "next/link";
import { type KeyboardEvent, useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  KeyRoundIcon,
  RadioTowerIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCogIcon,
} from "lucide-react";

import {
  AdminStatusBadge,
  type AdminTone,
} from "@/components/product/admin-module";
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
  filterSecurityEvidenceRows,
  getDefaultSecurityEvidenceRowId,
  type SecurityEvidenceKindFilter,
  type SecurityEvidenceRow,
  type SecurityEvidenceStateFilter,
  type SecuritySummaryMetric,
} from "@/lib/product/security-evidence";
import { cn } from "@/lib/utils";

type SecurityEvidenceWorkspaceProps = {
  metrics: SecuritySummaryMetric[];
  rows: SecurityEvidenceRow[];
  posture: {
    tone: AdminTone;
    summary: string;
  };
};

const laneOptions: Array<{
  id: SecurityEvidenceKindFilter;
  label: string;
  icon: typeof ShieldCheckIcon;
}> = [
  { id: "all", label: "All evidence", icon: ShieldCheckIcon },
  { id: "credential", label: "Credentials", icon: KeyRoundIcon },
  { id: "webhook", label: "Webhooks", icon: RadioTowerIcon },
  { id: "privileged-access", label: "Privileged access", icon: UserCogIcon },
  { id: "audit", label: "Audit trail", icon: ActivityIcon },
];

const stateOptions: Array<{ id: SecurityEvidenceStateFilter; label: string }> = [
  { id: "all", label: "All states" },
  { id: "needs-review", label: "Needs review" },
  { id: "clear", label: "Clear" },
  { id: "info", label: "Info" },
  { id: "blocked", label: "Blocked" },
];

const sourceToneClassName: Record<SecurityEvidenceKindFilter, string> = {
  all: "text-teal-700",
  credential: "text-emerald-700",
  webhook: "text-sky-700",
  "privileged-access": "text-amber-700",
  audit: "text-indigo-700",
};

export function SecurityEvidenceWorkspace({
  metrics,
  rows,
  posture,
}: SecurityEvidenceWorkspaceProps) {
  const [activeKind, setActiveKind] = useState<SecurityEvidenceKindFilter>("all");
  const [stateFilter, setStateFilter] = useState<SecurityEvidenceStateFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    getDefaultSecurityEvidenceRowId(rows),
  );
  const visibleRows = useMemo(
    () => filterSecurityEvidenceRows(rows, { activeKind, stateFilter, query }),
    [activeKind, query, rows, stateFilter],
  );
  const selectedRow = visibleRows.length
    ? visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0]
    : null;

  const onSelectRow = (rowId: string) => {
    setSelectedId(rowId);
  };

  const hasActiveFilters =
    activeKind !== "all" || stateFilter !== "all" || query.trim().length > 0;
  const onClearFilters = () => {
    setActiveKind("all");
    setStateFilter("all");
    setQuery("");
    setSelectedId(getDefaultSecurityEvidenceRowId(rows));
  };

  return (
    <section
      aria-label="Security evidence workspace"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle bg-bg-default px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Security evidence workspace
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
            Select an evidence row to inspect the basis, review state, next step, and source record.
          </p>
        </div>
        <SecurityEvidenceSummary metrics={metrics} />
      </div>

      <div
        aria-label="Security evidence controls"
        className="grid gap-3 border-b border-border-subtle bg-bg-default p-3 lg:grid-cols-[minmax(260px,1fr)_minmax(14rem,auto)_auto] lg:items-center"
      >
        <label className="relative min-w-0">
          <span className="sr-only">Search security evidence</span>
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search security evidence"
            className="pl-8"
            placeholder="Search evidence, actors, scopes, URLs..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          State
          <select
            aria-label="Filter security evidence by state"
            className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={stateFilter}
            onChange={(event) =>
              setStateFilter(event.target.value as SecurityEvidenceStateFilter)
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
          <AdminStatusBadge tone={posture.tone}>Read-only</AdminStatusBadge>{" "}
          <span>{posture.summary}</span>
        </div>
      </div>

      <div
        aria-label="Security evidence lanes"
        role="tablist"
        className="flex gap-0 overflow-x-auto border-b border-border-subtle bg-bg-muted/30 px-2 pt-2"
      >
        {laneOptions.map((lane) => {
          const count =
            lane.id === "all"
              ? rows.length
              : rows.filter((row) => row.kind === lane.id).length;
          const isActive = lane.id === activeKind;
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
              onClick={() => setActiveKind(lane.id)}
            >
              <LaneIcon
                className={cn(
                  "size-4",
                  isActive ? sourceToneClassName[lane.id] : "text-muted-foreground",
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

      <div className="grid items-start xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.62fr)]">
        <SecurityEvidenceRows
          hasActiveFilters={hasActiveFilters}
          rows={visibleRows}
          selectedId={selectedRow?.id ?? null}
          onClearFilters={onClearFilters}
          onSelectRow={onSelectRow}
        />
        <SecurityEvidenceDetails row={selectedRow} />
      </div>
    </section>
  );
}

function SecurityEvidenceSummary({ metrics }: { metrics: SecuritySummaryMetric[] }) {
  return (
    <dl
      aria-label="Security evidence summary"
      className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-5"
    >
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={cn(
            "min-w-0 rounded-lg border px-2.5 py-2",
            metricToneClassName[metric.tone],
          )}
        >
          <dt className="text-xs font-medium leading-4 text-muted-foreground">{metric.label}</dt>
          <dd className="mt-1 flex min-w-0 items-baseline gap-2">
            <span className="font-mono text-lg font-semibold leading-none text-foreground">
              {metric.value}
            </span>
            <span className="min-w-0 text-xs leading-4 text-muted-foreground">
              {metric.detail}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

const metricToneClassName: Record<AdminTone, string> = {
  clear: "border-emerald-200 bg-emerald-50/55",
  attention: "border-amber-200 bg-amber-50/65",
  blocked: "border-rose-200 bg-rose-50/65",
  info: "border-sky-200 bg-sky-50/55",
};

function SecurityEvidenceRows({
  hasActiveFilters,
  rows,
  selectedId,
  onClearFilters,
  onSelectRow,
}: {
  hasActiveFilters: boolean;
  rows: SecurityEvidenceRow[];
  selectedId: string | null;
  onClearFilters: () => void;
  onSelectRow: (rowId: string) => void;
}) {
  if (!rows.length) {
    return (
      <div
        aria-label="Security evidence rows"
        className="grid min-h-72 place-items-center border-b border-border-subtle p-6 text-center xl:border-b-0 xl:border-r"
      >
        <div className="max-w-md">
          <p className="font-medium text-foreground">No matching evidence</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Adjust the search text or state filter to return security evidence rows.
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
      aria-label="Security evidence rows"
      className="min-w-0 border-b border-border-subtle xl:border-b-0 xl:border-r"
    >
      <div className="hidden md:block">
        <Table className="table-fixed">
          <TableHeader className="bg-bg-muted/60">
            <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
              <TableHead className="w-[22%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Record
              </TableHead>
              <TableHead className="w-[22%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Subject
              </TableHead>
              <TableHead className="w-[14%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                State
              </TableHead>
              <TableHead className="w-[30%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Evidence basis
              </TableHead>
              <TableHead className="w-[12%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Observed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isSelected = row.id === selectedId;
              const recordContext = row.entityLabel ?? row.actorLabel ?? row.kind;

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
                    isSelected && "bg-emerald-50/70 hover:bg-emerald-50/80",
                  )}
                  onClick={() => onSelectRow(row.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, () => onSelectRow(row.id))}
                >
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <p className="font-medium text-foreground">{row.sourceLabel}</p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {recordContext}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <p className="font-medium text-foreground">{row.subject}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {row.subjectDetail}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <AdminStatusBadge tone={row.stateTone}>{row.stateLabel}</AdminStatusBadge>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-sm leading-5">
                    {row.evidenceBasis}
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
            <button
              key={row.id}
              type="button"
              aria-label={row.ariaLabel}
              aria-pressed={isSelected}
              className={cn(
                "grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-default p-3 text-left transition hover:bg-bg-muted/60",
                isSelected && "border-emerald-300 bg-emerald-50/70",
              )}
              onClick={() => onSelectRow(row.id)}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-foreground">
                    {row.subject}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {row.subjectDetail}
                  </p>
                </div>
                <AdminStatusBadge tone={row.stateTone}>{row.stateLabel}</AdminStatusBadge>
              </div>
              <p className="break-words text-xs leading-5 text-muted-foreground">
                {row.evidenceBasis}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.sourceLabel} / {row.observedLabel}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SecurityEvidenceDetails({ row }: { row: SecurityEvidenceRow | null }) {
  return (
    <aside
      aria-label="Selected security evidence"
      className="order-first grid gap-3 bg-bg-muted/30 p-3 xl:order-none"
    >
      {row ? (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Selected evidence
            </p>
            <div className="mt-2 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold leading-tight text-foreground">
                  {row.subject}
                </h2>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {row.subjectDetail}
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
                    <dt className="text-xs font-medium text-muted-foreground">{fact.label}</dt>
                    <dd className="min-w-0 break-words text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link
              href={row.sourceHref}
              aria-label={`Open source evidence for ${row.subject}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Open source evidence
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 text-sm text-muted-foreground">
          Select an evidence row to inspect source details.
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
