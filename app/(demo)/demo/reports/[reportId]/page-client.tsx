"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";

import {
  AdminDetailActionPanel,
  AdminDetailEvidenceList,
  AdminDetailHero,
  AdminDetailShell,
  AdminDetailSignalBar,
  AdminDetailTimeline,
  getAdminDetailPressureTone,
} from "@/components/product/admin-detail";
import { StatusBadge } from "@/components/demo/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  getClinicAuditEvents,
  getClinicRows,
  getRecentReportStream,
} from "@/lib/demo/selectors";

type ReportDetailPageClientProps = {
  consoleHref?: "/demo" | "/district";
};

function getRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

export default function ReportDetailPageClient({
  consoleHref = "/demo",
}: ReportDetailPageClientProps) {
  const { state } = useDemoStore();
  const params = useParams<{ reportId?: string | string[] }>();
  const reportId = getRouteParam(params.reportId);
  const reports = useMemo(() => getRecentReportStream(state), [state]);
  const report = useMemo(
    () => reports.find((item) => item.id === reportId) ?? null,
    [reportId, reports],
  );
  const clinicRows = useMemo(() => getClinicRows(state), [state]);
  const clinic = useMemo(
    () => (report ? clinicRows.find((item) => item.id === report.clinicId) ?? null : null),
    [clinicRows, report],
  );
  const auditEvents = useMemo(
    () => (report ? getClinicAuditEvents(state, report.clinicId) : []),
    [report, state],
  );
  const returnHref = `${consoleHref}#clinic-evidence`;
  const returnLabel =
    consoleHref === "/district" ? "Back to district console" : "Back to demo console";

  if (!report) {
    return (
      <AdminDetailShell
        eyebrow="Incoming signal"
        title="Report detail"
        description="The requested report could not be matched to the current stream."
        returnHref={returnHref}
        returnLabel={returnLabel}
      >
        <section
          role="alert"
          data-admin-module
          className="rounded-lg border border-border-subtle bg-bg-default p-4 text-sm text-content-subtle shadow-sm"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="font-medium text-content-emphasis">Report not found</p>
              <p className="mt-1 max-w-xl">
                Report id {reportId ? `"${reportId}"` : "was not provided"} is not present in
                the current demo evidence stream.
              </p>
            </div>
          </div>
        </section>
      </AdminDetailShell>
    );
  }

  const clinicDetailHref = `${consoleHref}/clinics/${encodeURIComponent(
    report.clinicId,
  )}?from=report-detail`;
  const auditConsequence =
    auditEvents[0]?.summary ?? "No linked audit consequence has been recorded yet.";

  return (
    <AdminDetailShell
      eyebrow="Incoming signal"
      title="Report detail"
      description={report.reason}
      returnHref={returnHref}
      returnLabel={returnLabel}
      hideHeader
    >
      <AdminDetailHero
        eyebrow="Incoming signal"
        title="Report detail"
        description={report.reason}
        status={<StatusBadge status={report.status} />}
        actions={
          <>
            <Link
              className={buttonVariants({ size: "sm" })}
              href={clinicDetailHref}
            >
              Open clinic detail
            </Link>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={returnHref}
            >
              Report stream
            </Link>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{report.clinicName}</span>
          <span>{report.facilityCode}</span>
          <span>{clinic?.district ?? "Unknown district"}</span>
        </div>
      </AdminDetailHero>
      <AdminDetailSignalBar
        signals={[
          {
            label: "Current status",
            value: formatLabel(report.status),
            detail: report.offlineCreated
              ? "Synced after offline capture"
              : formatLabel(report.source),
            tone: report.status === "operational" ? "clear" : "attention",
          },
          {
            label: "Queue pressure",
            value: formatLabel(report.queuePressure),
            detail: "Patient routing impact",
            tone: getAdminDetailPressureTone(report.queuePressure, "queue"),
          },
          {
            label: "Staff pressure",
            value: formatLabel(report.staffPressure),
            detail: "Operational capacity",
            tone: getAdminDetailPressureTone(report.staffPressure, "staff"),
          },
          {
            label: "Received",
            value: formatDateTime(report.receivedAt),
            detail: `Report ${report.id}`,
            tone: "info",
          },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid min-w-0 gap-4">
          <AdminDetailEvidenceList
            title="Evidence properties"
            description="Operational facts captured with this incoming field signal."
            items={[
              {
                label: "Clinic",
                value: (
                  <Link
                    className="underline-offset-4 hover:underline"
                    href={clinicDetailHref}
                  >
                    {report.clinicName}
                  </Link>
                ),
              },
              {
                label: "Facility",
                value: report.facilityCode,
              },
              {
                label: "District",
                value: clinic?.district ?? "Unknown district",
              },
              {
                label: "Report ID",
                value: report.id,
              },
              {
                label: "Status",
                value: <StatusBadge status={report.status} />,
              },
              {
                label: "Source",
                value: report.offlineCreated
                  ? `${formatLabel(report.source)} / synced offline`
                  : formatLabel(report.source),
              },
              {
                label: "Reporter",
                value: report.reporterName,
              },
              {
                label: "Submitted",
                value: formatDateTime(report.submittedAt),
              },
              {
                label: "Received",
                value: formatDateTime(report.receivedAt),
              },
              {
                label: "Offline created",
                value: formatBoolean(report.offlineCreated),
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
                label: "Reason",
                value: report.reason,
                emphasis: true,
              },
              {
                label: "Notes",
                value: report.notes || "No notes supplied.",
                emphasis: Boolean(report.notes),
              },
              {
                label: "Audit consequence",
                value: auditConsequence,
                emphasis: Boolean(auditEvents[0]?.summary),
              },
            ]}
          />
        </div>
        <div className="grid min-w-0 gap-4 content-start">
          <AdminDetailActionPanel
            title="Operational next action"
            description="Open the clinic context or return to the stream with the report evidence preserved in the URL."
          >
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={clinicDetailHref}
            >
              Review clinic context
            </Link>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={returnHref}
            >
              Return to report stream
            </Link>
          </AdminDetailActionPanel>
          <AdminDetailTimeline
            title="Evidence timeline"
            description="How this signal moved from field capture into the command view."
            items={[
              {
                label: "Submitted",
                title: "Report submitted",
                description: `${report.reporterName} submitted the field signal.`,
                timestamp: formatDateTime(report.submittedAt),
                tone: "info",
              },
              {
                label: "Received",
                title: report.offlineCreated ? "Offline report synced" : "Report received",
                description: report.offlineCreated
                  ? "The report was created offline and synced once connectivity returned."
                  : "The report entered the live stream without offline delay.",
                timestamp: formatDateTime(report.receivedAt),
                tone: report.offlineCreated ? "attention" : "clear",
              },
              {
                label: "Current consequence",
                title: "Command evidence updated",
                description: auditConsequence,
                tone: "attention",
              },
            ]}
          />
        </div>
      </div>
    </AdminDetailShell>
  );
}
