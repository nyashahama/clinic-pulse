"use client";

import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, FileJson } from "lucide-react";
import { useMemo } from "react";

import { AdminDetailShell } from "@/components/product/admin-detail";
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

const reportStreamCopy = {
  headerEyebrow: "Incoming signal",
  headerTitle: "Report evidence brief",
  caseTitle: "Case brief",
  caseDescription: "Decision-ready evidence from this incoming field signal.",
  summary: {
    label: "Signal summary",
  },
  operationalSection: {
    title: "Operational pressure",
  },
  operationalSectionDescription: undefined,
  fieldHandlingTitle: "Field handling",
  fieldHandlingDescription: undefined,
  contextLabel: "Signal response",
  primaryActionLabel: "Review clinic context",
  returnActionLabel: "Return to report stream",
} as const;

const severityQueueCopy = {
  headerEyebrow: "Evidence brief",
  headerTitle: "Report evidence",
  caseTitle: "What happened",
  caseDescription: "The latest report attached to this queue decision.",
  summary: {
    label: "Report notes",
  },
  operationalSection: {
    title: "Operational signals",
  },
  operationalSectionDescription: "Signal pressure",
  fieldHandlingTitle: "Trust and provenance",
  fieldHandlingDescription: "Source metadata for validating the signal.",
  contextLabel: "Decision context",
  primaryActionLabel: "Open clinic detail",
  returnActionLabel: "Return to queue",
} as const;

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

function formatDuration(startValue: string, endValue: string) {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "Unavailable";
  }

  const minutes = Math.max(0, Math.round((end - start) / 60_000));

  if (minutes === 0) {
    return "Same minute";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

function getReturnTarget(consoleHref: "/demo" | "/district", from?: string | null) {
  if (consoleHref === "/district" && from === "district-severity-queue") {
    return {
      href: "/district/severity-queue",
      label: "Back to severity queue",
      clinicFrom: "district-severity-queue",
    };
  }

  return {
    href: `${consoleHref}#clinic-evidence`,
    label: consoleHref === "/district" ? "Back to district console" : "Back to demo console",
    clinicFrom: "report-detail",
  };
}

export default function ReportDetailPageClient({
  consoleHref = "/demo",
}: ReportDetailPageClientProps) {
  const { state } = useDemoStore();
  const params = useParams<{ reportId?: string | string[] }>();
  const searchParams = useSearchParams();
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
  const entrySource = searchParams.get("from");
  const isSeverityQueueEntry = consoleHref === "/district" && entrySource === "district-severity-queue";
  const copy = isSeverityQueueEntry ? severityQueueCopy : reportStreamCopy;
  const returnTarget = getReturnTarget(consoleHref, entrySource);
  const returnHref = returnTarget.href;
  const returnLabel = returnTarget.label;

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
  )}?from=${returnTarget.clinicFrom}`;
  const auditConsequence =
    auditEvents[0]?.summary ?? "No linked audit consequence has been recorded yet.";
  const statusTone = getReportStatusTone(report.status);
  const syncDelay = formatDuration(report.submittedAt, report.receivedAt);
  const decisionCopy = buildReportDecisionCopy({
    queuePressure: report.queuePressure,
    staffPressure: report.staffPressure,
    status: report.status,
  });
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
  const actions: EvidenceCommandAction[] = [
    {
      label: copy.primaryActionLabel,
      href: clinicDetailHref,
      priority: "primary",
      icon: "clinic",
    },
    {
      label: copy.returnActionLabel,
      href: returnHref,
      priority: "secondary",
      icon: isSeverityQueueEntry ? "queue" : "stream",
    },
  ];
  const headerActions = actions.filter((action) => action.priority === "secondary");
  const chips: EvidenceCommandChipModel[] = [
    {
      label: formatEvidenceLabel(report.status),
      tone: statusTone,
    },
    {
      label: formatEvidenceSource(report.source),
      tone: "info",
    },
    {
      label: report.offlineCreated ? "offline synced" : "online report",
      tone: report.offlineCreated ? "attention" : "stable",
    },
  ];
  const metrics: EvidenceCommandMetric[] = [
    {
      label: "Priority signal",
      value: formatEvidenceLabel(report.status),
      detail: "Current service state carried by this report.",
      tone: statusTone,
      icon: "alert",
    },
    {
      label: "Source",
      value: formatEvidenceSource(report.source),
      detail: "Who supplied the latest attached evidence.",
      tone: "info",
      icon: "check",
    },
    {
      label: "Signal path",
      value: syncDelay,
      detail: report.offlineCreated ? "Captured offline before sync." : "Received online.",
      tone: report.offlineCreated ? "attention" : "stable",
      icon: report.offlineCreated ? "offline" : "radio",
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
      title: copy.operationalSection.title,
      description: copy.operationalSectionDescription,
      fields: [
        {
          label: isSeverityQueueEntry ? "Queue pressure" : "Queue",
          value: formatEvidenceLabel(report.queuePressure),
          tone: getPressureTone(report.queuePressure, "queue"),
        },
        {
          label: isSeverityQueueEntry ? "Staff pressure" : "Staff",
          value: formatEvidenceLabel(report.staffPressure),
          tone: getPressureTone(report.staffPressure, "staff"),
        },
        {
          label: isSeverityQueueEntry ? "Stock pressure" : "Stock",
          value: formatEvidenceLabel(report.stockPressure),
          tone: getPressureTone(report.stockPressure, "stock"),
        },
      ],
    },
    {
      title: copy.fieldHandlingTitle,
      description: copy.fieldHandlingDescription,
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
        eyebrow={copy.headerEyebrow}
        title={copy.headerTitle}
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
            title={copy.caseTitle}
            description={copy.caseDescription}
            summary={{
              label: copy.summary.label,
              value: report.reason,
              emphasis: true,
            }}
            primaryFields={primaryFields}
            sections={evidenceSections}
          />
          <details className="group rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-foreground sm:px-5">
              <span className="inline-flex min-w-0 items-center gap-2">
                <FileJson aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span>Technical payload</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground group-open:hidden">
                Collapsed
              </span>
              <span className="hidden text-xs font-medium text-muted-foreground group-open:inline">
                Expanded
              </span>
            </summary>
            <div className="border-t border-border-subtle px-4 pb-4 sm:px-5">
              <pre className="mt-4 max-h-[28rem] overflow-auto rounded-md bg-bg-muted p-3 text-xs leading-5 text-content-default">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </details>
        </div>
        <div className="grid min-w-0 gap-4 content-start">
          <EvidenceDecisionPanel
            decision={{
              contextLabel: copy.contextLabel,
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
