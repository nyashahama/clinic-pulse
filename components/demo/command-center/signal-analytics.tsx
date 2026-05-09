import type { DistrictCommandCenter, DistrictSeverityReasonCode } from "@/lib/demo/district-command-center";

import { CommandCard } from "./command-card";

type SignalAnalyticsProps = {
  analytics: DistrictCommandCenter["analytics"];
};

const REASON_LABELS: Record<DistrictSeverityReasonCode, string> = {
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

export function SignalAnalytics({ analytics }: SignalAnalyticsProps) {
  const rankedCount = Object.values(analytics.statusMix).reduce((total, count) => total + count, 0);

  return (
    <CommandCard
      eyebrow="Signal analytics"
      title="Why this queue is ranked this way"
      description="Compact signal context for the command queue, focused on the factors changing priority order."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Critical" value={analytics.statusMix.critical} detail="Clinics requiring immediate command action" />
        <MetricCard label="Watch" value={analytics.statusMix.watch} detail="Clinics with risk signals under observation" />
        <MetricCard label="Freshness" value={analytics.freshnessRiskCount} detail="Clinics with stale, unknown, or unconfirmed reports" />
        <MetricCard label="Offline" value={analytics.offlineQueueCount} detail="Reports waiting for offline queue reconciliation" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top severity drivers</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {rankedCount} clinics ranked with {analytics.activeAlertCount} active alert signal{analytics.activeAlertCount === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {analytics.topReasonCodes.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">No severity drivers are currently affecting the queue.</p>
        ) : (
          <ol className="mt-3 grid gap-2">
            {analytics.topReasonCodes.map((reason, index) => (
              <li key={reason.code} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">
                  <span aria-hidden="true">{index + 1}. </span>
                  {REASON_LABELS[reason.code]}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {reason.count}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </CommandCard>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
};

function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}
