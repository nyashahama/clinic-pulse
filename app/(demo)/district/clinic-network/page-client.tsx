"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ClinicNetworkFilterToolbar,
  ClinicNetworkMapPanel,
  ClinicNetworkMetricStrip,
  ClinicNetworkSelectedProfile,
  ClinicNetworkWorklist,
} from "@/components/demo/command-center/clinic-network-module";
import {
  AdminEmptyState,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import type { ClientAuthSession } from "@/lib/auth/api";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  buildDistrictClinicNetworkViewModel,
  type DistrictClinicNetworkFilters,
} from "@/lib/demo/district-clinic-network-view-model";

type DistrictClinicNetworkPageClientProps = {
  session: ClientAuthSession;
};

const defaultFilters: DistrictClinicNetworkFilters = {
  status: "all",
  freshness: "all",
  source: "all",
  service: "all",
  query: "",
};

const statusFilterValues = [
  "all",
  "non_functional",
  "degraded",
  "unknown",
  "operational",
] satisfies ReadonlyArray<DistrictClinicNetworkFilters["status"]>;

const freshnessFilterValues = [
  "all",
  "fresh",
  "needs_confirmation",
  "stale",
  "unknown",
] satisfies ReadonlyArray<DistrictClinicNetworkFilters["freshness"]>;

const sourceFilterValues = [
  "all",
  "field_worker",
  "clinic_coordinator",
  "demo_control",
  "seed",
] satisfies ReadonlyArray<DistrictClinicNetworkFilters["source"]>;

function includesValue<T extends string>(
  values: ReadonlyArray<T>,
  value: string | null,
): value is T {
  return value !== null && values.includes(value as T);
}

function parseFiltersFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
  services: string[],
): DistrictClinicNetworkFilters {
  const status = searchParams.get("status");
  const freshness = searchParams.get("freshness");
  const source = searchParams.get("source");
  const service = searchParams.get("service");
  const query = searchParams.get("q") ?? "";

  return {
    status: includesValue(statusFilterValues, status) ? status : "all",
    freshness: includesValue(freshnessFilterValues, freshness) ? freshness : "all",
    source: includesValue(sourceFilterValues, source) ? source : "all",
    service: service && services.includes(service) ? service : "all",
    query,
  };
}

function serializeFiltersToSearchParams(filters: DistrictClinicNetworkFilters) {
  const nextSearchParams = new URLSearchParams();

  if (filters.status !== "all") {
    nextSearchParams.set("status", filters.status);
  }

  if (filters.freshness !== "all") {
    nextSearchParams.set("freshness", filters.freshness);
  }

  if (filters.source !== "all") {
    nextSearchParams.set("source", filters.source);
  }

  if (filters.service !== "all") {
    nextSearchParams.set("service", filters.service);
  }

  if (filters.query.trim()) {
    nextSearchParams.set("q", filters.query.trim());
  }

  return nextSearchParams.toString();
}

export default function DistrictClinicNetworkPageClient({
  session,
}: DistrictClinicNetworkPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useDemoStore();
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const filterOptions = useMemo(
    () =>
      buildDistrictClinicNetworkViewModel({
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
      buildDistrictClinicNetworkViewModel({
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

  const replaceFilters = (nextFilters: DistrictClinicNetworkFilters) => {
    const nextSearch = serializeFiltersToSearchParams(nextFilters);

    setSelectedClinicId(null);
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
      scroll: false,
    });
  };

  const updateFilter = <Key extends keyof DistrictClinicNetworkFilters>(
    key: Key,
    value: DistrictClinicNetworkFilters[Key],
  ) => {
    replaceFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    replaceFilters(defaultFilters);
  };

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-district-module="clinic-network">
      <AdminModuleHeader
        eyebrow="District command"
        title="Clinic network"
        description="District-wide facility availability, coverage posture, and service capacity before clinics enter the severity queue."
        actions={[
          {
            label: "Open severity queue",
            buttonProps: {
              nativeButton: false,
              render: <Link href="/district/severity-queue" />,
              variant: "outline",
            },
          },
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

      <div className="order-2 md:order-none">
        <ClinicNetworkMetricStrip metrics={viewModel.metrics} />
      </div>

      <div className="order-3 md:order-none">
        <ClinicNetworkFilterToolbar
          filters={filters}
          services={filterOptions.services}
          visibleClinicCount={viewModel.clinics.length}
          onClearFilters={clearFilters}
          onFilterChange={updateFilter}
        />
      </div>

      {viewModel.clinics.length ? (
        <div
          className="order-1 grid min-w-0 gap-4 md:order-none"
          data-district-clinic-network-layout="map-first"
        >
          <div
            className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]"
            data-district-clinic-network-command-surface
          >
            <ClinicNetworkMapPanel
              clinics={viewModel.clinics}
              selectedClinic={viewModel.selectedClinic}
              onSelectClinic={setSelectedClinicId}
            />
            <ClinicNetworkSelectedProfile selectedClinic={viewModel.selectedClinic} />
          </div>
          <ClinicNetworkWorklist
            clinics={viewModel.clinics}
            emptyState={viewModel.emptyState}
            selectedClinicId={viewModel.selectedClinic?.clinicId ?? null}
            onSelectClinic={setSelectedClinicId}
          />
        </div>
      ) : (
        <AdminEmptyState
          title={viewModel.emptyState?.title ?? "No clinics match these filters"}
          description={
            viewModel.emptyState?.description ??
            "Clear filters or broaden the service line to return to the full district clinic network."
          }
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
