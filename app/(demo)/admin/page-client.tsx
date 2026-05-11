"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  FileCheck2,
  RefreshCcw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { ExportPreview } from "@/components/demo/export-preview";
import { APIPreview } from "@/components/demo/api-preview";
import { RoadmapModules } from "@/components/demo/roadmap-modules";
import { PilotReadinessPanel } from "@/components/demo/pilot-readiness-panel";
import { ReferencePanel } from "@/components/demo/reference-dashboard";
import { ReferenceSectionCards } from "@/components/demo/reference-section-cards";
import { SectionHeader } from "@/components/demo/section-header";
import { ReportReviewQueue } from "@/components/product/report-review-queue";
import { ReportReviewSummary } from "@/components/product/report-review-summary";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientAuthSession } from "@/lib/auth/api";
import type {
  PartnerReadinessApiResponse,
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { adminWorkspaceSections } from "@/lib/demo/admin-layout";
import { useDemoStore } from "@/lib/demo/demo-store";
import { getClinicRows } from "@/lib/demo/selectors";
import type { DemoLead } from "@/lib/demo/types";
import type { DemoState } from "@/lib/demo/types";
import { buildPartnerReadinessModel } from "@/lib/demo/partner-readiness";
import {
  buildPendingReportReviews,
  summarizePendingReportReviews,
} from "@/lib/product/report-review";
import { reviewPendingReportAction } from "../report-review-actions";

type LeadStatusCount = Record<DemoLead["status"], number>;

function buildLeadStatusCounts(leads: DemoLead[]): LeadStatusCount {
  return leads.reduce(
    (accumulator, lead) => {
      accumulator[lead.status] = accumulator[lead.status] + 1;
      return accumulator;
    },
    { new: 0, contacted: 0, scheduled: 0, completed: 0 },
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getLatestAdminInteractionAt(state: DemoState) {
  const timestamps = [
    ...state.auditEvents.map((event) => event.createdAt),
    ...state.leads.map((lead) => lead.createdAt),
    ...state.reports.map((report) => report.receivedAt),
    state.lastSyncAt,
  ].filter((timestamp): timestamp is string => Boolean(timestamp));

  return timestamps.sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function buildExportPayload(state: DemoState, generatedAt: string) {
  const clinics = getClinicRows(state);

  return {
    generatedAt,
    district: state.district,
    province: state.province,
    clinics: clinics.map((clinic) => ({
      id: clinic.id,
      name: clinic.name,
      facilityCode: clinic.facilityCode,
      status: clinic.status,
      freshness: clinic.freshness,
      reason: clinic.reason,
    })),
    leads: state.leads.map((lead) => ({
      ...lead,
    })),
    alerts: state.auditEvents,
    reports: state.reports.map((report) => ({
      id: report.id,
      clinicId: report.clinicId,
      status: report.status,
      reason: report.reason,
      receivedAt: report.receivedAt,
      source: report.source,
    })),
  };
}

type AdminPageProps = {
  session: ClientAuthSession;
  syncSummary: SyncSummaryApiResponse | null;
  partnerReadiness: PartnerReadinessApiResponse;
  pendingReports: ReportApiResponse[];
};

export default function AdminPage({
  session,
  syncSummary,
  partnerReadiness,
  pendingReports,
}: AdminPageProps) {
  const searchParams = useSearchParams();
  const {
    state,
    resetDemo,
  } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
  const pendingReportReviews = useMemo(
    () => buildPendingReportReviews(pendingReports, clinics),
    [clinics, pendingReports],
  );
  const pendingReportSummary = useMemo(
    () => summarizePendingReportReviews(pendingReportReviews),
    [pendingReportReviews],
  );
  const selectedClinicId = searchParams.get("clinicId");
  const selectedClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === selectedClinicId),
    [clinics, selectedClinicId],
  );

  const leadStatusCount = useMemo(() => buildLeadStatusCounts(state.leads), [state.leads]);
  const queuedReports = state.offlineQueue.length;
  const activeAlertCount = state.alerts.filter((alert) => alert.status === "open").length;
  const adminInteractionAt = useMemo(() => getLatestAdminInteractionAt(state), [state]);
  const exportGeneratedAt = adminInteractionAt ?? "1970-01-01T00:00:00.000Z";
  const exportPayload = useMemo(
    () => buildExportPayload(state, exportGeneratedAt),
    [state, exportGeneratedAt],
  );
  const partnerReadinessModel = useMemo(
    () => buildPartnerReadinessModel(partnerReadiness),
    [partnerReadiness],
  );
  const isSystemAdmin = session.role === "system_admin";
  const roleDashboard = isSystemAdmin ? "system_admin" : "org_admin";
  const summaryAnchor = isSystemAdmin ? "tenant-health" : "reporting-coverage";
  const reviewLaneAnchor = isSystemAdmin ? "data-ingestion" : "users-roles";
  const evidenceAnchor = isSystemAdmin ? "security" : "partner-readiness";
  const exportAnchor = isSystemAdmin ? "audit-evidence" : "exports";
  const controlsAnchor = "demo-controls";
  const reportCompleteness = Math.max(0, 100 - queuedReports * 8);
  const pendingReviewCount = pendingReportSummary.pending;
  const totalReportPressureCount = queuedReports + pendingReviewCount;
  const reviewPressureTitle = isSystemAdmin
    ? "Ingestion review pressure"
    : "Governance review pressure";
  const reviewPressureDescription = isSystemAdmin
    ? "Pending field reports waiting for platform backstop review before ingestion changes clinic status."
    : "Pending field reports waiting for organisation backstop review before governance evidence is complete.";
  const staleClinicCount = clinics.filter((clinic) => clinic.freshness === "stale").length;
  const operationsPriority =
    pendingReviewCount > 0
      ? `${pendingReviewCount} field reports need admin review before readiness is complete.`
      : activeAlertCount > 0
      ? "Assign owners to open escalations before readiness review."
      : staleClinicCount > 0
        ? "Confirm stale clinic status before the next district review."
        : "Readiness evidence is clear enough for review.";
  const reviewFocusItems = isSystemAdmin
    ? [
        {
          label: "Tenant health",
          title:
            pendingReviewCount > 0
              ? `${pendingReviewCount} field reports need ingestion review.`
              : "Platform jobs and ingestion remain the first review lane.",
          value: queuedReports + pendingReviewCount > 0
            ? `${queuedReports + pendingReviewCount} pending`
            : "Ready",
        },
        {
          label: "Access review",
          title: `${leadStatusCount.new} stakeholder or operator records need follow-up context.`,
          value: `${state.auditEvents.length} events`,
        },
        {
          label: "Security evidence",
          title: "Partner credentials, exports, and webhook checks are grouped below.",
          value: String(partnerReadiness.integrationChecks.length),
        },
      ]
    : [
        {
          label: "District readiness",
          title:
            pendingReviewCount > 0
              ? `${pendingReviewCount} field reports need governance review.`
              : `${clinics.length - staleClinicCount} of ${clinics.length} clinics have usable freshness.`,
          value: `${reportCompleteness}%`,
        },
        {
          label: "Access hygiene",
          title: `${leadStatusCount.contacted + leadStatusCount.scheduled} stakeholder records are in follow-up.`,
          value: `${leadStatusCount.new} new`,
        },
        {
          label: "Escalation quality",
          title: activeAlertCount > 0 ? "Open alerts need owner assignment." : "No open alerts need owner assignment.",
          value: `${activeAlertCount} open`,
        },
      ];

  return (
    <div className="grid min-w-0 gap-4 pb-4" data-role-dashboard={roleDashboard}>
      <div id={summaryAnchor}>
        <ReferenceSectionCards
          cards={[
            {
              title: isSystemAdmin ? "Tenants in view" : "Clinics governed",
              value: isSystemAdmin ? "12" : String(clinics.length),
              badge: "Live scope",
              trend: "up",
              footer: isSystemAdmin
                ? "Platform console is scoped"
                : "Organisation workspace is scoped",
              detail: isSystemAdmin
                ? "Demo tenant estate represented in this platform console."
                : "Clinic records included in this admin surface.",
            },
            {
              title: isSystemAdmin ? "Audit events" : "Open alerts",
              value: isSystemAdmin ? String(state.auditEvents.length) : String(activeAlertCount),
              badge: activeAlertCount > 0 ? "Review" : "Clear",
              trend: activeAlertCount > 0 ? "down" : "neutral",
              footer: operationsPriority,
              detail: isSystemAdmin
                ? "Operational actions available for access review."
                : "Escalations visible to district and organisation users.",
            },
            {
              title: isSystemAdmin ? "Ingestion queue" : "Reporting coverage",
              value: isSystemAdmin
                ? String(totalReportPressureCount)
                : pendingReviewCount > 0
                  ? `${pendingReviewCount} reviews`
                  : `${reportCompleteness}%`,
              badge: totalReportPressureCount > 0 ? "Pending" : "Ready",
              trend: totalReportPressureCount > 0 ? "down" : "neutral",
              footer:
                pendingReviewCount > 0
                  ? "Backstop review is blocking readiness"
                  : "Local field reports are part of readiness",
              detail: isSystemAdmin
                ? "Offline updates and pending field report reviews affect ingestion confidence."
                : "Local queued reports and pending governance reviews are counted before confidence is shown.",
            },
            {
              title: "Readiness evidence",
              value: `${partnerReadiness.integrationChecks.length} checks`,
              badge: partnerReadinessModel.severity === "clear" ? "Ready" : "Attention",
              trend: partnerReadinessModel.severity === "clear" ? "neutral" : "down",
              footer: "Partner proof stays in the admin path",
              detail: "API keys, exports, webhooks, and org evidence are reviewed together.",
            },
          ]}
        />
      </div>

      <div className="grid gap-4">
        <ReferencePanel
          actions={
            <div className="flex flex-wrap gap-2">
              <a className={buttonVariants({ size: "sm" })} href="#readiness">
                <ShieldCheck className="size-3.5" />
                Review readiness
              </a>
              <a
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/admin/partner-readiness"
              >
                Partner evidence
              </a>
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/field"
              >
                Field workflow
              </Link>
            </div>
          }
          description={
            isSystemAdmin
              ? "Review ingestion, security evidence, partner readiness, and tenant activity without leaving the platform console."
              : "Review reporting quality, access hygiene, partner readiness, and district escalation quality from one operations surface."
          }
          eyebrow={isSystemAdmin ? "Platform command" : "Organisation command"}
          title={isSystemAdmin ? "Platform operations deck" : "Operations admin deck"}
        >
          <p className="text-sm text-muted-foreground">
            {operationsPriority} This workspace keeps review work tied to
            clinics, users, partners, and readiness evidence.
          </p>
        </ReferencePanel>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div id={reviewLaneAnchor}>
            <ReferencePanel
              title={isSystemAdmin ? "Platform review lanes" : "Organisation review lanes"}
              description={
                isSystemAdmin
                  ? "The platform console starts with reliability, ingestion review, access, and integration evidence."
                  : "The operations deck starts with governance review pressure, access hygiene, and escalation quality."
              }
            >
              <div className="grid gap-3">
                {reviewFocusItems.map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-3 rounded-xl border border-border bg-muted px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </ReferencePanel>
          </div>

          <div id={isSystemAdmin ? evidenceAnchor : "governance-actions"}>
            <ReferencePanel
              title={isSystemAdmin ? "Control-plane actions" : "Governance actions"}
              description={
                isSystemAdmin
                  ? "Keep tenant operations auditable before enabling more platform modules."
                  : "Keep the organisation ready by reviewing stale clinics, open alerts, and partner evidence."
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <UsersRound className="size-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-card-foreground">
                    {isSystemAdmin ? "Tenant access" : "Role coverage"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {leadStatusCount.new} records need context before the next access review.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <FileCheck2 className="size-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-card-foreground">
                    Data quality
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {staleClinicCount} stale clinics, {queuedReports} queued local reports, and{" "}
                    {pendingReviewCount} pending reviews affect confidence.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <ShieldCheck className="size-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-card-foreground">
                    Partner proof
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Keys, exports, and webhooks are reviewed in the readiness section.
                  </p>
                </div>
              </div>
            </ReferencePanel>
          </div>
        </div>

        <div
          id="admin-review-pressure"
          className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]"
        >
          <ReportReviewSummary
            summary={pendingReportSummary}
            title={reviewPressureTitle}
            description={reviewPressureDescription}
          />
          {pendingReportReviews.length > 0 ? (
            <ReportReviewQueue
              items={pendingReportReviews}
              onReview={reviewPendingReportAction}
              title={isSystemAdmin ? "Ingestion backstop queue" : "Governance backstop queue"}
              description={
                isSystemAdmin
                  ? "Accept or reject field evidence before platform ingestion updates operational state."
                  : "Accept or reject field evidence before organisation readiness moves forward."
              }
            />
          ) : null}
        </div>

        <div id="readiness">
          {syncSummary ? <PilotReadinessPanel summary={syncSummary} /> : null}
        </div>
        <div id="partner-readiness">
          {isSystemAdmin ? <span id="partner-readiness-panel" className="sr-only" /> : null}
          <ReferencePanel
            actions={
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/admin/partner-readiness"
              >
                Open partner readiness
              </Link>
            }
            title="Partner readiness"
            description="API key, export package, webhook preview, and integration check evidence now live in the dedicated partner readiness module."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {partnerReadinessModel.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="min-w-0 rounded-lg border border-border bg-muted px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-1 break-words text-2xl font-semibold leading-tight text-card-foreground">
                    {metric.value}
                  </p>
                  {metric.detail ? (
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {metric.detail}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </ReferencePanel>
        </div>
      </div>

      {selectedClinic ? (
        <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Escalation context
              </p>
              <h2 className="mt-1 text-lg font-semibold text-content-emphasis">
                {selectedClinic.name}
              </h2>
              <p className="mt-1 text-sm text-content-default">
                Routed from clinic detail as an escalation target. Reason last updated:{" "}
                {formatDate(selectedClinic.lastReportedAt)}.
              </p>
            </div>
            <Link
              href={`/finder?query=${encodeURIComponent(selectedClinic.name)}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <ArrowLeft className="size-3.5" />
              Open in finder
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid min-w-0 gap-4">
        <section
          className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
          data-admin-section={adminWorkspaceSections[0]}
        >
          <SectionHeader
            eyebrow={isSystemAdmin ? "Tenant evidence" : "Operations evidence"}
            title={isSystemAdmin ? "Access and tenant activity" : "Stakeholder follow-up"}
            description={
              isSystemAdmin
                ? "Review activity that proves the platform can support auditable tenant operations."
                : "Track operational stakeholders alongside access, district readiness, and data quality."
            }
          />
        </section>

        <ReferencePanel
          title={isSystemAdmin ? "Tenant activity queue" : "Stakeholder activity queue"}
          description="Existing local records are presented as operational follow-up for rollout and access review."
        >
          <div className="min-w-0 overflow-x-auto">
            <Table className="min-w-full md:min-w-[56rem]">
              <TableHeader>
                <TableRow className="text-xs uppercase tracking-[0.08em]">
                  {["Name", "Organisation", "Role", "Focus", "Status", "Updated"].map((heading) => (
                    <TableHead key={heading} className="font-medium">
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.leads.map((lead) => (
                  <TableRow key={lead.id} className="align-top">
                    <TableCell className="font-medium text-card-foreground">
                      {lead.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.organization}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.role}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {lead.interest.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ReferencePanel>

        <div id={exportAnchor} data-admin-section={adminWorkspaceSections[1]}>
          <div id={isSystemAdmin ? undefined : "audit-evidence"}>
            <ExportPreview
              payload={exportPayload}
              onOpen={() => {
                // No-op stub for visual audit in this phase.
              }}
            />
          </div>
        </div>

        <div data-admin-section={adminWorkspaceSections[2]}>
          <APIPreview clinicCount={clinics.length} onOpen={() => {}} />
        </div>

        <div data-admin-section={adminWorkspaceSections[3]}>
          <RoadmapModules />
        </div>

        <section
          id={controlsAnchor}
          className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
          data-admin-section={adminWorkspaceSections[4]}
        >
          <SectionHeader
            eyebrow="Demo controls"
            title="Reset and runbook"
            description="Controls stay out of the primary admin workflow so operators focus on readiness first."
            actions={
              <Button size="sm" variant="outline" onClick={resetDemo}>
                <RefreshCcw className="size-3.5" />
                Reset walkthrough data
              </Button>
            }
          />
          <ul className="mt-4 space-y-2 text-sm text-content-default">
            <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
              <span className="font-medium text-content-emphasis">Workspace flow:</span>{" "}
              Start at the role home, then open command, finder, and field modules as needed.
            </li>
            <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
              <span className="font-medium text-content-emphasis">Escalation path:</span>{" "}
              Use alert list and status actions to show reroute confidence.
            </li>
            <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
              <span className="font-medium text-content-emphasis">Access hygiene:</span>{" "}
              Review users, stale accounts, and partner credentials before rollout.
            </li>
            <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
              <span className="font-medium text-content-emphasis">Admin proof:</span>{" "}
              Export payload, API schema, and partner checks show completed operating evidence.
            </li>
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-content-subtle">
            <CalendarClock className="size-4" />
            Last admin interaction: {adminInteractionAt ? formatDate(adminInteractionAt) : "No activity yet"}
          </div>
        </section>
      </div>
    </div>
  );
}
