"use client";

import { ArrowRight, MapPinned, Route } from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import type { ClinicRow } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type ClinicMapProps = {
  clinics: ClinicRow[];
  referenceClinics?: ClinicRow[];
  selectedClinicId: string | null;
  rerouteClinicId?: string | null;
  onSelectClinic: (clinicId: string) => void;
};

function getStatusPinClass(status: ClinicRow["status"]) {
  switch (status) {
    case "operational":
      return "border-emerald-300 bg-emerald-500";
    case "degraded":
      return "border-amber-300 bg-amber-500";
    case "non_functional":
      return "border-rose-300 bg-rose-500";
    case "unknown":
    default:
      return "border-slate-300 bg-slate-400";
  }
}

function clampPercent(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getMapPosition(clinics: ClinicRow[]) {
  if (clinics.length === 0) {
    return () => ({ left: "10%", top: "12%" });
  }

  const latitudes = clinics.map((clinic) => clinic.latitude);
  const longitudes = clinics.map((clinic) => clinic.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return (clinic: ClinicRow) => {
    const x = clampPercent(
      ((clinic.longitude - minLng) / Math.max(maxLng - minLng, 0.0001)) * 70 + 10,
      10,
      90,
    );
    const y = clampPercent(
      ((maxLat - clinic.latitude) / Math.max(maxLat - minLat, 0.0001)) * 70 + 12,
      10,
      88,
    );

    return { left: `${x}%`, top: `${y}%` };
  };
}

function getPriorityScore(clinic: ClinicRow) {
  const statusScore =
    clinic.status === "non_functional"
      ? 4
      : clinic.status === "degraded"
        ? 3
        : clinic.status === "unknown"
          ? 2
          : 1;
  const freshnessScore =
    clinic.freshness === "stale"
      ? 3
      : clinic.freshness === "needs_confirmation"
        ? 2
        : clinic.freshness === "unknown"
          ? 1
          : 0;

  return statusScore * 10 + freshnessScore;
}

export function ClinicMap({
  clinics,
  referenceClinics,
  selectedClinicId,
  rerouteClinicId,
  onSelectClinic,
}: ClinicMapProps) {
  const placePin = getMapPosition(referenceClinics ?? clinics);
  const priorityClinics = [...clinics]
    .sort((left, right) => getPriorityScore(right) - getPriorityScore(left))
    .slice(0, 4);

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="px-4 pt-4">
        <SectionHeader
          eyebrow="District overview"
          title="Demo district map"
          description="Live facility signal plotted over a polished mock district surface, with high-risk clinics pinned for quick intervention."
        />
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.7fr)]">
        <div className="relative min-h-[22rem] overflow-hidden rounded-lg border border-border-subtle bg-[linear-gradient(180deg,#f7faf9_0%,#eef6f4_100%)]">
          <div className="absolute inset-0 opacity-80">
            <div className="absolute left-[8%] top-[14%] h-px w-[32%] rotate-[16deg] bg-teal-200/80" />
            <div className="absolute left-[24%] top-[48%] h-px w-[48%] -rotate-[12deg] bg-teal-200/80" />
            <div className="absolute left-[54%] top-[16%] h-[56%] w-px rotate-[12deg] bg-teal-200/80" />
            <div className="absolute left-[14%] top-[70%] h-px w-[54%] rotate-[6deg] bg-sky-200/80" />
            <div className="absolute inset-x-[12%] top-[30%] h-24 rounded-full border border-dashed border-teal-200/80" />
            <div className="absolute left-[58%] top-[52%] h-20 w-28 rounded-full border border-dashed border-sky-200/70" />
          </div>

          <div className="absolute left-[9%] top-[8%] rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-content-default shadow-sm">
            Ga-Rankuwa corridor
          </div>
          <div className="absolute left-[58%] top-[10%] rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-content-default shadow-sm">
            Hammanskraal north
          </div>
          <div className="absolute left-[15%] top-[74%] rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-content-default shadow-sm">
            Atteridgeville west
          </div>
          <div className="absolute left-[55%] top-[68%] rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-content-default shadow-sm">
            Mamelodi east
          </div>

          {clinics.map((clinic) => {
            const isSelected = clinic.id === selectedClinicId;
            const isReroute = clinic.id === rerouteClinicId;

            return (
              <button
                key={clinic.id}
                type="button"
                onClick={() => onSelectClinic(clinic.id)}
                className="group absolute -translate-x-1/2 -translate-y-1/2 text-left"
                style={placePin(clinic)}
              >
                <span
                  className={cn(
                    "absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-md transition-opacity",
                    isSelected || isReroute ? "opacity-100" : "opacity-0",
                    clinic.status === "non_functional"
                      ? "bg-rose-400/40"
                      : clinic.status === "degraded"
                        ? "bg-amber-300/50"
                        : "bg-teal-300/40",
                  )}
                />
                <span
                  className={cn(
                    "relative flex size-4 items-center justify-center rounded-full border-2 shadow-sm transition-transform group-hover:scale-110",
                    getStatusPinClass(clinic.status),
                    isSelected ? "scale-110 ring-4 ring-white" : "",
                    isReroute ? "ring-4 ring-sky-200" : "",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-1/2 top-[calc(100%+0.4rem)] hidden min-w-36 -translate-x-1/2 rounded-md border border-border-subtle bg-white px-2.5 py-2 text-[11px] shadow-lg group-hover:block md:block",
                    isSelected ? "block" : "hidden md:group-hover:block",
                  )}
                >
                  <span className="block font-semibold text-content-emphasis">{clinic.name}</span>
                  <span className="mt-0.5 block text-content-subtle">{clinic.facilityCode}</span>
                </span>
              </button>
            );
          })}

          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md border border-border-subtle bg-white/90 px-3 py-2 text-xs text-content-default shadow-sm">
            <MapPinned className="size-3.5 text-primary" />
            District labels and clinic signal are demo-positioned from fixture coordinates.
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-content-emphasis">
              <Route className="size-4 text-primary" />
              Intervention shortlist
            </div>
            <p className="mt-1 text-xs leading-5 text-content-subtle">
              The district view elevates the clinics most likely to require routing or escalation.
            </p>
          </div>

          {priorityClinics.map((clinic) => (
            <button
              key={clinic.id}
              type="button"
              onClick={() => onSelectClinic(clinic.id)}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                clinic.id === selectedClinicId
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-border-subtle bg-white hover:bg-bg-subtle",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{clinic.name}</p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-5",
                    clinic.id === selectedClinicId ? "text-neutral-300" : "text-content-subtle",
                  )}
                >
                  {clinic.reason}
                </p>
                <div className="mt-2">
                  <StatusBadge status={clinic.status} />
                </div>
              </div>
              <ArrowRight className="mt-0.5 size-4 shrink-0 opacity-70" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
