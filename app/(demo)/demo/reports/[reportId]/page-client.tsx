"use client";

import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";

import {
  AdminDetailShell,
} from "@/components/product/admin-detail";
import {
  EvidenceCaseBriefPanel,
  EvidenceCommandChip,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidenceTimeline,
} from "@/components/product/evidence-command";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  getClinicAuditEvents,
  getClinicRows,
  getRecentReportStream,
} from "@/lib/demo/selectors";
import {
  buildReportDecisionCopy,
  formatEvidenceLabel,
  formatEvidenceSource,
  getPressureTone,
  getReportStatusTone,
  type EvidenceCommandAction,
  type EvidenceCommandChip as EvidenceCommandChipModel,
  type EvidenceCommandField,
  type EvidenceCommandMetric,
  type EvidenceCommandSection,
  type EvidenceCommandTimelineItem,
} from "@/lib/product/evidence-command";

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
  const statusTone = getReportStatusTone(report.status);
  const decisionCopy = buildReportDecisionCopy({
    queuePressure: report.queuePressure,
    staffPressure: report.staffPressure,
    status: report.status,
  });
  const actions: EvidenceCommandAction[] = [
    {
      label: "Review clinic context",
      href: clinicDetailHref,
      priority: "primary",
      icon: "clinic",
    },
    {
      label: "Return to report stream",
      href: returnHref,
      priority: "secondary",
      icon: "stream",
    },
  ];
  const headerActions = actions.filter((action) => action.priority === "secondary");
  const chips: EvidenceCommandChipModel[] = [
    {
      label: formatEvidenceLabel(report.status),
      tone: statusTone,
    },
    {
      label: report.offlineCreated ? "offline sync" : formatEvidenceSource(report.source),
      tone: report.offlineCreated ? "attention" : "neutral",
    },
    {
      label: formatEvidenceLabel(report.queuePressure),
      tone: getPressureTone(report.queuePressure, "queue"),
    },
  ];
  const metrics: EvidenceCommandMetric[] = [
    {
      label: "Current status",
      value: formatEvidenceLabel(report.status),
      detail: report.offlineCreated
        ? "Synced after offline capture"
        : formatEvidenceSource(report.source),
      tone: statusTone,
      icon: "alert",
    },
    {
      label: "Queue pressure",
      value: formatEvidenceLabel(report.queuePressure),
      detail: "Patient routing impact",
      tone: getPressureTone(report.queuePressure, "queue"),
      icon: "activity",
    },
    {
      label: "Staff pressure",
      value: formatEvidenceLabel(report.staffPressure),
      detail: "Operational capacity",
      tone: getPressureTone(report.staffPressure, "staff"),
      icon: "activity",
    },
    {
      label: "Received",
      value: formatDateTime(report.receivedAt),
      detail: `Report ${report.id}`,
      tone: "info",
      icon: "clock",
    },
  ];
  const primaryFields: EvidenceCommandField[] = [
    {
      label: "Clinic",
      value: report.clinicName,
      href: clinicDetailHref,
      emphasis: true,
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
  ];
  const evidenceSections: EvidenceCommandSection[] = [
    {
      title: "Operational pressure",
      fields: [
        {
          label: "Queue",
          value: formatEvidenceLabel(report.queuePressure),
          tone: getPressureTone(report.queuePressure, "queue"),
        },
        {
          label: "Staff",
          value: formatEvidenceLabel(report.staffPressure),
          tone: getPressureTone(report.staffPressure, "staff"),
        },
        {
          label: "Stock",
          value: formatEvidenceLabel(report.stockPressure),
          tone: getPressureTone(report.stockPressure, "stock"),
        },
      ],
    },
    {
      title: "Field handling",
      fields: [
        {
          label: "Source",
          value: formatEvidenceSource(report.source, {
            offlineCreated: report.offlineCreated,
          }),
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
      ],
    },
    {
      title: "Audit context",
      fields: [
        {
          label: "Consequence",
          value: auditConsequence,
          emphasis: Boolean(auditEvents[0]?.summary),
          fullWidth: true,
        },
        {
          label: "Notes",
          value: report.notes || "No notes supplied.",
          emphasis: Boolean(report.notes),
          fullWidth: true,
        },
      ],
    },
  ];
  const timeline: EvidenceCommandTimelineItem[] = [
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
      tone: report.offlineCreated ? "attention" : "stable",
    },
    {
      label: "Current consequence",
      title: "Command evidence updated",
      description: auditConsequence,
      tone: "attention",
    },
  ];

  return (
    <AdminDetailShell
      eyebrow="Incoming signal"
      title="Report detail"
      description={report.reason}
      returnHref={returnHref}
      returnLabel={returnLabel}
      hideHeader
    >
      <EvidenceCommandHeader
        eyebrow="Incoming signal"
        title="Report evidence brief"
        description={report.reason}
        actions={headerActions}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{report.clinicName}</span>
          <span>{report.facilityCode}</span>
          <span>{clinic?.district ?? "Unknown district"}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone}`} />
          ))}
        </div>
      </EvidenceCommandHeader>
      <EvidenceCommandMetricStrip metrics={metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid min-w-0 content-start gap-4">
          <EvidenceCaseBriefPanel
            title="Case brief"
            description="Decision-ready evidence from this incoming field signal."
            summary={{
              label: "Signal summary",
              value: report.reason,
              emphasis: true,
            }}
            primaryFields={primaryFields}
            sections={evidenceSections}
          />
        </div>
        <div className="grid min-w-0 gap-4 content-start">
          <EvidenceDecisionPanel
            decision={{
              contextLabel: "Signal response",
              title: decisionCopy.title,
              scoreLabel: "Report",
              scoreValue: report.id,
              chips,
              nextStep: decisionCopy.nextStep,
              nextStepTone: decisionCopy.tone,
              impactTitle: "Patient impact",
              impact: decisionCopy.impact,
              verificationTitle: "Verification",
              verification: decisionCopy.verification,
              evidence: {
                label: report.reason,
                detail: `${report.reporterName} - ${formatDateTime(report.receivedAt)}`,
                tone: statusTone,
              },
              actions,
            }}
          />
          <EvidenceTimeline
            title="Evidence timeline"
            description="How this signal moved from field capture into the command view."
            items={timeline}
          />
        </div>
      </div>
    </AdminDetailShell>
  );
}
