"use client";

import type { DistrictSeverityQueueItem } from "@/lib/demo/district-command-center";
import { cn } from "@/lib/utils";

import { CommandCard } from "./command-card";

type SeverityQueueProps = {
  items: DistrictSeverityQueueItem[];
  selectedClinicId: string | null;
  onSelectClinic: (clinicId: string) => void;
};

const SEVERITY_STYLES: Record<DistrictSeverityQueueItem["severityLabel"], string> = {
  critical: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200",
  attention: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200",
  watch: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-200",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
};

const REASON_LABELS: Record<DistrictSeverityQueueItem["reasonCodes"][number], string> = {
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

export function SeverityQueue({ items, selectedClinicId, onSelectClinic }: SeverityQueueProps) {
  return (
    <CommandCard
      eyebrow="Clinic risk order"
      title="Unified severity queue"
      description="A single district queue ordered by severity, patient impact, and operational confidence."
    >
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
          No clinics are currently reporting severity signals. The district queue will populate when clinic risk changes.
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => {
            const isSelected = item.clinicId === selectedClinicId;
            const topReasonCodes = item.reasonCodes.slice(0, 3);

            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Priority ${index + 1}: ${item.clinicName}, ${item.severityLabel} severity score ${item.score}`}
                  onClick={() => onSelectClinic(item.clinicId)}
                  className={cn(
                    "group w-full rounded-2xl border p-4 text-left transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-300"
                      : "border-border bg-card text-card-foreground hover:border-border hover:bg-muted",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", isSelected ? "text-slate-300" : "text-muted-foreground")}>
                        Priority {index + 1}
                      </p>
                      <h3 className="mt-1 text-base font-semibold tracking-tight">{item.clinicName}</h3>
                      <p className={cn("mt-1 text-sm leading-6", isSelected ? "text-slate-200" : "text-muted-foreground")}>
                        {item.patientImpact}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]",
                        isSelected ? "border-white/20 bg-white/10 text-white" : SEVERITY_STYLES[item.severityLabel],
                      )}
                    >
                      {item.severityLabel} {item.score}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {topReasonCodes.map((code) => (
                      <span
                        key={code}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium",
                          isSelected ? "border-white/15 bg-white/10 text-slate-100" : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {REASON_LABELS[code]}
                      </span>
                    ))}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </CommandCard>
  );
}
