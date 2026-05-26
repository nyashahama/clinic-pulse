"use client";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Route,
  UserRound,
} from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import {
  buildFieldVisitCockpitViewModel,
  type FieldVisitItineraryRow,
} from "@/lib/demo/field-visit-cockpit";
import type { ClinicRow } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type FieldClinicListProps =
  | {
      rows: FieldVisitItineraryRow[];
      onSelectClinic: (clinicId: string) => void;
    }
  | {
      clinics: ClinicRow[];
      selectedClinicId: string | null;
      onSelectClinic: (clinicId: string) => void;
    };

function formatReportAge(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function FieldClinicList(props: FieldClinicListProps) {
  const rows =
    "rows" in props
      ? props.rows
      : buildFieldVisitCockpitViewModel({
          clinics: props.clinics,
          selectedClinicId: props.selectedClinicId,
          offlineReports: [],
          isOnline: true,
          lastSyncedAt: null,
        }).itineraryRows;

  return (
    <section
      className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
      id="field-itinerary"
    >
      <SectionHeader
        eyebrow="Today's route"
        title="Field itinerary"
        description="Risk-prioritized clinic stops for this reporting round."
      />

      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <button
            type="button"
            key={row.clinicId}
            onClick={() => props.onSelectClinic(row.clinicId)}
            className={cn(
              "w-full rounded-lg border p-3 text-left transition-colors",
              row.isSelected
                ? "border-neutral-900 bg-neutral-900/95 text-white"
                : "border-border-subtle bg-bg-subtle hover:bg-bg-muted",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
                  {row.positionLabel}
                </p>
                <p className="mt-1 truncate text-sm font-medium">
                  {row.clinicName}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    row.isSelected ? "text-neutral-200" : "text-content-subtle",
                  )}
                >
                  {row.facilityCode} - {row.distanceLabel}
                </p>
              </div>

              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px]",
                  row.isSelected
                    ? "bg-white/15 text-white"
                    : "bg-bg-default text-content-subtle",
                )}
              >
                {row.isSelected ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Route className="size-3.5" />
                )}
                {row.isSelected ? "Selected" : "Open"}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={row.status} />
              <FreshnessBadge freshness={row.freshness} />
              {row.queueLabel ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
                  {row.queueLabel}
                </span>
              ) : null}
            </div>

            {row.isSelected ? (
              <div className="mt-3 grid gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 text-neutral-200">
                  <CalendarClock className="size-3.5" />
                  Last report {formatReportAge(row.lastReportedAt)}
                </span>
                <span className="inline-flex items-center gap-1 text-neutral-200">
                  <UserRound className="size-3.5" />
                  {row.reporterName}
                </span>
                <span className="inline-flex items-center gap-1 text-neutral-200">
                  <ClipboardList className="size-3.5" />
                  {row.reason}
                </span>
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
