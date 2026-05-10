"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { PartnerReadinessPanel } from "@/components/demo/partner-readiness-panel";
import { PilotReadinessPanel } from "@/components/demo/pilot-readiness-panel";
import { ReferencePanel } from "@/components/demo/reference-dashboard";
import { ReferenceSectionCards } from "@/components/demo/reference-section-cards";
import { SectionHeader } from "@/components/demo/section-header";
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
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { adminWorkspaceSections } from "@/lib/demo/admin-layout";
import { useDemoStore } from "@/lib/demo/demo-store";
import { getClinicRows } from "@/lib/demo/selectors";
import type { DemoLead } from "@/lib/demo/types";
import type { DemoState } from "@/lib/demo/types";
import {
  buildPartnerReadinessModel,
  createOneTimePartnerApiKeySecret,
  createOneTimePartnerWebhookSecret,
  type OneTimePartnerApiKeySecret,
  type OneTimePartnerWebhookSecret,
} from "@/lib/demo/partner-readiness";
import {
  createPartnerApiKeyAction,
  createPartnerExportAction,
  createPartnerWebhookAction,
  testPartnerWebhookAction,
} from "./actions";

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
};

type PartnerReadinessAction =
  | "create-key"
  | "create-webhook"
  | "generate-export"
  | "test-webhook";

function getPartnerActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Partner readiness action failed.";
}

export default function AdminPage({
  session,
  syncSummary,
  partnerReadiness,
}: AdminPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state,
    resetDemo,
  } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
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
  const [partnerActionPending, setPartnerActionPending] =
    useState<PartnerReadinessAction | null>(null);
  const [partnerActionError, setPartnerActionError] = useState<string | null>(null);
  const [oneTimeApiKeySecret, setOneTimeApiKeySecret] =
    useState<OneTimePartnerApiKeySecret | null>(null);
  const [oneTimeWebhookSecret, setOneTimeWebhookSecret] =
    useState<OneTimePartnerWebhookSecret | null>(null);
  const partnerActionPendingRef = useRef<PartnerReadinessAction | null>(null);

  const partnerActionInFlight = partnerActionPending !== null;
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
  const partnerReadinessAnchor = isSystemAdmin ? "partner-readiness-panel" : evidenceAnchor;
  const reportCompleteness = Math.max(0, 100 - queuedReports * 8);
  const staleClinicCount = clinics.filter((clinic) => clinic.freshness === "stale").length;
  const operationsPriority =
    activeAlertCount > 0
      ? "Assign owners to open escalations before readiness review."
      : staleClinicCount > 0
        ? "Confirm stale clinic status before the next district review."
        : "Readiness evidence is clear enough for review.";
  const reviewFocusItems = isSystemAdmin
    ? [
        {
          label: "Tenant health",
          title: "Platform jobs and ingestion remain the first review lane.",
          value: queuedReports > 0 ? `${queuedReports} pending` : "Ready",
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
          title: `${clinics.length - staleClinicCount} of ${clinics.length} clinics have usable freshness.`,
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

  const runPartnerAction = async <Result,>(
    action: PartnerReadinessAction,
    mutate: () => Promise<Result>,
    onSuccess?: (result: Result) => void,
  ) => {
    if (partnerActionPendingRef.current) {
      return;
    }

    partnerActionPendingRef.current = action;
    setPartnerActionPending(action);
    setPartnerActionError(null);

    try {
      const result = await mutate();
      onSuccess?.(result);
      router.refresh();
    } catch (error) {
      setPartnerActionError(getPartnerActionErrorMessage(error));
    } finally {
      partnerActionPendingRef.current = null;
      setPartnerActionPending(null);
    }
  };

  const handleCreateDemoKey = () => {
    if (partnerActionPendingRef.current) {
      return;
    }
    setOneTimeApiKeySecret(null);
    void runPartnerAction(
      "create-key",
      () =>
        createPartnerApiKeyAction({
          name: "Demo partner integration",
          environment: "demo",
          scopes: ["clinics:read", "status:read", "alternatives:read", "exports:read"],
          allowedDistricts: [state.district],
        }),
      (result) => setOneTimeApiKeySecret(createOneTimePartnerApiKeySecret(result)),
    );
  };

  const handleCreatePartnerWebhook = () => {
    if (partnerActionPendingRef.current) {
      return;
    }
    setOneTimeWebhookSecret(null);
    void runPartnerAction(
      "create-webhook",
      () =>
        createPartnerWebhookAction({
          name: "Demo partner webhook",
          targetUrl: "https://partner.example.test/webhooks/clinicpulse",
          eventTypes: ["clinic.status_changed"],
        }),
      (result) => setOneTimeWebhookSecret(createOneTimePartnerWebhookSecret(result)),
    );
  };

  const handleGeneratePartnerExport = () => {
    void runPartnerAction("generate-export", () =>
      createPartnerExportAction({
        format: "json",
        scope: { district: state.district },
      }),
    );
  };

  const handleTestPartnerWebhook = (subscriptionId: number) => {
    void runPartnerAction("test-webhook", () => testPartnerWebhookAction(subscriptionId));
  };

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
              value: isSystemAdmin ? String(queuedReports) : `${reportCompleteness}%`,
              badge: queuedReports > 0 ? "Pending" : "Ready",
              trend: queuedReports > 0 ? "down" : "neutral",
              footer: "Field reports are part of readiness",
              detail: isSystemAdmin
                ? "Offline updates waiting to merge into platform state."
                : "Queued local reports are counted before review confidence is shown.",
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
                href={`#${partnerReadinessAnchor}`}
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
                  ? "The platform console starts with reliability, access, and integration evidence."
                  : "The operations deck starts with district readiness, access hygiene, and escalation quality."
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
                    {staleClinicCount} stale clinics and {queuedReports} queued reports affect confidence.
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

        <div id="readiness">
          {syncSummary ? <PilotReadinessPanel summary={syncSummary} /> : null}
        </div>
        <div id={partnerReadinessAnchor}>
          <PartnerReadinessPanel
            readiness={partnerReadiness}
            onCreateDemoKey={handleCreateDemoKey}
            onCreateWebhook={handleCreatePartnerWebhook}
            onGenerateExport={handleGeneratePartnerExport}
            onTestWebhook={handleTestPartnerWebhook}
            pendingActions={{
              createDemoKey: partnerActionInFlight,
              createWebhook: partnerActionInFlight,
              generateExport: partnerActionInFlight,
              testWebhook: partnerActionInFlight,
            }}
            actionError={partnerActionError}
            oneTimeApiKeySecret={oneTimeApiKeySecret}
            oneTimeWebhookSecret={oneTimeWebhookSecret}
            onClearOneTimeApiKeySecret={() => setOneTimeApiKeySecret(null)}
            onClearOneTimeWebhookSecret={() => setOneTimeWebhookSecret(null)}
          />
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
