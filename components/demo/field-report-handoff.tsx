"use client";

import { Clock3, Send, UserRound, WifiOff } from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import type { ReportStreamItem } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type FieldReportHandoffProps = {
  reports: ReportStreamItem[];
  selectedClinicId: string | null;
  onSelectClinic: (clinicId: string) => void;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSource(value: ReportStreamItem["source"]) {
  return value.replaceAll("_", " ");
}

function formatPressure(value: string) {
  return value.replaceAll("_", " ");
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getNextStep(report: ReportStreamItem) {
  if (report.offlineCreated) {
    return "Confirm the offline sync reached district review.";
  }

  if (report.status === "non_functional" || report.status === "degraded") {
    return "Keep the stop visible until district review resolves the operating state.";
  }

  return "Use this report as the latest context before submitting another update.";
}

export function FieldReportHandoff({
  reports,
  selectedClinicId,
  onSelectClinic,
}: FieldReportHandoffProps) {
  const offlineSyncCount = reports.filter((report) => report.offlineCreated).length;
  const latestReport = reports[0] ?? null;
  const selectedReport =
    reports.find((report) => report.clinicId === selectedClinicId) ?? latestReport;

  return (
    <section
      id="recent-reports"
      className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
      data-testid="field-report-handoff"
    >
      <SectionHeader
        eyebrow="Review handoff"
        title="Recent reports"
        description="Use recent submissions to return to the right clinic, confirm what changed, and see which handoffs came from an offline sync."
      />

      <dl className="-mx-4 mt-4 grid border-y border-border-subtle bg-bg-subtle sm:grid-cols-4">
        <div className="border-b border-border-subtle px-4 py-3 sm:border-b-0 sm:border-r">
          <dt className="text-xs font-medium uppercase tracking-normal text-content-subtle">
            Ledger
          </dt>
          <dd className="mt-1 text-lg font-semibold text-content-emphasis">
            {formatCount(reports.length, "recent", "recent")}
          </dd>
        </div>
        <div className="border-b border-border-subtle px-4 py-3 sm:border-b-0 sm:border-r">
          <dt className="text-xs font-medium uppercase tracking-normal text-content-subtle">
            Offline
          </dt>
          <dd className="mt-1 text-lg font-semibold text-content-emphasis">
            {formatCount(offlineSyncCount, "offline sync", "offline syncs")}
          </dd>
        </div>
        <div className="border-b border-border-subtle px-4 py-3 sm:border-b-0 sm:border-r">
          <dt className="text-xs font-medium uppercase tracking-normal text-content-subtle">
            Latest
          </dt>
          <dd className="mt-1 text-lg font-semibold text-content-emphasis">
            {latestReport ? formatTimestamp(latestReport.receivedAt) : "None"}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-normal text-content-subtle">
            Active context
          </dt>
          <dd className="mt-1 text-lg font-semibold leading-tight text-content-emphasis">
            {selectedReport?.clinicName ?? "No report selected"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-2">
        {reports.length > 0 ? (
          reports.map((report) => {
            const isSelected = report.clinicId === selectedClinicId;

            return (
              <button
                aria-label={`Open report handoff for ${report.clinicName}`}
                className={cn(
                  "grid gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:grid-cols-[1fr_auto]",
                  isSelected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-border-subtle bg-bg-subtle hover:border-neutral-900/40 hover:bg-bg-muted",
                )}
                key={report.id}
                onClick={() => onSelectClinic(report.clinicId)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{report.clinicName}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 font-mono text-[11px]",
                        isSelected ? "bg-white/15 text-white" : "bg-bg-default text-content-subtle",
                      )}
                    >
                      {report.facilityCode}
                    </span>
                    {report.offlineCreated ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                          isSelected
                            ? "bg-amber-300 text-amber-950"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        <WifiOff className="size-3.5" aria-hidden="true" />
                        Offline sync
                      </span>
                    ) : null}
                  </span>

                  <span
                    className={cn(
                      "mt-2 flex flex-wrap items-center gap-2 text-xs",
                      isSelected ? "text-neutral-200" : "text-content-subtle",
                    )}
                  >
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Send className="size-3.5" aria-hidden="true" />
                      {formatSource(report.source)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      {formatTimestamp(report.receivedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="size-3.5" aria-hidden="true" />
                      {report.reporterName}
                    </span>
                  </span>

                  <span className="mt-3 block leading-6">{report.reason}</span>
                  <span
                    className={cn(
                      "mt-2 block text-xs leading-5",
                      isSelected ? "text-neutral-200" : "text-content-subtle",
                    )}
                  >
                    Next step: {getNextStep(report)}
                  </span>
                </span>

                <span className="flex flex-wrap items-start gap-2 md:justify-end">
                  <StatusBadge status={report.status} />
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs capitalize",
                      isSelected
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-border-subtle bg-bg-default text-content-subtle",
                    )}
                  >
                    Staff {formatPressure(report.staffPressure)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs capitalize",
                      isSelected
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-border-subtle bg-bg-default text-content-subtle",
                    )}
                  >
                    Stock {formatPressure(report.stockPressure)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs capitalize",
                      isSelected
                        ? "border-white/20 bg-white/15 text-white"
                        : "border-border-subtle bg-bg-default text-content-subtle",
                    )}
                  >
                    Queue {formatPressure(report.queuePressure)}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <p className="rounded-lg border border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
            No synced reports yet.
          </p>
        )}
      </div>
    </section>
  );
}
