import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPinned,
  Route,
} from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { ServiceList } from "@/components/demo/service-list";
import { StatusBadge } from "@/components/demo/status-badge";
import {
  formatImpactDistance,
  formatImpactMinutes,
  type PatientJourneyImpact,
} from "@/lib/demo/patient-journey";
import { cn } from "@/lib/utils";

type PatientJourneyImpactPanelProps = {
  impact: PatientJourneyImpact;
  variant?: "patient" | "evidence";
  actions?: ReactNode;
  className?: string;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Report time unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPanelCopy(impact: PatientJourneyImpact, isEvidence: boolean) {
  if (impact.state === "reroute_recommended") {
    return {
      title: "Wasted trip avoided",
      description: isEvidence
        ? "Source condition, ranking result, and recommendation evidence in one trace."
        : "Before travelling, compare the affected clinic with the recommended compatible option.",
    };
  }

  if (impact.state === "no_safe_recommendation") {
    return {
      title: "No compatible safe recommendation",
      description: isEvidence
        ? "Source condition is visible, but no eligible compatible destination is safe to present."
        : "The selected clinic should not be replaced with an alternative until safe compatible data is available.",
    };
  }

  return {
    title: "Routing check",
    description: isEvidence
      ? "Source condition confirms this clinic is available for normal routing."
      : "This clinic is currently available, so no avoided-trip claim is shown.",
  };
}

export function PatientJourneyImpactPanel({
  impact,
  variant = "patient",
  actions,
  className,
}: PatientJourneyImpactPanelProps) {
  const recommendedClinic = impact.recommendedClinic;
  const recommendationReason = impact.trustSignals.recommendation?.reason;
  const isEvidence = variant === "evidence";
  const panelCopy = getPanelCopy(impact, isEvidence);
  const afterDescription =
    impact.state === "available"
      ? `${impact.sourceClinic.name} is currently available for routing.`
      : recommendedClinic
        ? `${recommendedClinic.name} is the current recommended alternative.`
        : "No alternative should be shown as safe without compatible recommendation data.";

  return (
    <section
      className={cn(
        "rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm",
        className,
      )}
    >
      <SectionHeader
        eyebrow={isEvidence ? "Routing evidence" : "Journey impact"}
        title={panelCopy.title}
        description={panelCopy.description}
        actions={actions}
      />

      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
              <AlertTriangle className="size-4" aria-hidden="true" />
              <span>Before</span>
            </div>
            <p className="mt-2 text-sm font-medium text-amber-950">
              {impact.beforeOutcome}
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Patient would try {impact.sourceClinic.name} for{" "}
              {impact.requestedService || "care"}.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              <span>After</span>
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-950">
              {impact.afterOutcome}
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-900">
              {afterDescription}
            </p>
          </div>
        </div>

        {impact.state === "reroute_recommended" && recommendedClinic ? (
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                  <Clock className="size-3.5" aria-hidden="true" />
                  <span>Wasted travel</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-content-emphasis">
                  {formatImpactMinutes(
                    impact.impactMetrics.estimatedWastedTravelMinutesSaved,
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                  <Route className="size-3.5" aria-hidden="true" />
                  <span>Recommendation</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-content-emphasis">
                  {formatImpactDistance(
                    impact.impactMetrics.recommendedDistanceKm,
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                  <MapPinned className="size-3.5" aria-hidden="true" />
                  <span>Source trip</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-content-emphasis">
                  {formatImpactDistance(impact.impactMetrics.sourceDistanceKm)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Compatible services
              </p>
              <div className="mt-2">
                <ServiceList
                  services={recommendedClinic.services}
                  highlightedServices={impact.impactMetrics.compatibleServices}
                  compact
                />
              </div>
            </div>
          </div>
        ) : null}

        {impact.state === "no_safe_recommendation" ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
            No compatible safe recommendation is available for this selected
            clinic and service.
          </div>
        ) : null}

        {impact.state === "available" ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
            {impact.sourceClinic.name} is currently available for routing, so
            no avoided-trip claim is shown.
          </div>
        ) : null}

        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={impact.trustSignals.sourceStatus} />
            <FreshnessBadge freshness={impact.trustSignals.sourceFreshness} />
            {recommendedClinic && impact.trustSignals.recommendation ? (
              <>
                <StatusBadge status={impact.trustSignals.recommendation.status} />
                <FreshnessBadge
                  freshness={impact.trustSignals.recommendation.freshness}
                />
              </>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-content-subtle">
            {isEvidence ? "Source evidence: " : ""}
            {impact.trustSignals.reason}
          </p>
          {recommendationReason ? (
            <p className="mt-1 text-xs leading-5 text-content-subtle">
              {isEvidence ? "Recommendation evidence: " : ""}
              {recommendationReason}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-content-subtle">
            Last source report: {formatDateTime(impact.trustSignals.lastReportedAt)}
          </p>
        </div>
      </div>
    </section>
  );
}
