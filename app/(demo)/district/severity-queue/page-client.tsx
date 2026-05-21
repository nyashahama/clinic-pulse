"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SeverityFilterToolbar } from "@/components/demo/command-center/severity-filter-toolbar";
import { SeverityMetricStrip } from "@/components/demo/command-center/severity-metric-strip";
import { SeverityActionPanel } from "@/components/demo/command-center/severity-action-panel";
import { SeverityQueueWorklist } from "@/components/demo/command-center/severity-queue-worklist";
import {
  AdminEmptyState,
  AdminModuleHeader,
} from "@/components/product/admin-module";
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

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value);
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

      <SeverityMetricStrip metrics={viewModel.metrics} />

      <SeverityFilterToolbar
        backendSignal={backendSignal}
        backendSignalTone={syncSummary?.pendingOfflineReports ? "attention" : "info"}
        filters={filters}
        services={viewModel.filterOptions.services}
        visibleClinicCount={viewModel.queue.length}
        onClearFilters={clearFilters}
        onFilterChange={updateFilter}
      />

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
