"use client";

import { useMemo } from "react";

import { OrgAdminGovernanceWorkbench } from "@/components/product/org-admin-governance-workbench";
import { SystemAdminCommandConsole } from "@/components/product/system-admin-command-console";
import type { ClientAuthSession } from "@/lib/auth/api";
import type {
  PartnerReadinessApiResponse,
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { useDemoStore } from "@/lib/demo/demo-store";
import { buildPartnerReadinessModel } from "@/lib/demo/partner-readiness";
import { getClinicRows } from "@/lib/demo/selectors";
import type { DemoLead, DemoState } from "@/lib/demo/types";
import {
  buildAdminLeadDetailHref,
  buildAdminReportDetailHref,
} from "@/lib/product/admin-detail-routes";
import { buildOrgAdminGovernanceWorkbenchModel } from "@/lib/product/org-admin-governance-workbench";
import {
  buildPendingReportReviews,
  summarizePendingReportReviews,
} from "@/lib/product/report-review";
import { buildSystemAdminCommandModel } from "@/lib/product/system-admin-command";
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

function formatFocus(value: string) {
  return value.replaceAll("_", " ");
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
  const { state } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
  const pendingReportReviews = useMemo(
    () => buildPendingReportReviews(pendingReports, clinics),
    [clinics, pendingReports],
  );
  const pendingReportSummary = useMemo(
    () => summarizePendingReportReviews(pendingReportReviews),
    [pendingReportReviews],
  );
  const leadStatusCount = useMemo(() => buildLeadStatusCounts(state.leads), [state.leads]);
  const queuedReports = state.offlineQueue.length;
  const activeAlertCount = state.alerts.filter((alert) => alert.status === "open").length;
  const staleClinicCount = clinics.filter((clinic) => clinic.freshness === "stale").length;
  const needsConfirmationClinicCount = clinics.filter(
    (clinic) => clinic.freshness === "needs_confirmation",
  ).length;
  const adminInteractionAt = useMemo(() => getLatestAdminInteractionAt(state), [state]);
  const latestActivityLabel = adminInteractionAt ? formatDate(adminInteractionAt) : "No activity yet";
  const partnerReadinessModel = useMemo(
    () => buildPartnerReadinessModel(partnerReadiness),
    [partnerReadiness],
  );
  const isSystemAdmin = session.role === "system_admin";
  const pendingReviewCount = pendingReportSummary.pending;
  const returnSource = "admin";

  const systemAdminCommandModel = isSystemAdmin
    ? buildSystemAdminCommandModel({
        clinicCount: clinics.length,
        staleClinicCount,
        queuedReports,
        pendingReviewCount,
        activeAlertCount,
        auditEventCount: state.auditEvents.length,
        leadStatusCount,
        partnerReadiness: partnerReadinessModel,
        syncSummary: {
          lastSyncAt: state.lastSyncAt,
          pendingOfflineReports: syncSummary?.pendingOfflineReports ?? queuedReports,
          validationFailures: syncSummary?.validationFailures ?? 0,
          conflictsNeedingAttention: syncSummary?.conflictsNeedingAttention ?? 0,
          staleClinics: syncSummary?.staleClinics ?? staleClinicCount,
          needsConfirmationClinics:
            syncSummary?.needsConfirmationClinics ?? needsConfirmationClinicCount,
        },
      })
    : null;

  if (systemAdminCommandModel) {
    return <SystemAdminCommandConsole model={systemAdminCommandModel} />;
  }

  const workbenchModel = buildOrgAdminGovernanceWorkbenchModel({
    clinicCount: clinics.length,
    staleClinicCount,
    needsConfirmationClinicCount,
    pendingReviewCount,
    queuedOfflineCount: queuedReports,
    activeAlertCount,
    newStakeholderCount: leadStatusCount.new,
    followUpStakeholderCount: leadStatusCount.contacted + leadStatusCount.scheduled,
    partnerCheckCount: partnerReadiness.integrationChecks.length,
    partnerSeverity: partnerReadinessModel.severity,
    latestActivityLabel,
  });

  return (
    <OrgAdminGovernanceWorkbench
      model={workbenchModel}
      pendingReportSummary={pendingReportSummary}
      pendingReportReviews={pendingReportReviews}
      getReportDetailHref={(item) =>
        buildAdminReportDetailHref(item.reportId, returnSource)
      }
      onReview={reviewPendingReportAction}
      stakeholders={state.leads.map((lead) => ({
        id: String(lead.id),
        name: lead.name,
        organization: lead.organization,
        role: lead.role,
        focus: formatFocus(lead.interest),
        status: lead.status,
        updatedLabel: formatDate(lead.createdAt),
        href: buildAdminLeadDetailHref(lead.id, returnSource),
      }))}
      partnerMetrics={partnerReadinessModel.metrics}
    />
  );
}
