"use client";

import { CalendarClock, ClipboardList, MapPinned, UserRound } from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import type { ClinicRow } from "@/lib/demo/types";

type FieldClinicListProps = {
  clinics: ClinicRow[];
  selectedClinicId: string | null;
  onSelectClinic: (clinicId: string) => void;
};

const WORKER_COORDS: [number, number] = [-25.74, 28.13];

function formatReportAge(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function estimateDistance(lat: number, lng: number) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const [workerLat, workerLng] = WORKER_COORDS;
  const dLat = toRadians(lat - workerLat);
  const dLng = toRadians(lng - workerLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(workerLat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(a));

  return km < 10 ? km.toFixed(1) : Math.round(km).toString();
}

export function FieldClinicList({
  clinics,
  selectedClinicId,
  onSelectClinic,
}: FieldClinicListProps) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Field queue"
        title="Assigned clinics"
        description="Select a clinic to submit an update from your mobile workflow."
      />

      <div className="mt-4 space-y-2">
        {clinics.map((clinic) => {
          const distance = estimateDistance(clinic.latitude, clinic.longitude);

          return (
            <button
              type="button"
              key={clinic.id}
              onClick={() => onSelectClinic(clinic.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedClinicId === clinic.id
                  ? "border-neutral-900 bg-neutral-900/95 text-white"
                  : "border-border-subtle bg-bg-subtle hover:bg-bg-muted"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {clinic.name}
                  </p>
                  <p className={`mt-1 text-xs ${selectedClinicId === clinic.id ? "text-neutral-200" : "text-content-subtle"}`}>
                    {clinic.facilityCode} • {distance} km away
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <StatusBadge status={clinic.status} />
                    <FreshnessBadge freshness={clinic.freshness} />
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
                    selectedClinicId === clinic.id
                      ? "bg-white/15 text-white"
                      : "bg-white text-content-subtle"
                  }`}
                >
                  <MapPinned className="size-3.5" />
                  {clinic.operatingHours}
                </span>
              </div>

              <div className="mt-3 grid gap-1.5 text-xs">
                <span className={`inline-flex items-center gap-1 ${selectedClinicId === clinic.id ? "text-neutral-200" : "text-content-subtle"}`}>
                  <CalendarClock className="size-3.5" />
                  Last report {formatReportAge(clinic.lastReportedAt)}
                </span>
                <span className={`inline-flex items-center gap-1 ${selectedClinicId === clinic.id ? "text-neutral-200" : "text-content-subtle"}`}>
                  <UserRound className="size-3.5" />
                  {clinic.reporterName}
                </span>
                <span className={`inline-flex items-center gap-1 ${selectedClinicId === clinic.id ? "text-neutral-200" : "text-content-subtle"}`}>
                  <ClipboardList className="size-3.5" />
                  Tap to update this site
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
