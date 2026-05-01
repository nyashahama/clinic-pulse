import Image from "next/image";
import { AlertTriangle, ArrowRight, ClipboardList, Route } from "lucide-react";

import { EmptyState } from "@/components/demo/empty-state";
import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { SeverityBadge } from "@/components/demo/severity-badge";
import { StatusBadge } from "@/components/demo/status-badge";
import type { Alert, ClinicRow, ReportEvent } from "@/lib/demo/types";

type ClinicSidePanelProps = {
  clinic: ClinicRow | null;
  latestReport: ReportEvent | null;
  alerts: Alert[];
  alternatives: ClinicRow[];
  rerouteActive: boolean;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ClinicSidePanel({
  clinic,
  latestReport,
  alerts,
  alternatives,
  rerouteActive,
}: ClinicSidePanelProps) {
  if (!clinic) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <EmptyState surface="clinic-table" className="min-h-72" />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="border-b border-border-subtle px-4 pt-4">
        <SectionHeader
          eyebrow="Selected clinic"
          title={clinic.name}
          description={`${clinic.facilityCode} • ${clinic.operatingHours}`}
        />
      </div>

      <div className="grid gap-4 p-4">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border-subtle bg-bg-subtle">
          <Image
            src={clinic.image.src}
            alt={clinic.image.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 28rem, 100vw"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={clinic.status} />
          <FreshnessBadge freshness={clinic.freshness} />
          {rerouteActive ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
              <Route className="size-3.5" />
              Reroute recommended
            </span>
          ) : null}
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            Current reason
          </p>
          <p className="mt-2 text-sm leading-6 text-content-default">{clinic.reason}</p>
        </div>

        {latestReport ? (
          <div className="rounded-lg border border-border-subtle p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-content-emphasis">
              <ClipboardList className="size-4 text-primary" />
              Latest report
            </div>
            <div className="mt-2 grid gap-1 text-sm text-content-default">
              <p>{latestReport.reporterName}</p>
              <p className="capitalize text-content-subtle">
                {latestReport.source.replaceAll("_", " ")}
              </p>
              <p className="font-mono text-xs text-content-subtle">
                {formatTimestamp(latestReport.receivedAt)}
              </p>
              <p className="mt-2 leading-6">{latestReport.notes}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-content-emphasis">
            <AlertTriangle className="size-4 text-amber-600" />
            Active alerts
          </div>
          {alerts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle px-3 py-4 text-sm text-content-subtle">
              No active alerts on this clinic right now.
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-border-subtle p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm capitalize text-content-default">
                    {alert.type.replaceAll("_", " ")}
                  </p>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="mt-2 text-sm leading-6 text-content-default">
                  {alert.recommendedAction}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-content-emphasis">
            <Route className="size-4 text-primary" />
            Alternatives
          </div>
          {alternatives.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle px-3 py-4 text-sm text-content-subtle">
              No alternative clinics are currently recommended for the selected service.
            </div>
          ) : (
            alternatives.map((alternative) => (
              <div
                key={alternative.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border-subtle p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content-emphasis">
                    {alternative.name}
                  </p>
                  <p className="mt-1 text-xs text-content-subtle">
                    {alternative.services[0]} available • {alternative.operatingHours}
                  </p>
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-content-subtle" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
