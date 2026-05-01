import { CalendarClock, HardDrive, User2, Users, type LucideIcon } from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import type { ClinicCurrentState } from "@/lib/demo/types";
import { ServiceList } from "@/components/demo/service-list";

type ClinicOperationalGridProps = {
  clinic: ClinicCurrentState & { services: string[]; operatingHours: string; lastReportedAt: string };
};

type PressureMetric = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function buildPressureMetrics(clinic: ClinicOperationalGridProps["clinic"]): PressureMetric[] {
  return [
    { label: "Staff pressure", value: clinic.staffPressure.replaceAll("_", " "), icon: Users },
    { label: "Stock pressure", value: clinic.stockPressure.replaceAll("_", " "), icon: HardDrive },
    { label: "Queue pressure", value: clinic.queuePressure.replaceAll("_", " "), icon: CalendarClock },
    { label: "Report source", value: clinic.source.replaceAll("_", " "), icon: User2 },
  ];
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ClinicOperationalGrid({ clinic }: ClinicOperationalGridProps) {
  const pressureMetrics = buildPressureMetrics(clinic);

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Operational state"
        title="Clinic operations"
        description="Live operating pressure, service list, and current reason from the most recent report."
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pressureMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-lg border border-border-subtle bg-bg-subtle p-3"
            >
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                <Icon className="size-4 text-content-subtle" />
                {metric.label}
              </p>
              <p className="mt-2 text-sm font-semibold capitalize text-content-emphasis">
                {metric.value}
              </p>
            </div>
          );
        })}

        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            Freshness
          </p>
          <div className="mt-2">
            <FreshnessBadge freshness={clinic.freshness} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            Latest reason
          </p>
          <p className="mt-2 text-sm leading-6 text-content-default">{clinic.reason}</p>
          <p className="mt-3 text-xs text-content-subtle">
            Last updated: {formatTimestamp(clinic.lastReportedAt)}
          </p>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            Operating hours
          </p>
          <p className="mt-2 text-sm text-content-default">{clinic.operatingHours}</p>

          <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            Services
          </p>
          <div className="mt-2">
            <ServiceList services={clinic.services} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
