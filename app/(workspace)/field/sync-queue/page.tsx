import { connection } from "next/server";

import { getSessionCookieHeader } from "@/lib/auth/session";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import { loadOperationalSyncSummary } from "@/lib/demo/server-hydration";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value);
}

function formatWindow(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sync evidence window unavailable";
  }

  return `Evidence window opened ${new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)}`;
}

function formatMedianAge(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Median current-status age unavailable";
  }

  if (value < 1) {
    return "Median current-status age under 1 hour";
  }

  return `Median current-status age ${Math.round(value)} hours`;
}

function buildSyncQueueMetrics(summary: SyncSummaryApiResponse) {
  const failedCount = summary.conflictsNeedingAttention + summary.validationFailures;

  return [
    {
      label: "Queued",
      value: summary.pendingOfflineReports,
      detail: "Offline reports still awaiting server review.",
    },
    {
      label: "Synced",
      value: summary.offlineReportsReceived,
      detail: "Offline reports accepted by the server in this evidence window.",
    },
    {
      label: "Failed",
      value: failedCount,
      detail: "Rejected payloads and conflicts that need operator action.",
    },
    {
      label: "Duplicates",
      value: summary.duplicateSyncsHandled,
      detail: "Repeat client submissions safely de-duplicated by the API.",
    },
    {
      label: "Conflicts",
      value: summary.conflictsNeedingAttention,
      detail: "Reports that need review before they can affect clinic status.",
    },
    {
      label: "Validation failures",
      value: summary.validationFailures,
      detail: "Rejected payloads that did not satisfy server validation.",
    },
    {
      label: "Needs confirmation",
      value: summary.needsConfirmationClinics,
      detail: "Clinics where current status requires human confirmation.",
    },
    {
      label: "Stale",
      value: summary.staleClinics,
      detail: "Clinics with current status too old for pilot confidence.",
    },
  ];
}

export default async function Page() {
  await connection();
  await requireDashboardWorkflowAccess("field");
  const cookieHeader = await getSessionCookieHeader();
  const syncSummary = await loadOperationalSyncSummary({
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  });
  const metrics = buildSyncQueueMetrics(syncSummary);

  return (
    <div className="space-y-5" data-field-module="sync-queue">
      <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Field workflow
        </p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Sync queue
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Server-authoritative sync state from the ClinicPulse API. These counts reflect
              submitted offline reports and clinic freshness evidence, not browser-only drafts
              still sitting on this device.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Last sync evidence</p>
            <p className="text-muted-foreground">{formatWindow(syncSummary.windowStartedAt)}</p>
            <p className="text-muted-foreground">
              {formatMedianAge(syncSummary.medianCurrentStatusAgeHours)}
            </p>
          </div>
        </div>
      </header>

      <section
        aria-label="Server-authoritative sync queue counts"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <article
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            key={metric.label}
          >
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {formatCount(metric.value)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
