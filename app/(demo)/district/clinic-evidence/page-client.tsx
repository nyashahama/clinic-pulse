"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ClinicEvidenceFilterToolbar,
  ClinicEvidenceLedger,
  ClinicEvidenceMetricStrip,
  ClinicEvidenceSelectedPacket,
} from "@/components/demo/command-center/clinic-evidence-module";
import {
  AdminEmptyState,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  buildDistrictClinicEvidenceViewModel,
  type DistrictClinicEvidenceFilters,
} from "@/lib/demo/district-clinic-evidence-view-model";

const defaultFilters: DistrictClinicEvidenceFilters = {
  kind: "all",
  status: "all",
  source: "all",
  clinic: "all",
  query: "",
};

const kindFilterValues = ["all", "report", "audit", "alert"] satisfies ReadonlyArray<
  DistrictClinicEvidenceFilters["kind"]
>;

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
  "demo_control",
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
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const clinic = searchParams.get("clinic");
  const query = searchParams.get("q") ?? "";

  return {
    kind: includesValue(kindFilterValues, kind) ? kind : "all",
    status: includesValue(statusFilterValues, status) ? status : "all",
    source: includesValue(sourceFilterValues, source) ? source : "all",
    clinic: clinic && clinicIds.includes(clinic) ? clinic : "all",
    query,
  };
}

function serializeFiltersToSearchParams(filters: DistrictClinicEvidenceFilters) {
  const nextSearchParams = new URLSearchParams();

  if (filters.kind !== "all") {
    nextSearchParams.set("kind", filters.kind);
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

  return nextSearchParams.toString();
}

export default function DistrictClinicEvidencePageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useDemoStore();
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
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
  const serializedFilters = serializeFiltersToSearchParams(filters);
  const viewModel = useMemo(
    () =>
      buildDistrictClinicEvidenceViewModel({
        state,
        filters,
        selectedEvidenceId,
      }),
    [filters, selectedEvidenceId, state],
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

  const replaceFilters = (nextFilters: DistrictClinicEvidenceFilters) => {
    const nextSearch = serializeFiltersToSearchParams(nextFilters);

    setSelectedEvidenceId(null);
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
    setSelectedEvidenceId(evidenceId);

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
      <AdminModuleHeader
        eyebrow="District command"
        title="Clinic evidence"
        description="Decision-ready clinic reports, alerts, and audit trail records for district verification."
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
            label: "Open clinic network",
            buttonProps: {
              nativeButton: false,
              render: <Link href="/district/clinic-network" />,
              variant: "outline",
            },
          },
        ]}
      />

      <ClinicEvidenceMetricStrip metrics={viewModel.metrics} />

      <ClinicEvidenceFilterToolbar
        clinicOptions={filterOptions.clinics}
        filters={filters}
        visibleEvidenceCount={viewModel.rows.length}
        onClearFilters={clearFilters}
        onFilterChange={updateFilter}
      />

      {viewModel.rows.length ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="order-2 min-w-0 xl:order-none">
            <ClinicEvidenceLedger
              rows={viewModel.rows}
              selectedEvidenceId={viewModel.selectedPacket?.evidenceId ?? null}
              onSelectEvidence={selectEvidence}
            />
          </div>
          <div ref={selectedPacketRef} className="order-1 min-w-0 scroll-mt-4 xl:order-none">
            <ClinicEvidenceSelectedPacket
              selectedPacket={viewModel.selectedPacket}
              timeline={viewModel.timeline}
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
