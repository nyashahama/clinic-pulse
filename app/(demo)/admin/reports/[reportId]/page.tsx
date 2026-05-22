import { notFound } from "next/navigation";

import {
  AdminDetailShell,
} from "@/components/product/admin-detail";
import {
  EvidenceCommandChip,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidencePacketPanel,
  EvidenceTimeline,
} from "@/components/product/evidence-command";
import { getSessionCookieHeader } from "@/lib/auth/session";
import { getClinicRows } from "@/lib/demo/selectors";
import {
  loadDemoHydrationForRole,
  loadPendingReportsForRole,
} from "@/lib/demo/server-hydration";
import {
  buildPendingReportReviews,
} from "@/lib/product/report-review";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import {
  buildReportDecisionCopy,
  formatEvidenceLabel,
  getPressureTone,
  getReportStatusTone,
  type EvidenceCommandAction,
  type EvidenceCommandChip as EvidenceCommandChipModel,
  type EvidenceCommandField,
  type EvidenceCommandMetric,
  type EvidenceCommandTimelineItem,
} from "@/lib/product/evidence-command";
import { requireDemoWorkflowAccess } from "../../../workflow-guard";
import { formatDateTime } from "../../governance-formatters";

type ReportDetailPageProps = {
  params: Promise<{
    reportId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: ReportDetailPageProps) {
  const session = await requireDemoWorkflowAccess("admin");
  const [{ reportId }, query] = await Promise.all([params, searchParams]);
  const parsedReportId = parseAdminNumericId(reportId);

  if (!parsedReportId) {
    notFound();
  }

  const cookieHeader = await getSessionCookieHeader();
  const apiOptions = {
    init: cookieHeader
      ? {
          headers: {
            cookie: cookieHeader,
          },
        }
      : undefined,
  };
  const [pendingReports, state] = await Promise.all([
    loadPendingReportsForRole(session.role, apiOptions),
    loadDemoHydrationForRole(session.role, apiOptions),
  ]);
  const review = buildPendingReportReviews(
    pendingReports,
    getClinicRows(state),
  ).find((item) => item.reportId === parsedReportId);

  if (!review) {
    notFound();
  }

  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const clinicDetailHref = `/district/clinics/${encodeURIComponent(
    review.clinicId,
  )}?from=admin`;
  const statusTone = getReportStatusTone(String(review.status));
  const decisionCopy = buildReportDecisionCopy({
    queuePressure: String(review.queuePressure),
    reviewState: review.reviewState,
    staffPressure: String(review.staffPressure),
    status: String(review.status),
  });
  const actions: EvidenceCommandAction[] = [
    {
      label: "Open clinic detail",
      href: clinicDetailHref,
      priority: "primary",
      icon: "clinic",
    },
    {
      label: "Return to review queue",
      href: "/admin#admin-review-pressure",
      priority: "secondary",
      icon: "queue",
    },
  ];
  const headerActions = actions.filter((action) => action.priority === "secondary");
  const chips: EvidenceCommandChipModel[] = [
    {
      label: formatEvidenceLabel(String(review.status)),
      tone: statusTone,
    },
    {
      label: formatEvidenceLabel(review.reviewState),
      tone: "attention",
    },
    {
      label: review.offlineCreated ? "offline sync" : formatEvidenceLabel(review.source),
      tone: review.offlineCreated ? "attention" : "neutral",
    },
  ];
  const metrics: EvidenceCommandMetric[] = [
    {
      label: "Review state",
      value: formatEvidenceLabel(review.reviewState),
      detail: `Report #${review.reportId}`,
      tone: "attention",
      icon: "alert",
    },
    {
      label: "Queue pressure",
      value: formatEvidenceLabel(String(review.queuePressure)),
      detail: "Patient routing impact",
      tone: getPressureTone(String(review.queuePressure), "queue"),
      icon: "activity",
    },
    {
      label: "Staff pressure",
      value: formatEvidenceLabel(String(review.staffPressure)),
      detail: "Operational capacity",
      tone: getPressureTone(String(review.staffPressure), "staff"),
      icon: "activity",
    },
    {
      label: "Received",
      value: formatDateTime(review.receivedAt),
      detail: review.offlineCreated ? "Synced offline" : formatEvidenceLabel(review.source),
      tone: "info",
      icon: "clock",
    },
  ];
  const fields: EvidenceCommandField[] = [
    {
      label: "Clinic",
      value: review.clinicName,
      href: clinicDetailHref,
      emphasis: true,
    },
    {
      label: "Facility",
      value: review.facilityCode,
    },
    {
      label: "District",
      value: review.district,
    },
    {
      label: "Status",
      value: formatEvidenceLabel(String(review.status)),
      tone: statusTone,
    },
    {
      label: "Review state",
      value: formatEvidenceLabel(review.reviewState),
      tone: "attention",
    },
    {
      label: "Source",
      value: review.offlineCreated
        ? `${formatEvidenceLabel(review.source)} / synced offline`
        : formatEvidenceLabel(review.source),
    },
    {
      label: "Reporter",
      value: review.reporterName,
    },
    {
      label: "Submitted",
      value: formatDateTime(review.submittedAt),
    },
    {
      label: "Received",
      value: formatDateTime(review.receivedAt),
    },
    {
      label: "Pressure",
      value: `staff ${formatEvidenceLabel(String(review.staffPressure))}; stock ${formatEvidenceLabel(
        String(review.stockPressure),
      )}; queue ${formatEvidenceLabel(String(review.queuePressure))}`,
    },
    {
      label: "Reason",
      value: review.reason,
      emphasis: true,
    },
    {
      label: "Notes",
      value: review.notes || "No notes supplied.",
      emphasis: Boolean(review.notes),
    },
  ];
  const timeline: EvidenceCommandTimelineItem[] = [
    {
      label: "Submitted",
      title: "Field worker submitted report",
      description: `${review.reporterName} reported ${formatEvidenceLabel(
        String(review.status),
      )} service status.`,
      timestamp: formatDateTime(review.submittedAt),
      tone: "info",
    },
    {
      label: "Received",
      title: review.offlineCreated ? "Offline report synced" : "Report received",
      description: review.offlineCreated
        ? "The report was created offline and synced into the admin queue."
        : "The report entered the admin review queue directly.",
      timestamp: formatDateTime(review.receivedAt),
      tone: review.offlineCreated ? "attention" : "stable",
    },
    {
      label: "Now",
      title: "Backstop review pending",
      description:
        "An administrator needs to decide whether this evidence updates readiness.",
      tone: "attention",
    },
  ];

  return (
    <AdminDetailShell
      eyebrow="Field evidence"
      title="Report detail"
      description={review.reason}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <EvidenceCommandHeader
        eyebrow="Field evidence"
        title="Report evidence brief"
        description={review.reason}
        actions={headerActions}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{review.clinicName}</span>
          <span>{review.facilityCode}</span>
          <span>{review.district}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone}`} />
          ))}
        </div>
      </EvidenceCommandHeader>
      <EvidenceCommandMetricStrip metrics={metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid min-w-0 gap-4">
          <EvidencePacketPanel
            title="Evidence packet"
            description="Operational facts captured with the pending field report."
            fields={fields}
          />
        </div>
        <div className="grid min-w-0 gap-4 content-start">
          <EvidenceDecisionPanel
            decision={{
              eyebrow: "Selected evidence decision",
              title: decisionCopy.title,
              scoreLabel: "Report",
              scoreValue: `#${review.reportId}`,
              chips,
              nextStep: decisionCopy.nextStep,
              nextStepTone: decisionCopy.tone,
              impactTitle: "Patient impact",
              impact: decisionCopy.impact,
              verificationTitle: "Verification",
              verification: decisionCopy.verification,
              evidence: {
                label: review.reason,
                detail: `${review.reporterName} - ${formatDateTime(review.receivedAt)}`,
                tone: statusTone,
              },
              actions,
            }}
          />
          <EvidenceTimeline
            title="Evidence timeline"
            description="The timestamps that explain how this report entered the review queue."
            items={timeline}
          />
        </div>
      </div>
    </AdminDetailShell>
  );
}
