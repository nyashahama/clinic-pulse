"use client";

import { ArrowUpRight, WifiOff } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/workspace/empty-state";
import { SectionHeader } from "@/components/workspace/section-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import type { ReportStreamItem } from "@/lib/workspace/types";
import { cn } from "@/lib/utils";

type ReportStreamProps = {
  reports: ReportStreamItem[];
  selectedClinicId: string | null;
  consequenceByReportId: Record<string, string>;
  statusChangeByReportId: Record<string, string>;
  onSelectClinic: (clinicId: string) => void;
  getReportDetailHref?: (report: ReportStreamItem) => string;
  limit?: number;
  compact?: boolean;
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

export function ReportStream({
  reports,
  selectedClinicId,
  consequenceByReportId,
  statusChangeByReportId,
  onSelectClinic,
  getReportDetailHref,
  limit,
  compact = false,
}: ReportStreamProps) {
  const visibleReports = reports.slice(0, limit ?? 8);

  return (
    <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="px-4 pt-4">
        <SectionHeader
          eyebrow="Incoming signal"
          title="Report stream"
          description="Every item shows the source, offline delivery flag, status change, and the audit consequence reflected in the console."
        />
      </div>

      <div className="grid gap-3 px-4 pb-4">
        {reports.length === 0 ? (
          <EmptyState surface="report-stream" className="min-h-44" />
        ) : (
          visibleReports.map((report) => {
            const cardClassName = cn(
              "rounded-lg border border-border-subtle p-3 text-left transition-colors hover:bg-bg-subtle",
              report.clinicId === selectedClinicId ? "bg-teal-50/60" : "bg-bg-default",
            );
            const cardContent: ReactNode = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-content-emphasis">
                        {report.clinicName}
                      </p>
                      <span className="rounded-full bg-bg-subtle px-2 py-1 font-mono text-[11px] text-content-subtle">
                        {report.facilityCode}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-content-subtle">
                      <span className="capitalize">{formatSource(report.source)}</span>
                      <span>{formatTimestamp(report.receivedAt)}</span>
                      {report.offlineCreated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                          <WifiOff className="size-3.5" />
                          Offline sync
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-content-subtle">
                    Open report detail
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={report.status} />
                </div>

                {compact ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-content-default">
                    {report.reason}
                  </p>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-6 text-content-default">
                      <span className="font-medium text-content-default">Status change:</span>{" "}
                      {statusChangeByReportId[report.id]}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-content-default">{report.reason}</p>
                    <p className="mt-3 text-xs leading-5 text-content-subtle">
                      <span className="font-medium text-content-default">Audit consequence:</span>{" "}
                      {consequenceByReportId[report.id]}
                    </p>
                  </>
                )}
              </>
            );
            const reportDetailHref = getReportDetailHref?.(report);

            if (reportDetailHref) {
              return (
                <Link
                  key={report.id}
                  href={reportDetailHref}
                  className={cardClassName}
                  aria-label={`Open report detail for ${report.clinicName}`}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <button
                key={report.id}
                type="button"
                onClick={() => onSelectClinic(report.clinicId)}
                className={cardClassName}
              >
                {cardContent}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
