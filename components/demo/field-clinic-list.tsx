"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  Navigation,
  Route,
  UserRound,
} from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import {
  buildFieldVisitCockpitViewModel,
  type FieldVisitTone,
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

const routeToneClassNames: Record<FieldVisitTone, string> = {
  blocked: "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

function FieldRouteMap({
  rows,
  onSelectClinic,
}: {
  rows: FieldVisitItineraryRow[];
  onSelectClinic: (clinicId: string) => void;
}) {
  if (rows.length === 0) {
    return null;
  }

  const activeStop = rows.find((row) => row.isSelected) ?? rows[0];
  const riskStopCount = rows.filter((row) => row.tone !== "clear").length;
  const savedStopCount = rows.filter((row) => row.queueLabel).length;

  return (
    <div
      aria-labelledby="field-route-map-title"
      className="-mx-4 mt-4 border-y border-border-subtle bg-bg-subtle px-4 py-3"
      data-testid="field-route-map"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPinned className="size-4 text-primary" aria-hidden="true" />
            <h3
              className="text-sm font-semibold tracking-normal text-content-emphasis"
              id="field-route-map-title"
            >
              Route map
            </h3>
          </div>
          <p className="mt-1 text-sm text-content-subtle">
            {rows.length} stops - risk-prioritized field route.
          </p>
          <p className="mt-2 text-xs font-medium text-content-emphasis">
            Active: {activeStop.clinicName}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-1">
            {activeStop.positionLabel}
          </span>
          <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-1">
            {riskStopCount} risk
          </span>
          <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-1">
            {savedStopCount} saved
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {rows.map((row) => (
          <button
            aria-current={row.isSelected ? "step" : undefined}
            aria-label={`Open stop ${row.positionLabel}: ${row.clinicName}`}
            className={cn(
              "group grid min-h-20 gap-2 rounded-lg border p-2 text-left text-xs transition",
              row.isSelected
                ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                : cn(routeToneClassNames[row.tone], "hover:border-neutral-900/40"),
            )}
            key={row.clinicId}
            onClick={() => onSelectClinic(row.clinicId)}
            type="button"
          >
            <span className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  row.isSelected ? "text-white" : "text-current",
                )}
              >
                {row.tone === "blocked" || row.tone === "attention" ? (
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                ) : (
                  <Navigation className="size-3.5" aria-hidden="true" />
                )}
                {row.positionLabel}
              </span>
              {row.isSelected ? (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">
                  Active
                </span>
              ) : null}
            </span>

            <span className="min-w-0 truncate font-medium">{row.clinicName}</span>
            <span
              className={cn(
                "text-[11px]",
                row.isSelected ? "text-neutral-200" : "text-current/75",
              )}
            >
              {row.queueLabel ?? row.distanceLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
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

      <FieldRouteMap rows={rows} onSelectClinic={props.onSelectClinic} />

      <div className="mt-4 space-y-2" data-testid="field-itinerary-list">
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
