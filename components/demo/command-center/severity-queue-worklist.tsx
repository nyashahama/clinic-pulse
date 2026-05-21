"use client";

import type {
  DistrictSeverityQueueItemWithFlags,
  DistrictSeverityQueueViewModel,
} from "@/lib/demo/district-severity-queue-view-model";
import { cn } from "@/lib/utils";

type SeverityQueueWorklistProps = {
  items: DistrictSeverityQueueViewModel["queue"];
  selectedClinicId: string | null;
  onSelectClinic: (clinicId: string) => void;
};

const severityClassName: Record<DistrictSeverityQueueItemWithFlags["severityLabel"], string> = {
  critical:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  watch:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
  stable:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
};

const reasonLabels: Record<DistrictSeverityQueueItemWithFlags["reasonCodes"][number], string> = {
  service_unavailable: "Service unavailable",
  service_degraded: "Service degraded",
  stale_report: "Stale report",
  unknown_signal: "Unknown signal",
  needs_confirmation: "Needs confirmation",
  active_alert: "Active alert",
  offline_backlog: "Offline backlog",
  no_alternative_capacity: "No alternative capacity",
  limited_alternative_capacity: "Limited alternative capacity",
  worsening_trend: "Worsening trend",
  operational_baseline: "Operational baseline",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function SeverityQueueWorklist({
  items,
  onSelectClinic,
  selectedClinicId,
}: SeverityQueueWorklistProps) {
  return (
    <section
      aria-label="Severity queue worklist"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="hidden grid-cols-[3rem_minmax(12rem,1.35fr)_minmax(10rem,0.9fr)_minmax(6rem,0.35fr)] border-b border-border-subtle bg-bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-content-default md:grid">
        <span>Rank</span>
        <span>Clinic</span>
        <span>Risk</span>
        <span className="text-right">Score</span>
      </div>

      {items.map((item, index) => {
        const isSelected = item.clinicId === selectedClinicId;
        const topReasonCodes = item.reasonCodes.slice(0, 3);

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={`Priority ${index + 1}: ${item.clinicName}, ${item.severityLabel} severity score ${item.score}`}
            onClick={() => onSelectClinic(item.clinicId)}
            className={cn(
              "grid w-full min-w-0 gap-3 border-b border-border-subtle px-3 py-3 text-left last:border-b-0 hover:bg-bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:grid-cols-[3rem_minmax(12rem,1.35fr)_minmax(10rem,0.9fr)_minmax(6rem,0.35fr)] md:items-start",
              isSelected && "bg-bg-muted",
            )}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="block break-words font-medium text-foreground">
                {item.clinicName}
              </span>
              <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                {item.patientImpact}
              </span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {topReasonCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded-md border border-border-subtle bg-bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {reasonLabels[code]}
                  </span>
                ))}
              </span>
            </span>
            <span className="flex min-w-0 flex-wrap gap-1.5">
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                  severityClassName[item.severityLabel],
                )}
              >
                {item.severityLabel}
              </span>
              <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {formatLabel(item.status)}
              </span>
              {item.hasActiveAlert ? (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                  active alert
                </span>
              ) : null}
              {item.isInOfflineQueue ? (
                <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
                  offline queue
                </span>
              ) : null}
            </span>
            <span className="font-mono text-sm font-semibold text-foreground md:text-right">
              {item.score}
            </span>
          </button>
        );
      })}
    </section>
  );
}
