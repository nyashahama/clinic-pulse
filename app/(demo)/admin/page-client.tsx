"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  RefreshCcw,
  UserPlus,
  X,
} from "lucide-react";

import { DemoLeadForm } from "@/components/demo/demo-lead-form";
import { DemoLeadTable } from "@/components/demo/demo-lead-table";
import { ExportPreview } from "@/components/demo/export-preview";
import { APIPreview } from "@/components/demo/api-preview";
import { RoadmapModules } from "@/components/demo/roadmap-modules";
import { MetricTile } from "@/components/demo/metric-tile";
import { PartnerReadinessPanel } from "@/components/demo/partner-readiness-panel";
import { PilotReadinessPanel } from "@/components/demo/pilot-readiness-panel";
import { RoleWorkspaceHero } from "@/components/demo/role-workspace-hero";
import { SectionHeader } from "@/components/demo/section-header";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ClientAuthSession } from "@/lib/auth/api";
import type {
  PartnerReadinessApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { adminWorkspaceSections } from "@/lib/demo/admin-layout";
import { useDemoStore } from "@/lib/demo/demo-store";
import { getClinicRows } from "@/lib/demo/selectors";
import type { DemoLeadFormInput } from "@/components/demo/demo-lead-form";
import type { DemoLead } from "@/lib/demo/types";
import type { DemoState } from "@/lib/demo/types";
import {
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
    addDemoLead,
    updateLeadStatus,
  } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
  const selectedClinicId = searchParams.get("clinicId");
  const selectedClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === selectedClinicId),
    [clinics, selectedClinicId],
  );

  const leadStatusCount = useMemo(() => buildLeadStatusCounts(state.leads), [state.leads]);
  const alertCount = state.alerts.length;
  const queuedReports = state.offlineQueue.length;
  const activeAlertCount = state.alerts.filter((alert) => alert.status === "open").length;
  const adminInteractionAt = useMemo(() => getLatestAdminInteractionAt(state), [state]);
  const exportGeneratedAt = adminInteractionAt ?? "1970-01-01T00:00:00.000Z";
  const exportPayload = useMemo(
    () => buildExportPayload(state, exportGeneratedAt),
    [state, exportGeneratedAt],
  );
  const [manualLeadOpen, setManualLeadOpen] = useState(false);
  const [partnerActionPending, setPartnerActionPending] =
    useState<PartnerReadinessAction | null>(null);
  const [partnerActionError, setPartnerActionError] = useState<string | null>(null);
  const [oneTimeApiKeySecret, setOneTimeApiKeySecret] =
    useState<OneTimePartnerApiKeySecret | null>(null);
  const [oneTimeWebhookSecret, setOneTimeWebhookSecret] =
    useState<OneTimePartnerWebhookSecret | null>(null);
  const partnerActionPendingRef = useRef<PartnerReadinessAction | null>(null);

  const leadSorted = useMemo(
    () => [...state.leads].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [state.leads],
  );
  const partnerActionInFlight = partnerActionPending !== null;
  const isSystemAdmin = session.role === "system_admin";

  const handleLeadSubmit = (lead: DemoLeadFormInput) => {
    addDemoLead({
      ...lead,
      createdAt: new Date().toISOString(),
      status: "new",
    });
    setManualLeadOpen(false);
  };

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

  useEffect(() => {
    if (!manualLeadOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setManualLeadOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [manualLeadOpen]);

  return (
    <div className="grid gap-4 pb-4">
      <RoleWorkspaceHero
        session={session}
        metrics={[
          {
            label: isSystemAdmin ? "Tenants in view" : "Clinics governed",
            value: isSystemAdmin ? "12" : String(clinics.length),
            description: isSystemAdmin
              ? "Demo tenant estate represented in this platform console."
              : "Clinic records included in this organisation workspace.",
          },
          {
            label: isSystemAdmin ? "Audit events" : "Open alerts",
            value: isSystemAdmin ? String(state.auditEvents.length) : String(activeAlertCount),
            description: isSystemAdmin
              ? "Operational actions available for access review."
              : "Escalations that need organisation-level follow-through.",
            tone: activeAlertCount > 0 ? "warning" : "good",
          },
          {
            label: isSystemAdmin ? "Ingestion queue" : "Reporting coverage",
            value: isSystemAdmin ? String(queuedReports) : `${Math.max(0, 100 - queuedReports * 8)}%`,
            description: isSystemAdmin
              ? "Offline updates waiting to merge into platform state."
              : "Estimated coverage after queued field reports are considered.",
            tone: queuedReports > 0 ? "warning" : "good",
          },
        ]}
        focusItems={[
          {
            label: isSystemAdmin ? "Platform focus" : "Operational focus",
            title: isSystemAdmin ? "Ingestion and audit readiness" : "Coverage and access hygiene",
            description: isSystemAdmin
              ? "Use partner readiness, export previews, and audit evidence to validate the control plane."
              : "Use user, district, and reporting evidence to keep the organisation ready for rollout.",
          },
          {
            label: "Partner readiness",
            title: partnerActionError ? "Action needs retry" : "Integration checks available",
            description:
              partnerActionError ??
              "Generate keys, test webhooks, and review export evidence below.",
          },
          {
            label: "Admin flow",
            title: isSystemAdmin ? "Health, tenants, security" : "Districts, users, governance",
            description:
              "The page starts with operating state, then moves into readiness and evidence.",
          },
        ]}
      />

      <div className="grid gap-4">
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <SectionHeader
            eyebrow={isSystemAdmin ? "Platform controls" : "Organisation controls"}
            title={isSystemAdmin ? "Platform operations deck" : "Operations admin deck"}
            description={
              isSystemAdmin
                ? "Use this surface to review ingestion, partner readiness, export evidence, and audit activity."
                : "Use this surface to review reporting quality, partner readiness, users, and governance evidence."
            }
          />
          <p className="mt-2 text-sm leading-6 text-content-subtle">
            The admin workspace stays inside product operations instead of sending users back to
            marketing or booking flows.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={resetDemo}>
              <RefreshCcw className="size-3.5" />
              Reset walkthrough data
            </Button>
            <Link
              href="/field"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <AlertCircle className="size-3.5" />
              Field reporting
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile
            label="Leads"
            count={state.leads.length}
            description="Booked founder demos and inbound lead volume."
            trend={{
              value: `${leadStatusCount.new} new`,
              direction: leadStatusCount.new > 0 ? "up" : "flat",
              context: "Fresh prospect pipeline from booking page.",
            }}
          />
          <MetricTile
            label="Open alerts"
            count={activeAlertCount}
            description="Operational escalations visible to district users."
            trend={{
              value: `${alertCount} total`,
              direction: activeAlertCount > 0 ? "down" : "up",
              context: "Higher means faster decision support is needed.",
            }}
          />
          <MetricTile
            label="Queued reports"
            count={queuedReports}
            description="Offline submissions waiting for sync simulation."
            trend={{
              value: `Export payload built`,
              direction: queuedReports > 0 ? "down" : "flat",
              context: "Local-state-only for demo reliability.",
            }}
          />
        </div>

        {syncSummary ? <PilotReadinessPanel summary={syncSummary} /> : null}
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
            title={isSystemAdmin ? "Access and tenant activity" : "Lead and stakeholder follow-up"}
            description={
              isSystemAdmin
                ? "Review activity that proves the platform can support auditable tenant operations."
                : "Track operational stakeholders and move each follow-up through review."
            }
            actions={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setManualLeadOpen(true)}
              >
                <UserPlus className="size-3.5" />
                Add lead manually
              </Button>
            }
          />
        </section>

        <DemoLeadTable
          leads={leadSorted}
          onLeadStatusChange={(leadId, status) => {
            updateLeadStatus(leadId, status);
          }}
        />

        <div data-admin-section={adminWorkspaceSections[1]}>
          <ExportPreview
            payload={exportPayload}
            onOpen={() => {
              // No-op stub for visual audit in this phase.
            }}
          />
        </div>

        <div data-admin-section={adminWorkspaceSections[2]}>
          <APIPreview clinicCount={clinics.length} onOpen={() => {}} />
        </div>

        <div data-admin-section={adminWorkspaceSections[3]}>
          <RoadmapModules />
        </div>

        <section
          className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
          data-admin-section={adminWorkspaceSections[4]}
        >
          <SectionHeader
            eyebrow="Ops snapshot"
            title="Quick notes"
            description="Short list of talking points before the founder pitch starts."
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

      {manualLeadOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-neutral-950/35 px-3 py-6 backdrop-blur-[1px] sm:place-items-center sm:px-4"
          role="presentation"
          onClick={() => setManualLeadOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Add lead manually"
            className="relative w-full max-w-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Close manual lead entry"
              className="absolute right-3 top-3 z-10 bg-bg-default"
              onClick={() => setManualLeadOpen(false)}
            >
              <X className="size-4" />
            </Button>

            <DemoLeadForm onSubmit={handleLeadSubmit} submitLabel="Add lead to pipeline" />
          </section>
        </div>
      ) : null}
    </div>
  );
}
