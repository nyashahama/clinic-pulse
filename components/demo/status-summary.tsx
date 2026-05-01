import { AlertTriangle, DatabaseZap, RefreshCw } from "lucide-react";

import { MetricTile } from "@/components/demo/metric-tile";
import type { ClinicStatus } from "@/lib/demo/types";

type StatusSummaryProps = {
  counts: Record<ClinicStatus, number>;
  activeAlertCount: number;
  offlineQueueCount: number;
  lastSyncAt: string | null;
};

function formatSync(value: string | null) {
  if (!value) {
    return "Seeded";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StatusSummary({
  counts,
  activeAlertCount,
  offlineQueueCount,
  lastSyncAt,
}: StatusSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        label="Operational"
        count={counts.operational}
        description="Clinics available for routine routing and same-day referrals."
        trend={{
          value: `${activeAlertCount} alerts`,
          direction: activeAlertCount > 0 ? "flat" : "up",
          context: "Open operational exceptions across the district.",
        }}
      />
      <MetricTile
        label="Degraded"
        count={counts.degraded}
        description="Sites operating with constrained service lines or staffing pressure."
        trend={{
          value: `${offlineQueueCount} queued`,
          direction: offlineQueueCount > 0 ? "down" : "flat",
          context: "Offline reports waiting to refresh district signal.",
        }}
      />
      <MetricTile
        label="Non-functional"
        count={counts.non_functional}
        description="Facilities currently unavailable for normal patient routing."
        trend={{
          value: "Escalate",
          direction: counts.non_functional > 0 ? "down" : "flat",
          context: "Route patients away and confirm fallback coverage.",
        }}
      />
      <section className="grid min-h-32 min-w-0 gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
              Unknown
            </p>
            <p className="max-w-[28ch] text-sm leading-5 text-content-default">
              Sites that need confirmation before public routing decisions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-content-subtle">
            <AlertTriangle className="size-4" />
            <DatabaseZap className="size-4" />
          </div>
        </header>

        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="min-w-[7ch] tabular-nums text-4xl font-semibold leading-none text-content-emphasis sm:text-[2.5rem]">
            {counts.unknown}
          </p>
          <div className="space-y-1 text-right text-xs text-content-subtle">
            <p className="inline-flex items-center gap-1">
              <RefreshCw className="size-3.5" />
              Last sync {formatSync(lastSyncAt)}
            </p>
            <p>{activeAlertCount} active alerts in district view</p>
          </div>
        </div>
      </section>
    </div>
  );
}
