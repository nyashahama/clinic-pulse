"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  InterventionsCommandHeader,
  InterventionsFilterToolbar,
  InterventionsLedger,
  InterventionsMetricStrip,
  InterventionsSelectedPlan,
  InterventionsStageLanes,
} from "@/components/demo/command-center/interventions-module";
import { AdminEmptyState } from "@/components/product/admin-module";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  buildDistrictInterventionsViewModel,
  type DistrictInterventionsFilters,
} from "@/lib/demo/district-interventions-view-model";

const defaultFilters: DistrictInterventionsFilters = {
  lens: "all",
  priority: "all",
  service: "all",
  query: "",
};

const lensFilterValues = [
  "all",
  "routing",
  "verification",
  "proof_due",
  "monitoring",
] satisfies ReadonlyArray<DistrictInterventionsFilters["lens"]>;

const priorityFilterValues = [
  "all",
  "critical",
  "watch",
  "attention",
  "stable",
] satisfies ReadonlyArray<DistrictInterventionsFilters["priority"]>;

function includesValue<T extends string>(
  values: ReadonlyArray<T>,
  value: string | null,
): value is T {
  return value !== null && values.includes(value as T);
}

function parseFiltersFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
  services: string[],
): DistrictInterventionsFilters {
  const lens = searchParams.get("stage");
  const priority = searchParams.get("priority");
  const service = searchParams.get("service");
  const query = searchParams.get("q") ?? "";

  return {
    lens: includesValue(lensFilterValues, lens) ? lens : "all",
    priority: includesValue(priorityFilterValues, priority) ? priority : "all",
    service: service && services.includes(service) ? service : "all",
    query,
  };
}

function parseSelectedPlanId(searchParams: Pick<URLSearchParams, "get">) {
  const planId = searchParams.get("plan")?.trim();

  return planId || null;
}

function serializeFiltersToSearchParams(
  filters: DistrictInterventionsFilters,
  selectedPlanId?: string | null,
) {
  const nextSearchParams = new URLSearchParams();

  if (filters.lens !== "all") {
    nextSearchParams.set("stage", filters.lens);
  }

  if (filters.priority !== "all") {
    nextSearchParams.set("priority", filters.priority);
  }

  if (filters.service !== "all") {
    nextSearchParams.set("service", filters.service);
  }

  if (filters.query.trim()) {
    nextSearchParams.set("q", filters.query.trim());
  }

  if (selectedPlanId?.trim()) {
    nextSearchParams.set("plan", selectedPlanId.trim());
  }

  return nextSearchParams.toString();
}

export default function DistrictInterventionsPageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useDemoStore();
  const selectedPlanRef = useRef<HTMLDivElement>(null);
  const filterOptions = useMemo(
    () =>
      buildDistrictInterventionsViewModel({
        state,
        filters: defaultFilters,
        selectedPlanId: null,
      }).filterOptions,
    [state],
  );
  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams, filterOptions.services),
    [filterOptions.services, searchParams],
  );
  const selectedPlanId = useMemo(
    () => parseSelectedPlanId(searchParams),
    [searchParams],
  );
  const viewModel = useMemo(
    () =>
      buildDistrictInterventionsViewModel({
        state,
        filters,
        selectedPlanId,
      }),
    [filters, selectedPlanId, state],
  );
  const normalizedSelectedPlanId =
    selectedPlanId && viewModel.selectedPlan?.planId === selectedPlanId
      ? selectedPlanId
      : null;
  const serializedSearch = serializeFiltersToSearchParams(
    filters,
    normalizedSelectedPlanId,
  );

  useEffect(() => {
    const currentSearch = searchParams.toString();

    if (currentSearch === serializedSearch) {
      return;
    }

    router.replace(serializedSearch ? `${pathname}?${serializedSearch}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams, serializedSearch]);

  const replaceSearch = (
    nextFilters: DistrictInterventionsFilters,
    nextSelectedPlanId: string | null,
  ) => {
    const nextSearch = serializeFiltersToSearchParams(nextFilters, nextSelectedPlanId);

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
      scroll: false,
    });
  };

  const updateFilter = <Key extends keyof DistrictInterventionsFilters>(
    key: Key,
    value: DistrictInterventionsFilters[Key],
  ) => {
    replaceSearch({ ...filters, [key]: value }, null);
  };

  const clearFilters = () => {
    replaceSearch(defaultFilters, null);
  };

  const selectPlan = (planId: string) => {
    replaceSearch(filters, planId);
    window.requestAnimationFrame(() => {
      selectedPlanRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    });
  };

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-district-module="interventions">
      <InterventionsCommandHeader header={viewModel.header} />

      <div
        className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.43fr)]"
        data-district-interventions-layout="plan-first"
      >
        <div className="order-1 min-w-0 xl:order-2" ref={selectedPlanRef}>
          <div className="xl:sticky xl:top-4">
            <InterventionsSelectedPlan
              selectedPlan={viewModel.selectedPlan}
              onSelectPlan={selectPlan}
            />
          </div>
        </div>

        <div className="order-2 grid min-w-0 gap-4 xl:order-1">
          <InterventionsMetricStrip metrics={viewModel.metrics} />
          <InterventionsFilterToolbar
            filters={filters}
            onClearFilters={clearFilters}
            onFilterChange={updateFilter}
            services={filterOptions.services}
            visiblePlanCount={viewModel.plans.length}
          />
          <InterventionsStageLanes
            lanes={viewModel.stageLanes}
            selectedLens={filters.lens}
            onSelectLens={(lens) => updateFilter("lens", lens)}
          />
          {viewModel.plans.length > 0 ? (
            <InterventionsLedger
              plans={viewModel.plans}
              selectedPlanId={viewModel.selectedPlan?.planId ?? null}
              onSelectPlan={selectPlan}
            />
          ) : (
            <AdminEmptyState
              title={viewModel.emptyState.title}
              description={viewModel.emptyState.description}
            />
          )}
        </div>
      </div>
    </div>
  );
}
