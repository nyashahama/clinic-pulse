import Link from "next/link";
import { ArrowUpRight, MapPinned, Route, SearchCheck } from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { ServiceList } from "@/components/demo/service-list";
import { StatusBadge } from "@/components/demo/status-badge";
import type { ClinicRow } from "@/lib/demo/types";

export type RerouteRecommendation = {
  clinic: ClinicRow;
  distanceKm: number;
  estimatedMinutes: number;
  compatibilityServices: string[];
  reason: string;
};

type ReroutePanelProps = {
  sourceClinicName: string;
  unavailable: boolean;
  reason: string;
  recommendations: RerouteRecommendation[];
};

function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1)} km`;
}

function formatMinutes(minutes: number) {
  return `${minutes} min`;
}

export function ReroutePanel({
  sourceClinicName,
  unavailable,
  reason,
  recommendations,
}: ReroutePanelProps) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Routing actions"
        title="Reroute panel"
        description="Show alternatives when a clinic should not be used for direct patient routing."
      />

      {!unavailable ? (
        <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
          {sourceClinicName} is currently available for routing, so reroute suggestions are inactive.
        </div>
      ) : null}

      {unavailable ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <p className="font-medium">Current condition</p>
            <p className="mt-1 leading-6">{reason}</p>
          </div>

          {recommendations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
              No compatible alternatives found in this district for the requested service set.
            </div>
          ) : (
            <div className="grid gap-3">
              {recommendations.map((recommendation) => {
                const { clinic, distanceKm, estimatedMinutes, compatibilityServices, reason } =
                  recommendation;

                return (
                  <article
                    key={clinic.id}
                    className="grid gap-3 rounded-lg border border-border-subtle bg-bg-subtle p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-content-emphasis">
                          {clinic.name}
                        </p>
                        <p className="mt-1 text-xs text-content-subtle">
                          {clinic.facilityCode}
                        </p>
                      </div>
                      <StatusBadge status={clinic.status} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <FreshnessBadge freshness={clinic.freshness} />
                      <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-default px-2 py-1 text-[11px] text-content-subtle">
                        <Route className="size-3" />
                        {formatDistance(distanceKm)} · {formatMinutes(estimatedMinutes)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-default px-2 py-1 text-[11px] text-content-subtle">
                        <MapPinned className="size-3" />
                        Freshness: {clinic.freshness}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                        Service compatibility
                      </p>
                      <div className="mt-2">
                        <ServiceList
                          services={clinic.services}
                          highlightedServices={compatibilityServices}
                          compact
                        />
                      </div>
                    </div>

                    <div className="rounded-md border border-border-subtle bg-bg-default p-2 text-xs text-content-subtle">
                      <p className="font-medium text-content-default">Recommendation reason</p>
                      <p className="mt-1">{reason}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex">
            <Link
              href="/finder"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4"
            >
              Open finder for guided reroute
              <SearchCheck className="size-4" />
            </Link>
          </div>
          <Link
            href="/finder"
            className="inline-flex items-center gap-1.5 text-sm text-content-subtle hover:text-content-emphasis"
          >
            Compare estimated distances
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
