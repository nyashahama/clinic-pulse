"use client";

import { ArrowUpRight } from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SectionHeader } from "@/components/demo/section-header";
import { StatusBadge } from "@/components/demo/status-badge";
import { Button } from "@/components/ui/button";
import type { ClinicRow } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type ClinicTableProps = {
  clinics: ClinicRow[];
  selectedClinicId: string | null;
  recommendedActionByClinicId: Record<string, string>;
  onSelectClinic: (clinicId: string) => void;
  limit?: number;
  title?: string;
  description?: string;
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

function formatPressure(value: string) {
  return value.replaceAll("_", " ");
}

function formatSource(value: ClinicRow["source"]) {
  return value.replaceAll("_", " ");
}

export function ClinicTable({
  clinics,
  selectedClinicId,
  recommendedActionByClinicId,
  onSelectClinic,
  limit,
  title = "Clinic table",
  description = "Dense district work surface with the latest routing signal, reporter source, and recommended next action for each clinic.",
  compact = false,
}: ClinicTableProps) {
  const visibleClinics = clinics.slice(0, limit ?? clinics.length);

  if (compact) {
    return (
      <section className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
        <div className="px-4 pt-4">
          <SectionHeader
            eyebrow="Clinic operations"
            title={title}
            description={description}
          />
        </div>

        <div className="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleClinics.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle px-4 py-6 text-center text-sm text-content-subtle md:col-span-2 xl:col-span-4">
              No clinics match this filter.
            </div>
          ) : (
            visibleClinics.map((clinic) => (
              <article
                key={clinic.id}
                className={cn(
                  "grid min-w-0 gap-3 rounded-lg border p-3 transition-colors",
                  clinic.id === selectedClinicId
                    ? "border-teal-300 bg-teal-50/70"
                    : "border-border-subtle bg-bg-subtle",
                )}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-content-emphasis">
                    {clinic.name}
                  </h3>
                  <p className="mt-1 text-xs text-content-subtle">{clinic.facilityCode}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={clinic.status} />
                  <FreshnessBadge freshness={clinic.freshness} />
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-content-default">
                  {recommendedActionByClinicId[clinic.id]}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onSelectClinic(clinic.id)}
                >
                  Open
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </article>
            ))
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="px-4 pt-4">
        <SectionHeader
          eyebrow="Clinic operations"
          title={title}
          description={description}
        />
      </div>

      <div className="grid gap-3 px-4 pb-4 md:hidden" aria-label="Clinic mobile work queue">
        {visibleClinics.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-subtle px-4 py-6 text-center text-sm text-content-subtle">
            No clinics match this filter.
          </div>
        ) : (
          visibleClinics.map((clinic) => (
            <article
              key={clinic.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                clinic.id === selectedClinicId
                  ? "border-teal-300 bg-teal-50/70"
                  : "border-border-subtle bg-bg-subtle",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectClinic(clinic.id)}
                  className="min-w-0 text-left"
                >
                  <h3 className="font-medium text-content-emphasis">{clinic.name}</h3>
                  <p className="mt-1 text-xs text-content-subtle">
                    {clinic.facilityCode} · {clinic.district}
                  </p>
                </button>
                <div className="grid shrink-0 gap-1.5 justify-items-end">
                  <StatusBadge status={clinic.status} />
                  <FreshnessBadge freshness={clinic.freshness} />
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-content-default">{clinic.reason}</p>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-content-subtle">Last report</dt>
                  <dd className="mt-1 font-mono text-content-default">
                    {formatTimestamp(clinic.lastReportedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Reporter/source</dt>
                  <dd className="mt-1 text-content-default">
                    {clinic.reporterName} · {formatSource(clinic.source)}
                  </dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Staff</dt>
                  <dd className="mt-1 capitalize text-content-default">
                    {formatPressure(clinic.staffPressure)}
                  </dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Stock</dt>
                  <dd className="mt-1 capitalize text-content-default">
                    {formatPressure(clinic.stockPressure)}
                  </dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Queue</dt>
                  <dd className="mt-1 capitalize text-content-default">
                    {formatPressure(clinic.queuePressure)}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 rounded-md border border-border-subtle bg-bg-default p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                  Recommended action
                </p>
                <p className="mt-1 text-sm leading-6 text-content-default">
                  {recommendedActionByClinicId[clinic.id]}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => onSelectClinic(clinic.id)}
                >
                  Open
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden min-w-0 overflow-x-auto px-4 pb-4 md:block">
        <table className="min-w-full border-separate border-spacing-0 text-sm 2xl:min-w-[82rem]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-content-subtle">
              {[
                "Clinic",
                "District",
                "Status",
                "Freshness",
                "Reason",
                "Last report",
                "Reporter/source",
                "Staff",
                "Stock",
                "Queue",
                "Recommended action",
              ].map((heading) => (
                <th key={heading} className="border-b border-border-subtle px-3 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleClinics.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="border-b border-border-subtle px-3 py-6 text-center text-sm text-content-subtle"
                >
                  No clinics match this filter.
                </td>
              </tr>
            ) : (
              visibleClinics.map((clinic) => (
                <tr
                  key={clinic.id}
                  className={cn(
                    "align-top transition-colors",
                    clinic.id === selectedClinicId ? "bg-teal-50/60" : "hover:bg-bg-subtle",
                  )}
                >
                  <td className="border-b border-border-subtle px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectClinic(clinic.id)}
                      className="group text-left"
                    >
                      <div className="font-medium text-content-emphasis">{clinic.name}</div>
                      <div className="mt-1 text-xs text-content-subtle">{clinic.facilityCode}</div>
                    </button>
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3 text-content-default">
                    {clinic.district}
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3">
                    <StatusBadge status={clinic.status} />
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3">
                    <FreshnessBadge freshness={clinic.freshness} />
                  </td>
                  <td className="max-w-72 border-b border-border-subtle px-3 py-3 text-content-default">
                    <p className="line-clamp-3 leading-6">{clinic.reason}</p>
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3 font-mono text-xs text-content-default">
                    {formatTimestamp(clinic.lastReportedAt)}
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3">
                    <div className="text-content-emphasis">{clinic.reporterName}</div>
                    <div className="mt-1 text-xs capitalize text-content-subtle">
                      {formatSource(clinic.source)}
                    </div>
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3 capitalize text-content-default">
                    {formatPressure(clinic.staffPressure)}
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3 capitalize text-content-default">
                    {formatPressure(clinic.stockPressure)}
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3 capitalize text-content-default">
                    {formatPressure(clinic.queuePressure)}
                  </td>
                  <td className="border-b border-border-subtle px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="max-w-56 leading-6 text-content-default">
                        {recommendedActionByClinicId[clinic.id]}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectClinic(clinic.id)}
                      >
                        Open
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
