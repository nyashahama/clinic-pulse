"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SeverityFilterToolbar } from "@/components/workspace/command-center/severity-filter-toolbar";
import { SeverityMetricStrip } from "@/components/workspace/command-center/severity-metric-strip";
import { SeverityActionPanel } from "@/components/workspace/command-center/severity-action-panel";
import { SeverityQueueWorklist } from "@/components/workspace/command-center/severity-queue-worklist";
import {
  AdminEmptyState,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import type { ClientAuthSession } from "@/lib/auth/api";
import type {
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/workspace/api-types";
import { useWorkspaceStore } from "@/lib/workspace/workspace-store";
import {
  buildDistrictSeverityQueueViewModel,
  type DistrictSeverityQueueFilters,
} from "@/lib/workspace/district-severity-queue-view-model";

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

const statusFilterValues = [
  "all",
  "non_functional",
  "degraded",
  "unknown",
  "operational",
] satisfies ReadonlyArray<DistrictSeverityQueueFilters["status"]>;

const freshnessFilterValues = [
  "all",
  "fresh",
  "needs_confirmation",
  "stale",
  "unknown",
] satisfies ReadonlyArray<DistrictSeverityQueueFilters["freshness"]>;

const alertFilterValues = ["all", "active"] satisfies ReadonlyArray<
  DistrictSeverityQueueFilters["alertState"]
>;

const offlineFilterValues = ["all", "queued"] satisfies ReadonlyArray<
  DistrictSeverityQueueFilters["offlineState"]
>;

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value);
}

function includesValue<T extends string>(
  values: ReadonlyArray<T>,
  value: string | null,
): value is T {
  return value !== null && values.includes(value as T);
}

function parseFiltersFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
  services: string[],
): DistrictSeverityQueueFilters {
  const status = searchParams.get("status");
  const freshness = searchParams.get("freshness");
  const alert = searchParams.get("alert");
  const offline = searchParams.get("offline");
  const service = searchParams.get("service");

  return {
    status: includesValue(statusFilterValues, status) ? status : "all",
    freshness: includesValue(freshnessFilterValues, freshness) ? freshness : "all",
    alertState: includesValue(alertFilterValues, alert) ? alert : "all",
    offlineState: includesValue(offlineFilterValues, offline) ? offline : "all",
    service: service && services.includes(service) ? service : "all",
  };
}

function serializeFiltersToSearchParams(filters: DistrictSeverityQueueFilters) {
  const nextSearchParams = new URLSearchParams();

  if (filters.status !== "all") {
    nextSearchParams.set("status", filters.status);
  }

  if (filters.freshness !== "all") {
    nextSearchParams.set("freshness", filters.freshness);
  }

  if (filters.alertState !== "all") {
    nextSearchParams.set("alert", filters.alertState);
  }

  if (filters.offlineState !== "all") {
    nextSearchParams.set("offline", filters.offlineState);
  }

  if (filters.service !== "all") {
    nextSearchParams.set("service", filters.service);
  }

  return nextSearchParams.toString();
}

export default function DistrictSeverityQueuePageClient({
  pendingReports,
  session,
  syncSummary,
}: DistrictSeverityQueuePageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useWorkspaceStore();
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const filterOptions = useMemo(
    () =>
      buildDistrictSeverityQueueViewModel({
        state,
        session,
        filters: defaultFilters,
        selectedClinicId: null,
      }).filterOptions,
    [session, state],
  );
  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams, filterOptions.services),
    [filterOptions.services, searchParams],
  );
  const serializedFilters = serializeFiltersToSearchParams(filters);
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

  useEffect(() => {
    const currentSearch = searchParams.toString();

    if (currentSearch === serializedFilters) {
      return;
    }

    router.replace(
      serializedFilters ? `${pathname}?${serializedFilters}` : pathname,
      { scroll: false },
    );
  }, [pathname, router, searchParams, serializedFilters]);

  const replaceFilters = (nextFilters: DistrictSeverityQueueFilters) => {
    const nextSearch = serializeFiltersToSearchParams(nextFilters);

    setSelectedClinicId(null);
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
      scroll: false,
    });
  };

  const updateFilter = <Key extends keyof DistrictSeverityQueueFilters>(
    key: Key,
    value: DistrictSeverityQueueFilters[Key],
  ) => {
    replaceFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    replaceFilters(defaultFilters);
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
        services={filterOptions.services}
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
