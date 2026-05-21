"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { SeverityActionPanel } from "@/components/demo/command-center/severity-action-panel";
import { SeverityQueueWorklist } from "@/components/demo/command-center/severity-queue-worklist";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import { Button } from "@/components/ui/button";
import type { ClientAuthSession } from "@/lib/auth/api";
import type {
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  buildDistrictSeverityQueueViewModel,
  type DistrictSeverityQueueFilters,
} from "@/lib/demo/district-severity-queue-view-model";
import { cn } from "@/lib/utils";

type DistrictSeverityQueuePageClientProps = {
  session: ClientAuthSession;
  syncSummary: SyncSummaryApiResponse | null;
  pendingReports: ReportApiResponse[];
};

const defaultFilters: DistrictSeverityQueueFilters = {
  status: "all",
  freshness: "all",
  alertState: "all",
  offlineState: "all",
  service: "all",
};

const selectClassName =
  "h-9 min-w-0 rounded-md border border-border bg-background px-2 text-sm text-foreground";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value);
}

function QueueStatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: AdminTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tone === "clear" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
        tone === "attention" &&
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
        tone === "blocked" &&
          "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
        tone === "info" &&
          "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
      )}
    >
      {children}
    </span>
  );
}

export default function DistrictSeverityQueuePageClient({
  pendingReports,
  session,
  syncSummary,
}: DistrictSeverityQueuePageClientProps) {
  const { state } = useDemoStore();
  const [filters, setFilters] = useState<DistrictSeverityQueueFilters>(defaultFilters);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const viewModel = useMemo(
    () =>
      buildDistrictSeverityQueueViewModel({
        state,
        session,
        filters,
        selectedClinicId,
      }),
    [filters, selectedClinicId, session, state],
  );

  const updateFilter = <Key extends keyof DistrictSeverityQueueFilters>(
    key: Key,
    value: DistrictSeverityQueueFilters[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setSelectedClinicId(null);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSelectedClinicId(null);
  };

  const backendSignal = syncSummary
    ? `${formatCount(syncSummary.pendingOfflineReports)} backend offline reports; ${formatCount(
        pendingReports.length,
      )} pending evidence reports`
    : `${formatCount(pendingReports.length)} pending evidence reports`;

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-district-module="severity-queue">
      <AdminModuleHeader
        eyebrow="District command"
        title="Unified severity queue"
        description="Prioritized clinic risk across stale reports, active alerts, offline backlog, and service disruption."
        actions={[
          {
            label: "Open district overview",
            buttonProps: {
              nativeButton: false,
              render: <Link href="/district" />,
              variant: "outline",
            },
          },
        ]}
      />

      <AdminMetricStrip metrics={viewModel.metrics} />

      <AdminFilterBar>
        <label className="grid min-w-[10rem] flex-1 gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
          Status
          <select
            className={selectClassName}
            value={filters.status}
            onChange={(event) =>
              updateFilter("status", event.target.value as DistrictSeverityQueueFilters["status"])
            }
          >
            <option value="all">All statuses</option>
            <option value="non_functional">Non functional</option>
            <option value="degraded">Degraded</option>
            <option value="unknown">Unknown</option>
            <option value="operational">Operational</option>
          </select>
        </label>
        <label className="grid min-w-[10rem] flex-1 gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
          Freshness
          <select
            className={selectClassName}
            value={filters.freshness}
            onChange={(event) =>
              updateFilter(
                "freshness",
                event.target.value as DistrictSeverityQueueFilters["freshness"],
              )
            }
          >
            <option value="all">All freshness</option>
            <option value="fresh">Fresh</option>
            <option value="needs_confirmation">Needs confirmation</option>
            <option value="stale">Stale</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="grid min-w-[10rem] flex-1 gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
          Alert state
          <select
            className={selectClassName}
            value={filters.alertState}
            onChange={(event) =>
              updateFilter(
                "alertState",
                event.target.value as DistrictSeverityQueueFilters["alertState"],
              )
            }
          >
            <option value="all">All signals</option>
            <option value="active">Active alerts</option>
          </select>
        </label>
        <label className="grid min-w-[10rem] flex-1 gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
          Offline queue
          <select
            className={selectClassName}
            value={filters.offlineState}
            onChange={(event) =>
              updateFilter(
                "offlineState",
                event.target.value as DistrictSeverityQueueFilters["offlineState"],
              )
            }
          >
            <option value="all">All queue states</option>
            <option value="queued">Queued reports</option>
          </select>
        </label>
        <label className="grid min-w-[10rem] flex-1 gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
          Service line
          <select
            className={selectClassName}
            value={filters.service}
            onChange={(event) => updateFilter("service", event.target.value)}
          >
            <option value="all">All services</option>
            {viewModel.filterOptions.services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
          <QueueStatusBadge tone={viewModel.queue.length ? "attention" : "info"}>
            {formatCount(viewModel.queue.length)} clinics visible
          </QueueStatusBadge>
          <QueueStatusBadge tone={syncSummary?.pendingOfflineReports ? "attention" : "info"}>
            {backendSignal}
          </QueueStatusBadge>
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </AdminFilterBar>

      {viewModel.queue.length ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="order-2 min-w-0 xl:order-1">
            <SeverityQueueWorklist
              items={viewModel.queue}
              selectedClinicId={viewModel.selectedItem?.clinicId ?? null}
              onSelectClinic={setSelectedClinicId}
            />
          </div>
          <div className="order-1 min-w-0 xl:order-2">
            <SeverityActionPanel
              selectedAction={viewModel.selectedAction}
              selectedItem={viewModel.selectedItem}
            />
          </div>
        </div>
      ) : (
        <AdminEmptyState
          title={viewModel.emptyState.title}
          description={viewModel.emptyState.description}
          action={{
            label: "Clear filters",
            buttonProps: {
              onClick: clearFilters,
              variant: "outline",
            },
          }}
          className="rounded-lg border border-border-subtle bg-bg-default shadow-sm"
        />
      )}
    </div>
  );
}
