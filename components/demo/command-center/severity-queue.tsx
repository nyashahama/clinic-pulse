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
  critical: "border-red-200 bg-red-50 text-red-900",
  attention: "border-amber-200 bg-amber-50 text-amber-900",
  watch: "border-sky-200 bg-sky-50 text-sky-900",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-900",
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
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
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
                    isSelected
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-300"
                      : "border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", isSelected ? "text-slate-300" : "text-slate-500")}>
                        Priority {index + 1}
                      </p>
                      <h3 className="mt-1 text-base font-semibold tracking-tight">{item.clinicName}</h3>
                      <p className={cn("mt-1 text-sm leading-6", isSelected ? "text-slate-200" : "text-slate-600")}>
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
                          isSelected ? "border-white/15 bg-white/10 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-600",
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
