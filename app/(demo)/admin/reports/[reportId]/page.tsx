import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminDetailActionPanel,
  AdminDetailEvidenceList,
  AdminDetailHero,
  AdminDetailJsonBlock,
  AdminDetailShell,
  AdminDetailSignalBar,
  AdminDetailTimeline,
  getAdminDetailPressureTone,
} from "@/components/product/admin-detail";
import { buttonVariants } from "@/components/ui/button";
import { getSessionCookieHeader } from "@/lib/auth/session";
import { getClinicRows } from "@/lib/demo/selectors";
import {
  loadDemoHydrationForRole,
  loadPendingReportsForRole,
} from "@/lib/demo/server-hydration";
import {
  buildPendingReportReviews,
  type PendingReportReview,
} from "@/lib/product/report-review";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { requireDemoWorkflowAccess } from "../../../workflow-guard";
import {
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../governance-formatters";

type ReportDetailPageProps = {
  params: Promise<{
    reportId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

function reportStatusTone(status: string) {
  if (status === "operational") {
    return "clear" as const;
  }

  if (status === "non_functional") {
    return "blocked" as const;
  }

  return "attention" as const;
}

function reportPayload(review: PendingReportReview) {
  return {
    reportId: review.reportId,
    clinicId: review.clinicId,
    clinicName: review.clinicName,
    status: review.status,
    reason: review.reason,
    pressures: {
      staff: review.staffPressure,
      stock: review.stockPressure,
      queue: review.queuePressure,
    },
    reporterName: review.reporterName,
    source: review.source,
    offlineCreated: review.offlineCreated,
    submittedAt: review.submittedAt,
    receivedAt: review.receivedAt,
    reviewState: review.reviewState,
    notes: review.notes,
  };
}

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

  return (
    <AdminDetailShell
      eyebrow="Field evidence"
      title="Report detail"
      description={review.reason}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <AdminDetailHero
        eyebrow="Field evidence"
        title="Report detail"
        description={review.reason}
        status={
          <StatusBadge tone={reportStatusTone(String(review.status))}>
            {formatLabel(String(review.status))}
          </StatusBadge>
        }
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
              href="/admin#admin-review-pressure"
            >
              Review queue
            </Link>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{review.clinicName}</span>
          <span>{review.facilityCode}</span>
          <span>{review.district}</span>
        </div>
      </AdminDetailHero>
      <AdminDetailSignalBar
        signals={[
          {
            label: "Review state",
            value: formatLabel(review.reviewState),
            detail: `Report #${review.reportId}`,
            tone: "attention",
          },
          {
            label: "Queue pressure",
            value: formatLabel(String(review.queuePressure)),
            detail: "Patient routing impact",
            tone: getAdminDetailPressureTone(String(review.queuePressure), "queue"),
          },
          {
            label: "Staff pressure",
            value: formatLabel(String(review.staffPressure)),
            detail: "Operational capacity",
            tone: getAdminDetailPressureTone(String(review.staffPressure), "staff"),
          },
          {
            label: "Received",
            value: formatDateTime(review.receivedAt),
            detail: review.offlineCreated ? "Synced offline" : formatLabel(review.source),
            tone: review.offlineCreated ? "attention" : "info",
          },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
        <div className="grid min-w-0 gap-4">
          <AdminDetailEvidenceList
            title="Evidence properties"
            description="Operational facts captured with the pending field report."
            items={[
              {
                label: "Clinic",
                value: (
                  <Link
                    className="underline-offset-4 hover:underline"
                    href={clinicDetailHref}
                  >
                    {review.clinicName}
                  </Link>
                ),
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
                value: (
                  <StatusBadge tone={reportStatusTone(String(review.status))}>
                    {formatLabel(String(review.status))}
                  </StatusBadge>
                ),
              },
              {
                label: "Review state",
                value: (
                  <StatusBadge tone="attention">
                    {formatLabel(review.reviewState)}
                  </StatusBadge>
                ),
              },
              {
                label: "Source",
                value: review.offlineCreated
                  ? `${formatLabel(review.source)} / synced offline`
                  : formatLabel(review.source),
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
                label: "Staff",
                value: formatLabel(String(review.staffPressure)),
              },
              {
                label: "Stock",
                value: formatLabel(String(review.stockPressure)),
              },
              {
                label: "Queue",
                value: formatLabel(String(review.queuePressure)),
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
            ]}
          />
          <AdminDetailJsonBlock title="Raw report evidence" value={reportPayload(review)} />
        </div>
        <div className="grid min-w-0 gap-4 content-start">
          <AdminDetailActionPanel
            title="Recommended next action"
            description="Review the clinic context before accepting or rejecting the field evidence."
          >
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={clinicDetailHref}
            >
              Review clinic context
            </Link>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/admin#admin-review-pressure"
            >
              Return to review queue
            </Link>
          </AdminDetailActionPanel>
          <AdminDetailTimeline
            title="Evidence timeline"
            description="The timestamps that explain how this report entered the review queue."
            items={[
              {
                label: "Submitted",
                title: "Field worker submitted report",
                description: `${review.reporterName} reported ${formatLabel(
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
                tone: review.offlineCreated ? "attention" : "clear",
              },
              {
                label: "Now",
                title: "Backstop review pending",
                description:
                  "An administrator needs to decide whether this evidence updates readiness.",
                tone: "attention",
              },
            ]}
          />
        </div>
      </div>
    </AdminDetailShell>
  );
}
