"use client";

import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { ReroutePanel } from "@/components/demo/reroute-panel";
import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import { Button } from "@/components/ui/button";
import {
  buildFinderAlternatives,
  filterClinicRows,
  isClinicUnavailable,
  resolveSelectedClinicId,
  sortClinicRowsByDistance,
} from "@/lib/demo/finder";
import type { ClinicRow } from "@/lib/demo/types";

type ClinicFinderProps = {
  clinics: ClinicRow[];
  query: string;
  service: string;
  status: string;
  onNavigateToDetail: (clinicId: string) => void;
};

export function ClinicFinder({
  clinics,
  query,
  status,
  service,
  onNavigateToDetail,
}: ClinicFinderProps) {
  const filtered = useMemo(() => {
    return filterClinicRows(clinics, { query, service, status });
  }, [clinics, query, service, status]);

  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(() => {
    return filtered[0]?.id ?? null;
  });

  const sorted = useMemo(() => {
    return sortClinicRowsByDistance(filtered);
  }, [filtered]);

  const resolvedSelectedClinicId = resolveSelectedClinicId(
    sorted,
    selectedClinicId,
  );
  const selectedClinicRow = sorted.find(
    (entry) => entry.clinic.id === resolvedSelectedClinicId,
  )?.clinic;

  const alternatives = selectedClinicRow
    ? buildFinderAlternatives(clinics, selectedClinicRow)
    : [];

  if (clinics.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Clinic finder"
          title="No-login public flow"
          description="Search by clinic name, district, service, or status to find a nearby clinic."
        />

        <div className="mt-4 grid gap-2">
          {sorted.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-4 text-sm text-content-subtle">
              No clinics match this search.
            </div>
          ) : (
            sorted.slice(0, 12).map((entry) => {
              const { clinic } = entry;
              const distance = `${entry.distanceKm.toFixed(1)} km`;
              const isSelected = resolvedSelectedClinicId === clinic.id;
              const isUnavailable = isClinicUnavailable(clinic);

              return (
                <button
                  key={clinic.id}
                  onClick={() => setSelectedClinicId(clinic.id)}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-border-subtle bg-bg-subtle hover:bg-bg-muted"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{clinic.name}</p>
                      <p
                        className={`mt-1 text-xs ${isSelected ? "text-neutral-200" : "text-content-subtle"}`}
                      >
                        {clinic.facilityCode} · {distance} · {clinic.operatingHours}
                      </p>
                      <p
                        className={`mt-2 text-[11px] ${isSelected ? "text-neutral-200" : "text-content-subtle"}`}
                      >
                        {clinic.services.slice(0, 3).join(", ")}
                      </p>
                    </div>

                    <div className="grid gap-1.5 text-right">
                      <StatusBadge status={clinic.status} />
                      <FreshnessBadge freshness={clinic.freshness} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className={`text-xs ${isSelected ? "text-neutral-200" : "text-content-subtle"}`}>
                      {isUnavailable ? "Needs reroute" : "Open for routing"}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] ${
                        isUnavailable
                          ? isSelected
                            ? "border-amber-400/40 bg-amber-400/20 text-amber-100"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                          : isSelected
                            ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {isUnavailable ? "Directions reroute" : "Get directions"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4">
        {selectedClinicRow ? (
          <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
            <SectionHeader
              eyebrow="Selected clinic"
              title={selectedClinicRow.name}
              description="Open publicly for patients; no login required."
            />
            <p className="mt-2 text-sm text-content-default">{selectedClinicRow.reason}</p>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={selectedClinicRow.status} />
              <FreshnessBadge freshness={selectedClinicRow.freshness} />
            </div>
            <div className="mt-4">
              <Button
                onClick={() => onNavigateToDetail(selectedClinicRow.id)}
                className="w-full"
                size="sm"
              >
                Open clinic detail
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-xs text-content-subtle">
              Last report: {new Date(selectedClinicRow.lastReportedAt).toLocaleString("en-ZA")}
            </div>
          </section>
        ) : null}

        {selectedClinicRow ? (
          <ReroutePanel
            sourceClinicName={selectedClinicRow.name}
            unavailable={isClinicUnavailable(selectedClinicRow)}
            reason={selectedClinicRow.reason}
            recommendations={alternatives.map((entry) => ({
              clinic: entry.clinic,
              distanceKm: entry.distanceKm,
              estimatedMinutes: entry.estimatedMinutes,
              compatibilityServices: entry.compatibilityServices,
              reason: entry.reason,
            }))}
          />
        ) : null}
      </section>
    </section>
  );
}
