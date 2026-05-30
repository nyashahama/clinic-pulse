"use client";

import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileJson,
  KeyRound,
  ListChecks,
  PackageCheck,
  PlayCircle,
  RadioTower,
  Search,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react";
import { type KeyboardEvent, type ReactNode, useMemo, useState } from "react";

import { SectionHeader } from "@/components/workspace/section-header";
import {
  getReadinessBadgeToneClassName,
  getReadinessMetricToneClassName,
  type ReadinessTone,
} from "@/components/workspace/readiness-tones";
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
import type { PartnerReadinessApiResponse } from "@/lib/workspace/api-types";
import {
  buildPartnerLaunchCockpitModel,
  buildPartnerReadinessModel,
  filterPartnerEvidenceRows,
  getDefaultPartnerEvidenceRowId,
  type OneTimePartnerApiKeySecret,
  type OneTimePartnerWebhookSecret,
  type PartnerActionQueueItem,
  type PartnerEvidenceKindFilter,
  type PartnerEvidenceRow,
  type PartnerEvidenceStateFilter,
  type PartnerHandoffPacketItem,
  type PartnerLaunchGate,
  type PartnerReadinessSeverity,
} from "@/lib/workspace/partner-readiness";
import { cn } from "@/lib/utils";

type PartnerReadinessPanelProps = {
  readiness: PartnerReadinessApiResponse;
  onCreateSandboxKey: () => void;
  onCreateWebhook?: () => void;
  onGenerateExport: () => void;
  onTestWebhook?: (subscriptionId: number) => void;
  pendingActions?: {
    createSandboxKey?: boolean;
    createWebhook?: boolean;
    generateExport?: boolean;
    testWebhook?: boolean;
  };
  actionError?: string | null;
  oneTimeApiKeySecret?: OneTimePartnerApiKeySecret | null;
  oneTimeWebhookSecret?: OneTimePartnerWebhookSecret | null;
  onClearOneTimeApiKeySecret?: () => void;
  onClearOneTimeWebhookSecret?: () => void;
};

type Tone = ReadinessTone;

const numberFormatter = new Intl.NumberFormat("en-ZA");

const severityIcons: Record<PartnerReadinessSeverity, typeof CheckCircle2> = {
  clear: CheckCircle2,
  watch: ShieldCheck,
  attention: AlertTriangle,
};

const evidenceLaneOptions: Array<{
  id: PartnerEvidenceKindFilter;
  label: string;
  icon: typeof ShieldCheck;
}> = [
  { id: "all", label: "All evidence", icon: ShieldCheck },
  { id: "credential", label: "Credentials", icon: KeyRound },
  { id: "contract", label: "Contract", icon: ClipboardList },
  { id: "delivery", label: "Delivery", icon: RadioTower },
  { id: "export", label: "Exports", icon: FileJson },
  { id: "check", label: "Checks", icon: ListChecks },
];

const evidenceStateOptions: Array<{
  id: PartnerEvidenceStateFilter;
  label: string;
}> = [
  { id: "all", label: "All states" },
  { id: "needs-review", label: "Needs review" },
  { id: "ready", label: "Ready" },
  { id: "watch", label: "Watch" },
  { id: "info", label: "Info" },
];

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatCheckName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusTone(status: string): Tone {
  const normalized = status.trim().toLowerCase();
  if (normalized === "passing" || normalized === "active" || normalized === "delivered") {
    return "clear";
  }
  if (normalized === "attention" || normalized === "queued" || normalized === "preview_only") {
    return "watch";
  }
  if (normalized === "failing" || normalized === "disabled" || normalized === "failed") {
    return "attention";
  }
  return "info";
}

function isActiveWebhookStatus(status: string) {
  return status.trim().toLowerCase() === "active";
}

function Badge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: Tone;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 break-words rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        getReadinessBadgeToneClassName(tone),
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: PartnerReadinessSeverity }) {
  const Icon = severityIcons[severity];

  return (
    <Badge
      label={severity}
      tone={severity}
      icon={<Icon aria-hidden="true" className="size-3.5 shrink-0" />}
    />
  );
}

