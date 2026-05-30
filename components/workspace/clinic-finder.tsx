"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FreshnessBadge } from "@/components/workspace/freshness-badge";
import { PatientJourneyImpactPanel } from "@/components/workspace/patient-journey-impact";
import { ReroutePanel } from "@/components/workspace/reroute-panel";
import { SectionHeader } from "@/components/workspace/section-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  type AlternativeRecommendation,
  loadAlternativeRecommendations,
  resolveAlternativeService,
} from "@/lib/workspace/alternatives";
import {
  filterClinicRows,
  isClinicUnavailable,
  resolveSelectedClinicId,
  sortClinicRowsByDistance,
} from "@/lib/workspace/finder";
import { buildPatientJourneyImpact } from "@/lib/workspace/patient-journey";
import { buildRecommendationInputKey } from "@/lib/workspace/recommendation-input-key";
import type { ClinicRow } from "@/lib/workspace/types";

type ClinicFinderProps = {
  clinics: ClinicRow[];
  query: string;
  service: string;
  status: string;
  onNavigateToDetail: (clinicId: string) => void;
};

type RecommendationResult = {
  key: string;
  recommendations: AlternativeRecommendation[];
};

function buildDirectionsUrl(clinic: ClinicRow) {
  const destination = `${clinic.name}, ${clinic.district}, ${clinic.province}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}

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
  const selectedDirectionsUrl = selectedClinicRow ? buildDirectionsUrl(selectedClinicRow) : null;

  const recommendationKey = selectedClinicRow
    ? buildRecommendationInputKey({
        sourceClinic: selectedClinicRow,
        localClinics: clinics,
        requestedService: resolveAlternativeService(selectedClinicRow, service),
      })
    : "";
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult>({
    key: "",
    recommendations: [],
  });
  const recommendationsReady = recommendationResult.key === recommendationKey;
  const recommendations =
    recommendationsReady ? recommendationResult.recommendations : [];
  const patientJourneyImpact = selectedClinicRow && recommendationsReady
    ? buildPatientJourneyImpact({
        sourceClinic: selectedClinicRow,
        requestedService: service,
        recommendations,
      })
    : null;
  const recommendedDirectionsUrl = patientJourneyImpact?.recommendedClinic
    ? buildDirectionsUrl(patientJourneyImpact.recommendedClinic)
    : null;

  useEffect(() => {
    let isCurrent = true;
    const abortController = new AbortController();

    if (!selectedClinicRow) {
      abortController.abort();
      return;
    }

    void loadAlternativeRecommendations({
      sourceClinic: selectedClinicRow,
      localClinics: clinics,
      requestedService: service,
      apiOptions: {
        init: {
          signal: abortController.signal,
        },
      },
      onFetchError: (error) => {
        console.warn("Unable to fetch backend finder alternatives.", error);
      },
    }).then((nextRecommendations) => {
      if (isCurrent) {
        setRecommendationResult({
          key: recommendationKey,
          recommendations: nextRecommendations,
        });
      }
    });

    return () => {
      isCurrent = false;
      abortController.abort();
    };
  }, [clinics, recommendationKey, selectedClinicRow, service]);

  if (clinics.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Clinic finder"
          title="Public routing view"
          description="Search by clinic name, district, service, or status to find the safest nearby care option."
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
                            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200"
                          : isSelected
                            ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200"
                      }`}
                    >
                      {isUnavailable ? "Reroute recommended" : "Routing available"}
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
              description="Public operating context for patients and coordinators."
            />
            <p className="mt-2 text-sm text-content-default">{selectedClinicRow.reason}</p>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={selectedClinicRow.status} />
              <FreshnessBadge freshness={selectedClinicRow.freshness} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                onClick={() => onNavigateToDetail(selectedClinicRow.id)}
                className="w-full"
                size="sm"
              >
                Open clinic detail
                <ExternalLink className="size-3.5" />
              </Button>
              {selectedDirectionsUrl ? (
                <a
                  href={selectedDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: "sm", variant: "outline", className: "w-full" })}
                >
                  Open directions
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-xs text-content-subtle">
              Last report: {new Date(selectedClinicRow.lastReportedAt).toLocaleString("en-ZA")}
            </div>
          </section>
        ) : null}

        {patientJourneyImpact ? (
          <PatientJourneyImpactPanel
            impact={patientJourneyImpact}
            actions={
              recommendedDirectionsUrl ? (
                <a
                  href={recommendedDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: "sm", variant: "default" })}
                >
                  Open recommended directions
                  <ExternalLink className="size-3.5" />
                </a>
              ) : undefined
            }
          />
        ) : null}

        {selectedClinicRow && !recommendationsReady && isClinicUnavailable(selectedClinicRow) ? (
          <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
            <SectionHeader
              eyebrow="Routing actions"
              title="Checking alternatives"
              description="Compatible recommendations are loading for the selected clinic and service."
            />
            <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
              Recommendation data is still loading. No empty reroute result is shown until the current request completes.
            </div>
          </section>
        ) : null}

        {selectedClinicRow && (recommendationsReady || !isClinicUnavailable(selectedClinicRow)) ? (
          <ReroutePanel
            sourceClinicName={selectedClinicRow.name}
            unavailable={isClinicUnavailable(selectedClinicRow)}
            reason={selectedClinicRow.reason}
            recommendations={recommendations}
          />
        ) : null}
      </section>
    </section>
  );
}
