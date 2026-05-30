"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ClinicEvidenceCommandHeader,
  ClinicEvidenceFilterToolbar,
  ClinicEvidenceLedger,
  ClinicEvidenceMetricStrip,
  ClinicEvidenceReviewQueue,
  ClinicEvidenceSelectedPacket,
} from "@/components/workspace/command-center/clinic-evidence-module";
import { AdminEmptyState } from "@/components/product/admin-module";
import { useWorkspaceStore } from "@/lib/workspace/workspace-store";
import {
  buildDistrictClinicEvidenceViewModel,
  type DistrictClinicEvidenceFilters,
} from "@/lib/workspace/district-clinic-evidence-view-model";

const defaultFilters: DistrictClinicEvidenceFilters = {
  kind: "all",
  queue: "all",
  status: "all",
  source: "all",
  clinic: "all",
  query: "",
};

const kindFilterValues = ["all", "report", "audit", "alert"] satisfies ReadonlyArray<
  DistrictClinicEvidenceFilters["kind"]
>;

const queueFilterValues = [
  "all",
  "needs_action",
  "reports",
  "alerts",
  "audit",
] satisfies ReadonlyArray<DistrictClinicEvidenceFilters["queue"]>;

const statusFilterValues = [
  "all",
  "non_functional",
  "degraded",
  "unknown",
  "operational",
] satisfies ReadonlyArray<DistrictClinicEvidenceFilters["status"]>;

const sourceFilterValues = [
  "all",
  "field_worker",
  "clinic_coordinator",
  "scenario_control",
  "seed",
  "audit_log",
  "alert",
] satisfies ReadonlyArray<DistrictClinicEvidenceFilters["source"]>;

function includesValue<T extends string>(
  values: ReadonlyArray<T>,
  value: string | null,
): value is T {
  return value !== null && values.includes(value as T);
}

function parseFiltersFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
  clinicIds: string[],
): DistrictClinicEvidenceFilters {
  const kind = searchParams.get("kind");
  const queue = searchParams.get("queue");
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const clinic = searchParams.get("clinic");
  const query = searchParams.get("q") ?? "";

  return {
    kind: includesValue(kindFilterValues, kind) ? kind : "all",
    queue: includesValue(queueFilterValues, queue) ? queue : "all",
    status: includesValue(statusFilterValues, status) ? status : "all",
    source: includesValue(sourceFilterValues, source) ? source : "all",
    clinic: clinic && clinicIds.includes(clinic) ? clinic : "all",
    query,
  };
}

function parseSelectedEvidenceId(searchParams: Pick<URLSearchParams, "get">) {
  const evidenceId = searchParams.get("evidence")?.trim();

  return evidenceId || null;
}

function serializeFiltersToSearchParams(
  filters: DistrictClinicEvidenceFilters,
  selectedEvidenceId?: string | null,
) {
  const nextSearchParams = new URLSearchParams();

  if (filters.kind !== "all") {
    nextSearchParams.set("kind", filters.kind);
  }

  if (filters.queue !== "all") {
    nextSearchParams.set("queue", filters.queue);
  }

  if (filters.status !== "all") {
    nextSearchParams.set("status", filters.status);
  }

  if (filters.source !== "all") {
    nextSearchParams.set("source", filters.source);
  }

  if (filters.clinic !== "all") {
    nextSearchParams.set("clinic", filters.clinic);
  }

  if (filters.query.trim()) {
    nextSearchParams.set("q", filters.query.trim());
  }

  if (selectedEvidenceId?.trim()) {
    nextSearchParams.set("evidence", selectedEvidenceId.trim());
  }

  return nextSearchParams.toString();
}

export default function DistrictClinicEvidencePageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useWorkspaceStore();
  const selectedPacketRef = useRef<HTMLDivElement>(null);
  const filterOptions = useMemo(
    () =>
      buildDistrictClinicEvidenceViewModel({
        state,
        filters: defaultFilters,
        selectedEvidenceId: null,
      }).filterOptions,
    [state],
  );
  const clinicIds = useMemo(
    () => filterOptions.clinics.map((clinic) => clinic.value),
    [filterOptions.clinics],
  );
  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams, clinicIds),
    [clinicIds, searchParams],
  );
  const selectedEvidenceId = useMemo(
    () => parseSelectedEvidenceId(searchParams),
    [searchParams],
  );
  const viewModel = useMemo(
    () =>
      buildDistrictClinicEvidenceViewModel({
        state,
        filters,
        selectedEvidenceId,
      }),
    [filters, selectedEvidenceId, state],
  );
  const normalizedSelectedEvidenceId =
    selectedEvidenceId &&
    viewModel.selectedPacket?.evidenceId === selectedEvidenceId
      ? selectedEvidenceId
      : null;
  const serializedSearch = serializeFiltersToSearchParams(
    filters,
    normalizedSelectedEvidenceId,
  );

  useEffect(() => {
    const currentSearch = searchParams.toString();

    if (currentSearch === serializedSearch) {
      return;
    }

    router.replace(
      serializedSearch ? `${pathname}?${serializedSearch}` : pathname,
      { scroll: false },
    );
  }, [pathname, router, searchParams, serializedSearch]);

  const replaceFilters = (nextFilters: DistrictClinicEvidenceFilters) => {
    const nextSearch = serializeFiltersToSearchParams(nextFilters);

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
      scroll: false,
    });
  };

  const updateFilter = <Key extends keyof DistrictClinicEvidenceFilters>(
    key: Key,
    value: DistrictClinicEvidenceFilters[Key],
  ) => {
    replaceFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    replaceFilters(defaultFilters);
  };

  const selectEvidence = (evidenceId: string) => {
    const nextSearch = serializeFiltersToSearchParams(filters, evidenceId);

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
      scroll: false,
    });

    if (window.matchMedia("(max-width: 1279px)").matches) {
      window.requestAnimationFrame(() => {
        selectedPacketRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      });
    }
  };

  return (
    <div className="grid min-w-0 gap-4 pb-6" data-district-module="clinic-evidence">
      <ClinicEvidenceCommandHeader header={viewModel.header} />

      <div
        className="grid min-w-0 gap-4"
        data-district-clinic-evidence-layout="review-first"
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] xl:items-start">
          <div className="order-2 min-w-0 xl:order-1">
            <ClinicEvidenceReviewQueue
              queue={viewModel.queue}
              onQueueChange={(queue) => updateFilter("queue", queue)}
            >
              <ClinicEvidenceFilterToolbar
                embedded
                clinicOptions={filterOptions.clinics}
                filters={filters}
                visibleEvidenceCount={viewModel.rows.length}
                onClearFilters={clearFilters}
                onFilterChange={updateFilter}
              />
              {viewModel.rows.length ? (
                <ClinicEvidenceLedger
                  embedded
                  rows={viewModel.rows}
                  selectedEvidenceId={viewModel.selectedPacket?.evidenceId ?? null}
                  onSelectEvidence={selectEvidence}
                />
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
                  className="border-t border-border-subtle"
                />
              )}
            </ClinicEvidenceReviewQueue>
          </div>
          <div
            ref={selectedPacketRef}
            className="order-1 min-w-0 scroll-mt-4 xl:order-2 xl:sticky xl:top-4"
          >
            <ClinicEvidenceSelectedPacket
              selectedPacket={viewModel.selectedPacket}
              onSelectEvidence={selectEvidence}
              timeline={viewModel.timeline}
            />
          </div>
        </div>
        <ClinicEvidenceMetricStrip metrics={viewModel.metrics} />
      </div>
    </div>
  );
}
