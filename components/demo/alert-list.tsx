"use client";

import { BellRing, Clock3 } from "lucide-react";

import { EmptyState } from "@/components/demo/empty-state";
import { SectionHeader } from "@/components/demo/section-header";
import { SeverityBadge } from "@/components/demo/severity-badge";
import type { Alert, ClinicRow } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type AlertListProps = {
  alerts: Alert[];
  clinics: ClinicRow[];
  onSelectClinic: (clinicId: string) => void;
};

function formatAlertType(value: Alert["type"]) {
  return value.replaceAll("_", " ");
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AlertList({ alerts, clinics, onSelectClinic }: AlertListProps) {
  const clinicNameById = Object.fromEntries(clinics.map((clinic) => [clinic.id, clinic.name]));

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="px-4 pt-4">
        <SectionHeader
          eyebrow="Escalations"
          title="Alert queue"
          description="Active incidents are sorted first by severity and then by most recent district signal."
        />
      </div>

      <div className="grid gap-3 px-4 pb-4">
        {alerts.length === 0 ? (
          <EmptyState surface="alert-list" className="min-h-44" />
        ) : (
          alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => onSelectClinic(alert.clinicId)}
              className="rounded-lg border border-border-subtle bg-bg-default p-3 text-left transition-colors hover:bg-bg-subtle"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content-emphasis">
                    {clinicNameById[alert.clinicId] ?? alert.clinicId}
                  </p>
                  <p className="mt-1 capitalize text-xs text-content-subtle">
                    {formatAlertType(alert.type)}
                  </p>
                </div>
                <SeverityBadge severity={alert.severity} />
              </div>

              <p className="mt-3 text-sm leading-6 text-content-default">
                {alert.recommendedAction}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-content-subtle">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1",
                    alert.status === "open"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  <BellRing className="size-3.5" />
                  {alert.status}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3.5" />
                  {formatTimestamp(alert.createdAt)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
