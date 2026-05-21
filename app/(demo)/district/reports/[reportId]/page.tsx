import { notFound } from "next/navigation";

import {
  AdminDetailFieldGrid,
  AdminDetailJsonBlock,
  AdminDetailShell,
} from "@/components/product/admin-detail";
import type { AdminTone } from "@/components/product/admin-module";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getRecentReportStream } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";
import { requireDashboardWorkflowAccess } from "../../../workflow-guard";

type DistrictReportEvidencePageProps = {
  params: Promise<{
    reportId: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusTone: Record<string, AdminTone> = {
  operational: "clear",
  degraded: "attention",
  non_functional: "blocked",
  unknown: "attention",
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return dateTimeFormatter.format(date);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function sourceLabel(source: string) {
  return source.replaceAll("_", " ");
}

function returnTarget(from?: string) {
  if (from === "district-severity-queue") {
    return {
      href: "/district/severity-queue",
      label: "Back to severity queue",
    };
  }

  return {
    href: "/district",
    label: "Back to district overview",
  };
}

function EvidenceBadge({
  children,
  tone = "info",
}: {
  children: string;
  tone?: AdminTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        tone === "clear" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
        tone === "attention" &&
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
        tone === "blocked" &&
          "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
        tone === "info" &&
          "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
      )}
    >
      {children}
    </span>
  );
}

export default async function DistrictReportEvidencePage({
  params,
  searchParams,
}: DistrictReportEvidencePageProps) {
  await requireDashboardWorkflowAccess("district");

  const [{ reportId }, query] = await Promise.all([params, searchParams]);
  const decodedReportId = decodeURIComponent(reportId);
  const state = createInitialDemoState();
  const report = getRecentReportStream(state).find((item) => item.id === decodedReportId);

  if (!report) {
    notFound();
  }

  const target = returnTarget(query.from);
  const payload = {
    id: report.id,
    clinicId: report.clinicId,
    facilityCode: report.facilityCode,
    reporterName: report.reporterName,
    source: report.source,
    offlineCreated: report.offlineCreated,
    submittedAt: report.submittedAt,
    receivedAt: report.receivedAt,
    status: report.status,
    reason: report.reason,
    pressure: {
      staff: report.staffPressure,
      stock: report.stockPressure,
      queue: report.queuePressure,
    },
    notes: report.notes,
  };

  return (
    <AdminDetailShell
      eyebrow="District evidence"
      title="Report evidence"
      description={report.reason}
      returnHref={target.href}
      returnLabel={target.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Clinic",
            value: report.clinicName,
          },
          {
            label: "Facility code",
            value: report.facilityCode,
          },
          {
            label: "Reporter",
            value: report.reporterName,
          },
          {
            label: "Source",
            value: sourceLabel(report.source),
          },
          {
            label: "Status",
            value: (
              <EvidenceBadge tone={statusTone[report.status] ?? "info"}>
                {formatLabel(report.status)}
              </EvidenceBadge>
            ),
          },
          {
            label: "Offline created",
            value: report.offlineCreated ? "Yes" : "No",
          },
          {
            label: "Received",
            value: formatDateTime(report.receivedAt),
          },
          {
            label: "Submitted",
            value: formatDateTime(report.submittedAt),
          },
          {
            label: "Staff pressure",
            value: formatLabel(report.staffPressure),
          },
          {
            label: "Stock pressure",
            value: formatLabel(report.stockPressure),
          },
          {
            label: "Queue pressure",
            value: formatLabel(report.queuePressure),
          },
          {
            label: "Report notes",
            value: report.notes,
            className: "sm:col-span-2 xl:col-span-3",
          },
        ]}
      />
      <AdminDetailJsonBlock title="Evidence payload" value={payload} />
    </AdminDetailShell>
  );
}
