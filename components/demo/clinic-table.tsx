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
}: ClinicTableProps) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="px-4 pt-4">
        <SectionHeader
          eyebrow="Clinic operations"
          title="Clinic table"
          description="Dense district work surface with the latest routing signal, reporter source, and recommended next action for each clinic."
        />
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        <table className="min-w-[82rem] border-separate border-spacing-0 text-sm">
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
            {clinics.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="border-b border-border-subtle px-3 py-6 text-center text-sm text-content-subtle"
                >
                  No clinics match this filter.
                </td>
              </tr>
            ) : (
              clinics.map((clinic) => (
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