function SectionTitle({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof ClipboardList;
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-subtle text-content-subtle">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-content-emphasis">{title}</h3>
          {detail ? (
            <p className="mt-0.5 break-words text-xs text-content-subtle">{detail}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GateRow({ gate }: { gate: PartnerLaunchGate }) {
  return (
    <div className="grid gap-2 border-t border-border-subtle py-3 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-start">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            gate.tone === "clear"
              ? "bg-emerald-500"
              : gate.tone === "watch"
                ? "bg-amber-500"
                : "bg-rose-500",
          )}
        />
        <p className="text-sm font-semibold text-content-emphasis">{gate.label}</p>
      </div>
      <div className="min-w-0">
        <p className="break-words text-sm text-content-default">{gate.summary}</p>
        <p className="mt-1 break-words text-xs text-content-subtle">{gate.detail}</p>
      </div>
      <Badge label={gate.status} tone={gate.tone} />
    </div>
  );
}

function HandoffItem({ item }: { item: PartnerHandoffPacketItem }) {
  return (
    <div className="grid gap-2 border-t border-border-subtle py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-content-emphasis">{item.label}</p>
        <Badge label={item.value} tone={item.tone} />
      </div>
      <p className="break-words text-xs text-content-subtle">{item.detail}</p>
    </div>
  );
}

function actionIconFor(action: PartnerActionQueueItem["action"]) {
  if (action === "create-key") return KeyRound;
  if (action === "create-webhook") return Webhook;
  if (action === "generate-export") return FileJson;
  return PlayCircle;
}

function PartnerActionQueue({
  items,
  pendingActions,
  selectedWebhookIsActive,
  onCreateSandboxKey,
  onCreateWebhook,
  onGenerateExport,
  onTestWebhook,
  webhookSubscriptionId,
}: {
  items: PartnerActionQueueItem[];
  pendingActions?: PartnerReadinessPanelProps["pendingActions"];
  selectedWebhookIsActive: boolean;
  onCreateSandboxKey: () => void;
  onCreateWebhook?: () => void;
  onGenerateExport: () => void;
  onTestWebhook?: (subscriptionId: number) => void;
  webhookSubscriptionId?: number;
}) {
  const pending = Boolean(
    pendingActions?.createSandboxKey ||
      pendingActions?.createWebhook ||
      pendingActions?.generateExport ||
      pendingActions?.testWebhook,
  );

  const actionFor = (item: PartnerActionQueueItem) => {
    if (item.action === "create-key") {
      return {
        label: "Create key",
        onClick: onCreateSandboxKey,
        disabled: pendingActions?.createSandboxKey,
      };
    }

    if (item.action === "create-webhook") {
      return {
        label: "Create webhook",
        onClick: onCreateWebhook,
        disabled: !onCreateWebhook || pendingActions?.createWebhook,
      };
    }

    if (item.action === "generate-export") {
      return {
        label: "Generate export",
        onClick: onGenerateExport,
        disabled: pendingActions?.generateExport,
      };
    }

    return {
      label: "Send test event",
      onClick: () => {
        if (webhookSubscriptionId && onTestWebhook) {
          onTestWebhook(webhookSubscriptionId);
        }
      },
      disabled:
        !selectedWebhookIsActive ||
        !onTestWebhook ||
        !webhookSubscriptionId ||
        pendingActions?.testWebhook,
    };
  };

  return (
    <div className="min-w-0 rounded-md border border-border-subtle p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <SectionTitle
          icon={PackageCheck}
          title="Partner action queue"
          detail="Launch actions stay tied to the evidence they unblock."
        />
        {pending ? <Badge label="Working" tone="watch" /> : null}
      </div>

      <div className="mt-4 grid gap-2 xl:grid-cols-2">
        {items.map((item) => {
          const Icon = actionIconFor(item.action);
          const action = actionFor(item);

          return (
            <div
              key={item.id}
              className="grid gap-3 rounded-md border border-border-subtle bg-bg-muted/30 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="flex min-w-0 gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-default text-content-subtle">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-semibold text-content-emphasis">
                      {item.label}
                    </p>
                    <Badge label={item.tone === "clear" ? "Ready" : item.tone} tone={item.tone} />
                  </div>
                  <p className="mt-1 break-words text-sm text-content-default">
                    {item.summary}
                  </p>
                  <p className="mt-1 break-words text-xs text-content-subtle">
                    {item.detail}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={item.tone === "clear" ? "outline" : "default"}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                <Icon className="size-3.5" />
                {action.label}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PartnerEvidenceWorkspace({
  rows,
  activeKind,
  stateFilter,
  query,
  selectedId,
  onActiveKindChange,
  onStateFilterChange,
  onQueryChange,
  onSelectedIdChange,
}: {
  rows: PartnerEvidenceRow[];
  activeKind: PartnerEvidenceKindFilter;
  stateFilter: PartnerEvidenceStateFilter;
  query: string;
  selectedId: string | null;
  onActiveKindChange: (value: PartnerEvidenceKindFilter) => void;
  onStateFilterChange: (value: PartnerEvidenceStateFilter) => void;
  onQueryChange: (value: string) => void;
  onSelectedIdChange: (value: string | null) => void;
}) {
  const visibleRows = useMemo(
    () => filterPartnerEvidenceRows(rows, { activeKind, stateFilter, query }),
    [activeKind, query, rows, stateFilter],
  );
  const selectedRow = visibleRows.length
    ? visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0]
    : null;
  const hasActiveFilters =
    activeKind !== "all" || stateFilter !== "all" || query.trim().length > 0;
  const clearFilters = () => {
    onActiveKindChange("all");
    onStateFilterChange("all");
    onQueryChange("");
    onSelectedIdChange(getDefaultPartnerEvidenceRowId(rows));
  };

  return (
    <div
      aria-label="Partner launch workspace"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle px-4 py-3">
        <SectionTitle
          icon={ShieldCheck}
          title="Partner evidence ledger"
          detail="Select a launch record to inspect the basis, review state, next step, and raw handoff facts."
        />
      </div>

      <div className="grid gap-3 border-b border-border-subtle p-3 lg:grid-cols-[minmax(260px,1fr)_minmax(13rem,auto)] lg:items-center">
        <label className="relative min-w-0">
          <span className="sr-only">Search partner evidence</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-content-subtle"
          />
          <Input
            type="search"
            aria-label="Search partner evidence"
            className="pl-8"
            placeholder="Search keys, scopes, webhooks, exports, checks..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-content-subtle">
          State
          <select
            aria-label="Filter partner evidence by state"
            className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={stateFilter}
            onChange={(event) =>
              onStateFilterChange(event.target.value as PartnerEvidenceStateFilter)
            }
          >
            {evidenceStateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        aria-label="Partner evidence lanes"
        role="tablist"
        className="flex gap-0 overflow-x-auto border-b border-border-subtle bg-bg-muted/30 px-2 pt-2"
      >
        {evidenceLaneOptions.map((lane) => {
          const LaneIcon = lane.icon;
          const count =
            lane.id === "all"
              ? rows.length
              : rows.filter((row) => row.kind === lane.id).length;
          const active = lane.id === activeKind;

          return (
            <button
              key={lane.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex min-h-10 min-w-fit items-center gap-2 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-content-subtle hover:text-foreground",
              )}
              onClick={() => onActiveKindChange(lane.id)}
            >
              <LaneIcon aria-hidden="true" className="size-4" />
              <span>{lane.label}</span>
              <span className="rounded-md bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-content-subtle">
                {formatCount(count)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid items-start xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <PartnerEvidenceRows
          hasActiveFilters={hasActiveFilters}
          rows={visibleRows}
          selectedId={selectedRow?.id ?? null}
          onClearFilters={clearFilters}
          onSelectRow={onSelectedIdChange}
        />
        <PartnerEvidenceDetails row={selectedRow} />
      </div>
    </div>
  );
}

function PartnerEvidenceRows({
  hasActiveFilters,
  rows,
  selectedId,
  onClearFilters,
  onSelectRow,
}: {
  hasActiveFilters: boolean;
  rows: PartnerEvidenceRow[];
  selectedId: string | null;
  onClearFilters: () => void;
  onSelectRow: (rowId: string) => void;
}) {
  if (!rows.length) {
    return (
      <div
        aria-label="Partner evidence rows"
        className="grid min-h-72 place-items-center border-b border-border-subtle p-6 text-center xl:border-b-0 xl:border-r"
      >
        <div className="max-w-md">
          <p className="font-medium text-foreground">No matching partner evidence</p>
          <p className="mt-2 text-sm leading-5 text-content-subtle">
            Adjust the search text, lane, or state filter to return launch evidence.
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
      aria-label="Partner evidence rows"
      className="min-w-0 border-b border-border-subtle xl:border-b-0 xl:border-r"
    >
      <div className="hidden md:block">
        <Table className="table-fixed">
          <TableHeader className="bg-bg-muted/60">
            <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
              <TableHead className="w-[18%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Lane
              </TableHead>
              <TableHead className="w-[24%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Record
              </TableHead>
              <TableHead className="w-[14%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                State
              </TableHead>
              <TableHead className="w-[32%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Evidence basis
              </TableHead>
              <TableHead className="w-[12%] whitespace-normal break-words px-3 text-xs uppercase tracking-normal">
                Observed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const selected = row.id === selectedId;

              return (
                <TableRow
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect partner evidence for ${row.title}`}
                  aria-pressed={selected}
                  data-state={selected ? "selected" : undefined}
                  className={cn(
                    "cursor-pointer border-border-subtle align-top focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected && "bg-sky-50/70 hover:bg-sky-50/80",
                  )}
                  onClick={() => onSelectRow(row.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, () => onSelectRow(row.id))}
                >
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <p className="font-medium text-foreground">{row.laneLabel}</p>
                    <p className="mt-1 break-words text-xs text-content-subtle">
                      {row.sourceLabel}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="mt-1 break-words text-xs text-content-subtle">
                      {row.subject}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top">
                    <Badge label={row.stateLabel} tone={row.tone} />
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-sm leading-5">
                    {row.evidenceBasis}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words px-3 py-3 align-top text-xs text-content-subtle">
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
          const selected = row.id === selectedId;

          return (
            <button
              key={row.id}
              type="button"
              aria-label={`Inspect partner evidence for ${row.title}`}
              aria-pressed={selected}
              className={cn(
                "grid min-w-0 gap-2 rounded-md border border-border-subtle bg-bg-default p-3 text-left transition hover:bg-bg-muted/60",
                selected && "border-sky-300 bg-sky-50/70",
              )}
              onClick={() => onSelectRow(row.id)}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-foreground">
                    {row.title}
                  </p>
                  <p className="mt-1 break-words text-xs text-content-subtle">
                    {row.laneLabel} / {row.sourceLabel}
                  </p>
                </div>
                <Badge label={row.stateLabel} tone={row.tone} />
              </div>
              <p className="break-words text-xs leading-5 text-content-default">
                {row.evidenceBasis}
              </p>
              <p className="text-xs text-content-subtle">{row.observedLabel}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PartnerEvidenceDetails({ row }: { row: PartnerEvidenceRow | null }) {
  return (
    <aside
      aria-label="Selected partner evidence"
      className="grid gap-3 bg-bg-muted/30 p-3"
    >
      {row ? (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-bg-default shadow-sm">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-normal text-content-subtle">
              Selected partner evidence
            </p>
            <div className="mt-2 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold leading-tight text-foreground">
                  {row.title}
                </h2>
                <p className="mt-1 break-words text-sm text-content-subtle">
                  {row.subject}
                </p>
              </div>
              <Badge label={row.stateLabel} tone={row.tone} />
            </div>
          </div>

          <div className="grid gap-3 p-4">
            <EvidenceFact label="Source record">{row.sourceLabel}</EvidenceFact>
            <EvidenceFact label="Evidence basis">{row.evidenceBasis}</EvidenceFact>
            <EvidenceFact label="Next step">{row.nextStep}</EvidenceFact>

            <div className="rounded-md border border-border-subtle bg-bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-normal text-content-subtle">
                Raw handoff facts
              </p>
              <dl className="mt-2 grid gap-2 text-sm">
                {row.rawFacts.map((fact) => (
                  <div
                    key={`${row.id}-${fact.label}`}
                    className="grid gap-1 rounded-md bg-bg-default p-2 sm:grid-cols-[7rem_minmax(0,1fr)]"
                  >
                    <dt className="text-xs font-medium text-content-subtle">{fact.label}</dt>
                    <dd className="min-w-0 break-words text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border-subtle bg-bg-default p-4 text-sm text-content-subtle">
          Select a partner evidence row to inspect launch details.
        </div>
      )}
    </aside>
  );
}

function EvidenceFact({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg-default p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-content-subtle">
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

function OneTimeSecretNotice({
  title,
  detail,
  secret,
  onClear,
}: {
  title: string;
  detail: string;
  secret: string;
  onClear?: () => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 break-words text-xs text-amber-900/80 dark:text-amber-100/80">
            {detail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(secret).catch(() => undefined);
            }}
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
          {onClear ? (
            <Button type="button" size="sm" variant="outline" onClick={onClear}>
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>
      <code className="mt-3 block max-w-full overflow-x-auto rounded bg-bg-default px-3 py-2 text-xs font-semibold text-content-emphasis">
        {secret}
      </code>
    </div>
  );
}

export function PartnerReadinessPanel({
  readiness,
  onCreateSandboxKey,
  onCreateWebhook,
  onGenerateExport,
  onTestWebhook,
  pendingActions,
  actionError,
  oneTimeApiKeySecret,
  oneTimeWebhookSecret,
  onClearOneTimeApiKeySecret,
  onClearOneTimeWebhookSecret,
}: PartnerReadinessPanelProps) {
  const readinessModel = buildPartnerReadinessModel(readiness);
  const cockpit = buildPartnerLaunchCockpitModel(readiness);
  const activeSubscriptions = readiness.webhookSubscriptions.filter(
    (subscription) => isActiveWebhookStatus(subscription.status),
  );
  const webhookSubscription = activeSubscriptions[0] ?? readiness.webhookSubscriptions[0];
  const selectedWebhookIsActive = webhookSubscription
    ? isActiveWebhookStatus(webhookSubscription.status)
    : false;
  const webhookTestDisabled =
    !selectedWebhookIsActive || !onTestWebhook || pendingActions?.testWebhook;
  const [activeEvidenceKind, setActiveEvidenceKind] =
    useState<PartnerEvidenceKindFilter>("all");
  const [evidenceStateFilter, setEvidenceStateFilter] =
    useState<PartnerEvidenceStateFilter>("all");
  const [evidenceQuery, setEvidenceQuery] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(() =>
    getDefaultPartnerEvidenceRowId(cockpit.evidenceRows),
  );

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Partner readiness"
        title="Partner Launch Cockpit"
        description={readinessModel.description}
        actions={<SeverityBadge severity={readinessModel.severity} />}
      />

      {actionError ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"
          role="alert"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{actionError}</span>
        </div>
      ) : null}

      {oneTimeApiKeySecret ? (
        <OneTimeSecretNotice
          title="One-time API key secret"
          detail={`${oneTimeApiKeySecret.name} / ${oneTimeApiKeySecret.keyPrefix}`}
          secret={oneTimeApiKeySecret.secret}
          onClear={onClearOneTimeApiKeySecret}
        />
      ) : null}

      {oneTimeWebhookSecret ? (
        <OneTimeSecretNotice
          title="One-time webhook secret"
          detail={`${oneTimeWebhookSecret.name} / ${oneTimeWebhookSecret.targetUrl}`}
          secret={oneTimeWebhookSecret.secret}
          onClear={onClearOneTimeWebhookSecret}
        />
      ) : null}

      <dl className="mt-4 grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {readinessModel.metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 border-t border-border-subtle pt-3"
          >
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
              {metric.label}
            </dt>
            <dd
              className={cn(
                "mt-1 break-words text-2xl font-semibold leading-tight tabular-nums",
                getReadinessMetricToneClassName(metric.tone),
              )}
            >
              {metric.value}
            </dd>
            {metric.detail ? (
              <dd className="mt-1 break-words text-xs text-content-subtle">
                {metric.detail}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <div className="min-w-0 rounded-md border border-border-subtle p-4">
          <SectionTitle
            icon={ClipboardList}
            title="Readiness gates"
            detail="Launch decision grouped by access, contract, delivery, and operations evidence."
          />
          <div className="mt-4">
            {cockpit.gates.map((gate) => (
              <GateRow key={gate.id} gate={gate} />
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-md border border-border-subtle p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <SectionTitle
              icon={PackageCheck}
              title="Handoff packet"
              detail={cockpit.handoffPacket.summary}
            />
            <Badge
              label={cockpit.handoffPacket.status}
              tone={cockpit.handoffPacket.tone}
            />
          </div>
          <div className="mt-4">
            {cockpit.handoffPacket.items.map((item) => (
              <HandoffItem key={item.label} item={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <PartnerActionQueue
          items={cockpit.actionQueue}
          pendingActions={pendingActions}
          selectedWebhookIsActive={selectedWebhookIsActive}
          onCreateSandboxKey={onCreateSandboxKey}
          onCreateWebhook={onCreateWebhook}
          onGenerateExport={onGenerateExport}
          onTestWebhook={onTestWebhook}
          webhookSubscriptionId={webhookSubscription?.id}
        />
      </div>
      <div className="mt-5">
        <PartnerEvidenceWorkspace
          rows={cockpit.evidenceRows}
          activeKind={activeEvidenceKind}
          stateFilter={evidenceStateFilter}
          query={evidenceQuery}
          selectedId={selectedEvidenceId}
          onActiveKindChange={setActiveEvidenceKind}
          onStateFilterChange={setEvidenceStateFilter}
          onQueryChange={setEvidenceQuery}
          onSelectedIdChange={setSelectedEvidenceId}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.85fr)]">
        <div className="min-w-0 rounded-md border border-border-subtle p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <SectionTitle
              icon={RadioTower}
              title="Event delivery console"
              detail="Latest partner webhook events, ordered like an operations run log."
            />
            {selectedWebhookIsActive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={webhookTestDisabled}
                onClick={() => {
                  if (webhookSubscription && onTestWebhook) {
                    onTestWebhook(webhookSubscription.id);
                  }
                }}
              >
                <PlayCircle className="size-3.5" />
                Send test event
              </Button>
            ) : null}
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-border-subtle">
            {cockpit.deliveryRows.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                <div className="hidden gap-2 bg-bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-content-subtle md:grid md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,0.9fr)_auto_auto]">
                  <span>Event</span>
                  <span>State</span>
                  <span>Target</span>
                  <span>Attempts</span>
                  <span>Updated</span>
                </div>
                {cockpit.deliveryRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid gap-3 px-3 py-3 text-sm md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,0.9fr)_auto_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-content-emphasis">
                        {row.eventType}
                      </p>
                      <p className="mt-1 break-words text-xs text-content-subtle">
                        {row.detail}
                      </p>
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-3 md:block">
                      <span className="text-xs font-semibold uppercase tracking-normal text-content-subtle md:sr-only">
                        State
                      </span>
                      <Badge label={formatStatusLabel(row.state)} tone={row.tone} />
                    </div>
                    <div className="grid min-w-0 gap-1 md:block">
                      <span className="text-xs font-semibold uppercase tracking-normal text-content-subtle md:sr-only">
                        Target
                      </span>
                      <p className="break-words text-sm text-content-default">{row.target}</p>
                    </div>
                    <div className="grid gap-1 md:block">
                      <span className="text-xs font-semibold uppercase tracking-normal text-content-subtle md:sr-only">
                        Attempts
                      </span>
                      <p className="text-sm tabular-nums text-content-default">{row.attempts}</p>
                    </div>
                    <div className="grid gap-1 md:block">
                      <span className="text-xs font-semibold uppercase tracking-normal text-content-subtle md:sr-only">
                        Updated
                      </span>
                      <p className="text-sm tabular-nums text-content-subtle">
                        {formatDate(row.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-content-subtle">
                No webhook delivery evidence recorded
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-md border border-border-subtle p-4">
          <SectionTitle
            icon={Braces}
            title="Event catalog"
            detail="Partner-visible event types expected during pilot handoff."
          />
          <div className="mt-4 divide-y divide-border-subtle">
            {cockpit.eventCatalog.map((event) => (
              <div key={event.eventType} className="py-3 first:pt-0 last:pb-0">
                <p className="break-words font-mono text-xs font-semibold text-content-emphasis">
                  {event.eventType}
                </p>
                <p className="mt-1 break-words text-xs text-content-subtle">
                  {event.source}
                </p>
                <p className="mt-1 break-words text-sm text-content-default">
                  {event.purpose}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ListChecks aria-hidden="true" className="size-4 shrink-0 text-content-subtle" />
            <h3 className="text-sm font-semibold text-content-emphasis">
              Integration checks
            </h3>
          </div>
          <span className="text-xs font-medium text-content-subtle">
            {formatCount(readiness.integrationChecks.length)} reported
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-md border border-border-subtle">
          {readiness.integrationChecks.length > 0 ? (
            readiness.integrationChecks.map((check) => (
              <div
                key={`${check.checkName}-${check.checkedAt}`}
                className="grid gap-2 border-b border-border-subtle px-3 py-2 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-content-emphasis">
                    {formatCheckName(check.checkName)}
                  </p>
                  <p className="mt-1 break-words text-xs text-content-subtle">
                    {check.summary}
                  </p>
                </div>
                <Badge
                  label={formatStatusLabel(check.status)}
                  tone={getStatusTone(check.status)}
                />
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-content-subtle">
              No checks reported
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
